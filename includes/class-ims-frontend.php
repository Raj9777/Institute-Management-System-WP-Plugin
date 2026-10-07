<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Frontend {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_filter('template_include', array($this, 'template_include'));
        add_action('admin_init', array($this, 'admin_init_lockout'));
        add_action('admin_post_ims_frontend_login', array($this, 'handle_frontend_login'));
        add_action('admin_post_nopriv_ims_frontend_login', array($this, 'handle_frontend_login'));
        add_action('admin_post_ims_frontend_logout', array($this, 'handle_frontend_logout'));
        add_action('admin_post_nopriv_ims_frontend_logout', array($this, 'handle_frontend_logout'));
        add_shortcode('ims_launch_button', array($this, 'render_launch_button_shortcode'));
    }

    /**
     * Get the configured app page slug
     */
    public static function get_app_slug() {
        $settings = get_option('ims_institute_settings', array());
        return !empty($settings['app_slug']) ? sanitize_title($settings['app_slug']) : 'institute-app';
    }

    /**
     * Get the full front-end app URL
     */
    /**
     * Get the full front-end app URL
     */
    public static function get_app_url() {
        $page_id = get_option('ims_app_page_id');
        if (!$page_id || get_post_status($page_id) !== 'publish') {
            $page_id = self::create_app_page();
        }
        if ($page_id && get_post_status($page_id) === 'publish') {
            return get_permalink($page_id);
        }
        return home_url('/' . self::get_app_slug() . '/');
    }

    /**
     * Get the front-end app logout URL
     */
    public static function get_logout_url() {
        return add_query_arg('action', 'ims_logout', self::get_app_url());
    }

    /**
     * Create or update the app page on plugin activation or settings update
     */
    public static function create_app_page($slug = null) {
        if (null === $slug) {
            $slug = self::get_app_slug();
        }

        $page_id = get_option('ims_app_page_id');

        if ($page_id && get_post($page_id)) {
            $existing_page = get_post($page_id);
            if ($existing_page->post_name !== $slug || $existing_page->post_status !== 'publish') {
                wp_update_post(array(
                    'ID'          => $page_id,
                    'post_name'   => $slug,
                    'post_status' => 'publish',
                ));
            }
            return $page_id;
        }

        // Search by slug if option is missing
        $existing = get_page_by_path($slug);
        if ($existing) {
            update_option('ims_app_page_id', $existing->ID);
            return $existing->ID;
        }

        // Create new page
        $new_page_id = wp_insert_post(array(
            'post_title'     => __('Institute Management System', 'institute-management-system'),
            'post_name'      => $slug,
            'post_content'   => '<!-- ims_app -->',
            'post_status'    => 'publish',
            'post_type'      => 'page',
            'comment_status' => 'closed',
            'ping_status'    => 'closed',
        ));

        if (!is_wp_error($new_page_id) && $new_page_id > 0) {
            update_option('ims_app_page_id', $new_page_id);
            return $new_page_id;
        }

        return false;
    }

    /**
     * Intercept template rendering for the institute app page
     */
    public function template_include($template) {
        $page_id = get_option('ims_app_page_id');
        $is_app_page = false;

        if ($page_id && is_page($page_id)) {
            $is_app_page = true;
        } else {
            $current_slug = self::get_app_slug();
            if (is_page($current_slug)) {
                $is_app_page = true;
            } else {
                $request_uri = isset($_SERVER['REQUEST_URI']) ? strtok($_SERVER['REQUEST_URI'], '?') : '';
                if (!empty($request_uri) && trim($request_uri, '/') === trim($current_slug, '/')) {
                    $is_app_page = true;
                }
            }
        }

        if ($is_app_page) {
            // Handle direct logout request on the app route
            if (isset($_GET['action']) && $_GET['action'] === 'ims_logout') {
                $this->handle_frontend_logout();
            }

            $custom_template = IMS_PLUGIN_DIR . 'includes/templates/template-app.php';
            if (file_exists($custom_template)) {
                return $custom_template;
            }
        }

        return $template;
    }

    /**
     * Handle logout action: calls wp_logout() and immediately redirects back to the front-end app URL
     */
    public function handle_frontend_logout() {
        wp_logout();
        wp_safe_redirect(self::get_app_url());
        exit;
    }

    /**
     * Handle login submitted from the front-end login form
     */
    public function handle_frontend_login() {
        $username = isset($_POST['log']) ? sanitize_text_field(wp_unslash($_POST['log'])) : '';
        $password = isset($_POST['pwd']) ? $_POST['pwd'] : ''; // do not sanitize password
        $remember = !empty($_POST['rememberme']);

        if (empty($username) || empty($password)) {
            $app_url = add_query_arg('login_error', 'invalid_credentials', self::get_app_url());
            wp_safe_redirect($app_url);
            exit;
        }

        $creds = array(
            'user_login'    => $username,
            'user_password' => $password,
            'remember'      => $remember,
        );

        $user = wp_signon($creds, is_ssl());

        if (is_wp_error($user)) {
            // Redirect back to app page with generic error code (no info leakage about username existence)
            $app_url = add_query_arg('login_error', 'invalid_credentials', self::get_app_url());
            wp_safe_redirect($app_url);
            exit;
        }

        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, $remember);

        wp_safe_redirect(self::get_app_url());
        exit;
    }

    /**
     * wp-admin lockout for plugin-only users (no core WP capabilities)
     */
    public function admin_init_lockout() {
        // Allow admin-ajax.php and admin-post.php through
        if (defined('DOING_AJAX') && DOING_AJAX) {
            return;
        }

        $script_name = isset($_SERVER['PHP_SELF']) ? basename($_SERVER['PHP_SELF']) : '';
        if ($script_name === 'admin-ajax.php' || $script_name === 'admin-post.php') {
            return;
        }

        // Allow IMS plugin admin pages through
        $page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';
        if (!empty($page) && strpos($page, 'institute-management-system') !== false) {
            return;
        }

        if (!is_user_logged_in()) {
            return;
        }

        // Users holding core WP capabilities (site owners, editors, authors, etc.) keep wp-admin access
        if (current_user_can('manage_options') || current_user_can('edit_posts') || current_user_can('edit_pages') || current_user_can('publish_posts')) {
            return;
        }

        // Check if user has IMS capabilities/roles (staff members with only ims roles)
        $user = wp_get_current_user();
        $ims_roles = array('ims_super_admin', 'ims_admin', 'ims_accountant', 'ims_front_desk', 'ims_teacher', 'ims_read_only');
        $has_ims_role = (bool) array_intersect((array) $user->roles, $ims_roles);

        // If plugin-only staff user, redirect away from wp-admin to the front-end app URL
        if ($has_ims_role) {
            wp_safe_redirect(self::get_app_url());
            exit;
        }
    }

    /**
     * Shortcode [ims_launch_button label="..." style="..."]
     */
    public function render_launch_button_shortcode($atts) {
        $default_label = is_user_logged_in() 
            ? __('Launch Institute App', 'institute-management-system')
            : __('Staff Login', 'institute-management-system');

        $atts = shortcode_atts(array(
            'label' => $default_label,
            'style' => '',
        ), $atts, 'ims_launch_button');

        $app_url = esc_url(self::get_app_url());
        $label   = esc_html($atts['label']);
        $style   = esc_attr($atts['style']);

        $default_styles = 'display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; transition: background-color 0.2s ease; border: none; cursor: pointer;';

        $inline_style = !empty($style) ? $default_styles . ' ' . $style : $default_styles;

        return sprintf(
            '<a href="%s" class="ims-launch-button" style="%s">%s</a>',
            $app_url,
            $inline_style,
            $label
        );
    }
}
