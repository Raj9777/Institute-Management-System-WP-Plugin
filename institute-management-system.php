<?php
/**
 * Plugin Name: Institute Management System
 * Plugin URI:  https://example.com/institute-management-system
 * Description: Complete Institute Management System WordPress Plugin. Features custom database tables via dbDelta, custom user roles, REST API framework under ims/v1, Indian GST invoicing, student admission, attendance, fee receipts, and payroll.
 * Version:     1.0.0
 * Author:      Pixe
 * Author URI:  https://example.com
 * License:     GPL-2.0+
 * Text Domain: institute-management-system
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Plugin Constants
if (!defined('IMS_VERSION')) define('IMS_VERSION', '1.0.0');
if (!defined('IMS_PLUGIN_DIR')) define('IMS_PLUGIN_DIR', plugin_dir_path(__FILE__));
if (!defined('IMS_PLUGIN_URL')) define('IMS_PLUGIN_URL', plugin_dir_url(__FILE__));
if (!defined('IMS_PLUGIN_FILE')) define('IMS_PLUGIN_FILE', __FILE__);
if (!defined('IMS_REST_NAMESPACE')) define('IMS_REST_NAMESPACE', 'ims/v1');
if (!defined('IMS_DB_VERSION')) define('IMS_DB_VERSION', '1.1.0');

// Autoload core files
require_once IMS_PLUGIN_DIR . 'includes/class-ims-activator.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-deactivator.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-roles.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-frontend.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-validation.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-helper.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-db-base.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-db.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-audit.php';
require_once IMS_PLUGIN_DIR . 'includes/class-ims-updater.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-base.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-ping.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-auth.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-settings.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-courses.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-batches.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-students.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-staff.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-attendance.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-finances.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-expenses.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-payroll.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-dashboard.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-reports.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-upload.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-enquiries.php';
require_once IMS_PLUGIN_DIR . 'includes/api/class-ims-rest-agreements.php';

/**
 * Main Plugin Class
 */
class Institute_Management_System {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        register_activation_hook(IMS_PLUGIN_FILE, array('IMS_Activator', 'activate'));
        register_deactivation_hook(IMS_PLUGIN_FILE, array('IMS_Deactivator', 'deactivate'));

        add_action('plugins_loaded', array($this, 'init'));
        add_action('admin_menu', array($this, 'register_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_filter('rest_post_dispatch', array($this, 'normalize_rest_errors'), 10, 3);

        // Initialize front-end application shell
        IMS_Frontend::get_instance();

        // Initialize private commercial update checker
        IMS_Updater::get_instance();
    }

    public function init() {
        // Auto-ensure custom plugin database tables and schema migrations are always up to date
        $installed_db_ver = get_option('ims_db_version', '0.0.0');
        if (version_compare($installed_db_ver, IMS_DB_VERSION, '<')) {
            IMS_Activator::activate();
            update_option('ims_db_version', IMS_DB_VERSION);
        } else {
            global $wpdb;
            $table_check = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->prefix}ims_courses'");
            if (empty($table_check)) {
                IMS_Activator::activate();
                update_option('ims_db_version', IMS_DB_VERSION);
            }
        }
    }

    public function register_admin_menu() {
        add_menu_page(
            __('Institute Management System', 'institute-management-system'),
            __('IMS Dashboard', 'institute-management-system'),
            'read',
            'institute-management-system',
            array($this, 'render_admin_page'),
            'dashicons-bank',
            30
        );
    }

    public function render_admin_page() {
        echo '<div id="ims-root">
            <div style="display: flex; align-items: center; justify-content: center; min-height: 400px; font-family: sans-serif; color: #64748b;">
                <div style="text-align: center;">
                    <div style="width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: ims-spin 0.8s linear infinite; margin: 0 auto 12px;"></div>
                    <p style="font-size: 14px; font-weight: 600; margin: 0;">Loading IMS Dashboard...</p>
                </div>
            </div>
            <style>@keyframes ims-spin { to { transform: rotate(360deg); } }</style>
        </div>';
    }

    public function enqueue_admin_assets($hook = '') {
        $page = isset($_GET['page']) ? sanitize_text_field($_GET['page']) : '';
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;

        $is_ims_page = false;
        if (!empty($page) && strpos($page, 'institute-management-system') !== false) {
            $is_ims_page = true;
        } elseif (!empty($hook) && strpos($hook, 'institute-management-system') !== false) {
            $is_ims_page = true;
        } elseif ($screen && !empty($screen->id) && strpos($screen->id, 'institute-management-system') !== false) {
            $is_ims_page = true;
        }

        if (!$is_ims_page) {
            return;
        }

        // Prevent WordPress svg-painter.js undefined TypeError on custom admin pages
        add_action('admin_head', function() {
            echo '<script>window.wp = window.wp || {}; if (!window.wp.svgPainter) { window.wp.svgPainter = { init: function() {}, paint: function() {}, setColors: function() {} }; }</script>' . "\n";
        });

        $dist_dir  = IMS_PLUGIN_DIR . 'assets/dist/';
        $dist_url  = IMS_PLUGIN_URL . 'assets/dist/';
        $js_file   = 'ims-admin.js';
        $css_file  = 'ims-admin.css';

        if (file_exists($dist_dir . $css_file)) {
            wp_enqueue_style(
                'ims-admin-style',
                $dist_url . $css_file,
                array(),
                filemtime($dist_dir . $css_file)
            );
        }

        if (file_exists($dist_dir . $js_file)) {
            wp_enqueue_script(
                'ims-admin-script',
                $dist_url . $js_file,
                array('jquery'),
                filemtime($dist_dir . $js_file),
                true
            );

            wp_localize_script('ims-admin-script', 'imsData', array(
                'root'             => esc_url_raw(rest_url()),
                'nonce'            => wp_create_nonce('wp_rest'),
                'pluginUrl'        => IMS_PLUGIN_URL,
                'appUrl'           => IMS_Frontend::get_app_url(),
                'logoutUrl'        => IMS_Frontend::get_logout_url(),
                'settings'         => get_option('ims_institute_settings', array()),
                'currentUser'      => array(
                    'id'             => get_current_user_id(),
                    'display_name'   => wp_get_current_user()->display_name,
                    'roles'          => (array) wp_get_current_user()->roles,
                    'is_super_admin' => current_user_can('manage_options') || current_user_can('ims_super_admin') || in_array('ims_super_admin', (array) wp_get_current_user()->roles),
                    'capabilities'   => array(
                        'manage_users'    => current_user_can('ims_manage_users'),
                        'manage_settings' => current_user_can('ims_manage_settings'),
                        'manage_academic' => current_user_can('ims_manage_academic'),
                        'manage_students' => current_user_can('ims_manage_students'),
                        'mark_attendance' => current_user_can('ims_mark_attendance'),
                        'view_attendance' => current_user_can('ims_view_attendance'),
                        'manage_finances' => current_user_can('ims_manage_finances'),
                        'view_payroll'         => current_user_can('ims_view_payroll'),
                        'manage_payroll'       => current_user_can('ims_manage_payroll'),
                        'view_reports'         => current_user_can('ims_view_reports'),
                        'view_staff_sensitive' => current_user_can('ims_view_staff_sensitive'),
                    )
                )
            ));
        }
    }

    public function register_rest_routes() {
        $controllers = array(
            new IMS_REST_Ping(),
            new IMS_REST_Auth(),
            new IMS_REST_Settings(),
            new IMS_REST_Courses(),
            new IMS_REST_Batches(),
            new IMS_REST_Students(),
            new IMS_REST_Staff(),
            new IMS_REST_Attendance(),
            new IMS_REST_Finances(),
            new IMS_REST_Expenses(),
            new IMS_REST_Payroll(),
            new IMS_REST_Dashboard(),
            new IMS_REST_Reports(),
            new IMS_REST_Upload(),
            new IMS_REST_Enquiries(),
            new IMS_REST_Agreements(),
        );

        foreach ($controllers as $controller) {
            $controller->register_routes();
        }
    }

    public function normalize_rest_errors($response, $server, $request) {
        if ($response instanceof WP_Error) {
            $route = $request->get_route();
            if (strpos($route, '/ims/v1') === 0) {
                $code = $response->get_error_code();
                $message = $response->get_error_message();
                $status = 400;
                if (in_array($code, array('ims_forbidden', 'ims_unauthorized', 'rest_forbidden', 'rest_unauthorized'))) {
                    $code = 'PERMISSION_DENIED';
                    $status = 403;
                }
                $res = new WP_REST_Response(array(
                    'ok'    => false,
                    'data'  => null,
                    'error' => array(
                        'code'    => $code,
                        'message' => $message,
                    ),
                ), $status);
                $res->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
                $res->header('Pragma', 'no-cache');
                $res->header('Expires', '0');
                return $res;
            }
        } elseif ($response instanceof WP_HTTP_Response || $response instanceof WP_REST_Response) {
            $route = $request->get_route();
            if (strpos($route, '/ims/v1') === 0) {
                $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
                $response->header('Pragma', 'no-cache');
                $response->header('Expires', '0');

                if (method_exists($response, 'is_error') && $response->is_error()) {
                    $error_data = $response->get_data();
                    $status = $response->get_status();
                    $code = isset($error_data['code']) ? $error_data['code'] : 'rest_error';
                    $message = isset($error_data['message']) ? $error_data['message'] : __('An error occurred.', 'institute-management-system');

                    if ($status === 403 || $status === 401 || in_array($code, array('ims_forbidden', 'ims_unauthorized', 'rest_forbidden', 'rest_unauthorized'))) {
                        $code = 'PERMISSION_DENIED';
                    }

                    $err_res = new WP_REST_Response(array(
                        'ok'    => false,
                        'data'  => null,
                        'error' => array(
                            'code'    => $code,
                            'message' => $message,
                        ),
                    ), $status);
                    $err_res->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
                    $err_res->header('Pragma', 'no-cache');
                    $err_res->header('Expires', '0');
                    return $err_res;
                }
            }
        }
        return $response;
    }
}

Institute_Management_System::get_instance();
