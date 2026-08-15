<?php
/**
 * Bare Template for Institute Management System Front-End App Shell
 * No theme headers, footers, sidebars, or widget areas.
 */

if (!defined('ABSPATH')) {
    exit;
}

$settings     = get_option('ims_institute_settings', array());
$inst_name    = !empty($settings['institute_name']) ? $settings['institute_name'] : 'Institute Management System';
$inst_tagline = !empty($settings['tagline']) ? $settings['tagline'] : '';
$dist_url     = IMS_PLUGIN_URL . 'assets/dist/';
$dist_dir     = IMS_PLUGIN_DIR . 'assets/dist/';

$is_logged_in = is_user_logged_in();
$user         = wp_get_current_user();
$ims_roles    = array('ims_super_admin', 'ims_admin', 'ims_accountant', 'ims_front_desk', 'ims_teacher', 'ims_read_only');

$has_ims_role = false;
if ($is_logged_in) {
    if (array_intersect((array) $user->roles, $ims_roles) || current_user_can('manage_options') || current_user_can('ims_manage_students')) {
        $has_ims_role = true;
    }
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($inst_name); ?> — <?php _e('Institute Management', 'institute-management-system'); ?></title>
    
    <?php if (file_exists($dist_dir . 'ims-admin.css')) : ?>
        <link rel="stylesheet" id="ims-admin-style-css" href="<?php echo esc_url($dist_url . 'ims-admin.css?ver=' . filemtime($dist_dir . 'ims-admin.css')); ?>" type="text/css" media="all" />
    <?php endif; ?>

    <style>
        :root {
            --ims-bg: #f8fafc;
            --ims-card-bg: #ffffff;
            --ims-text-main: #0f172a;
            --ims-text-muted: #64748b;
            --ims-primary: #2563eb;
            --ims-primary-hover: #1d4ed8;
            --ims-border: #e2e8f0;
            --ims-danger-bg: #fef2f2;
            --ims-danger-text: #991b1b;
            --ims-danger-border: #fecaca;
        }

        body.ims-bare-shell {
            margin: 0;
            padding: 0;
            background-color: var(--ims-bg);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: var(--ims-text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .ims-auth-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .ims-auth-card {
            background: var(--ims-card-bg);
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            width: 100%;
            max-width: 420px;
            padding: 40px;
            border: 1px solid var(--ims-border);
        }

        .ims-auth-header {
            text-align: center;
            margin-bottom: 28px;
        }

        .ims-auth-icon {
            width: 56px;
            height: 56px;
            background: #eff6ff;
            color: var(--ims-primary);
            border-radius: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
        }

        .ims-auth-title {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 6px 0;
            color: var(--ims-text-main);
        }

        .ims-auth-subtitle {
            font-size: 14px;
            color: var(--ims-text-muted);
            margin: 0;
        }

        .ims-auth-error {
            background-color: var(--ims-danger-bg);
            color: var(--ims-danger-text);
            border: 1px solid var(--ims-danger-border);
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ims-form-group {
            margin-bottom: 20px;
        }

        .ims-form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
        }

        .ims-form-control {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid var(--ims-border);
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .ims-form-control:focus {
            border-color: var(--ims-primary);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .ims-btn-submit {
            width: 100%;
            padding: 12px 20px;
            background-color: var(--ims-primary);
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .ims-btn-submit:hover {
            background-color: var(--ims-primary-hover);
        }

        .ims-auth-footer {
            margin-top: 24px;
            text-align: center;
            font-size: 13px;
            color: var(--ims-text-muted);
        }

        .ims-auth-footer a {
            color: var(--ims-primary);
            text-decoration: none;
            font-weight: 600;
        }

        .ims-no-role-box {
            text-align: center;
        }

        .ims-no-role-box p {
            font-size: 15px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 24px;
        }
    </style>
</head>
<body class="ims-bare-shell">

<?php if (!$is_logged_in) : ?>

    <!-- State 1: Anonymous / Not Logged In -> Styled Light Theme Login Form -->
    <div class="ims-auth-wrapper">
        <div class="ims-auth-card">
            <div class="ims-auth-header">
                <div class="ims-auth-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 21h18"/>
                        <path d="M3 7v14"/>
                        <path d="M21 7v14"/>
                        <path d="M6 21V11"/>
                        <path d="M10 21V11"/>
                        <path d="M14 21V11"/>
                        <path d="M18 21V11"/>
                        <polygon points="12 3 2 7 22 7 12 3"/>
                    </svg>
                </div>
                <h1 class="ims-auth-title"><?php echo esc_html($inst_name); ?></h1>
                <p class="ims-auth-subtitle"><?php echo !empty($inst_tagline) ? esc_html($inst_tagline) : __('Staff Portal Login', 'institute-management-system'); ?></p>
            </div>

            <?php if (isset($_GET['login_error'])) : ?>
                <div class="ims-auth-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span><?php _e('Invalid username, email address, or password.', 'institute-management-system'); ?></span>
                </div>
            <?php endif; ?>

            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                <input type="hidden" name="action" value="ims_frontend_login">
                <?php wp_nonce_field('ims_frontend_login_action', 'ims_frontend_login_nonce'); ?>

                <div class="ims-form-group">
                    <label for="user_log"><?php _e('Username or Email Address', 'institute-management-system'); ?></label>
                    <input type="text" name="log" id="user_log" class="ims-form-control" required autocomplete="username" autofocus>
                </div>

                <div class="ims-form-group">
                    <label for="user_pwd"><?php _e('Password', 'institute-management-system'); ?></label>
                    <input type="password" name="pwd" id="user_pwd" class="ims-form-control" required autocomplete="current-password">
                </div>

                <div class="ims-form-group" style="display: flex; align-items: center; justify-content: space-between;">
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; margin-bottom: 0; cursor: pointer;">
                        <input type="checkbox" name="rememberme" value="forever">
                        <span><?php _e('Remember me', 'institute-management-system'); ?></span>
                    </label>
                </div>

                <button type="submit" class="ims-btn-submit"><?php _e('Sign In to IMS', 'institute-management-system'); ?></button>
            </form>

            <div class="ims-auth-footer">
                <span><?php _e('Protected Staff System', 'institute-management-system'); ?></span>
            </div>
        </div>
    </div>

<?php elseif (!$has_ims_role) : ?>

    <!-- State 2: Logged In but NO IMS Role Assigned -->
    <div class="ims-auth-wrapper">
        <div class="ims-auth-card ims-no-role-box">
            <div class="ims-auth-icon" style="background: #fff7ed; color: #ea580c;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            </div>
            <h1 class="ims-auth-title"><?php _e('Access Restricted', 'institute-management-system'); ?></h1>
            <p><?php _e("Your account isn't set up for Institute Management. Contact your Super Admin.", 'institute-management-system'); ?></p>
            
            <a href="<?php echo esc_url(IMS_Frontend::get_logout_url()); ?>" class="ims-btn-submit" style="display: block; text-decoration: none; box-sizing: border-radius: 8px;">
                <?php _e('Log Out', 'institute-management-system'); ?>
            </a>
        </div>
    </div>

<?php else : ?>

    <!-- State 3: Logged In WITH IMS Role -> Render React App Container -->
    <div id="ims-root">
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #64748b;">
            <div style="text-align: center;">
                <div style="width: 44px; height: 44px; border: 3.5px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: ims-spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
                <p style="font-size: 15px; font-weight: 600; margin: 0; color: #0f172a;"><?php echo esc_html($inst_name); ?></p>
                <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;"><?php _e('Loading Staff Portal...', 'institute-management-system'); ?></p>
            </div>
        </div>
        <style>@keyframes ims-spin { to { transform: rotate(360deg); } }</style>
    </div>

    <script type="text/javascript">
        window.imsData = <?php echo wp_json_encode(array(
            'root'             => esc_url_raw(rest_url()),
            'nonce'            => wp_create_nonce('wp_rest'),
            'pluginUrl'        => IMS_PLUGIN_URL,
            'appUrl'           => IMS_Frontend::get_app_url(),
            'logoutUrl'        => IMS_Frontend::get_logout_url(),
            'currentUser'      => array(
                'id'             => get_current_user_id(),
                'display_name'   => $user ? $user->display_name : '',
                'roles'          => ($user && isset($user->roles)) ? (array) $user->roles : array(),
                'is_super_admin' => current_user_can('manage_options') || current_user_can('ims_super_admin') || ($user && in_array('ims_super_admin', (array) $user->roles)),
                'capabilities'   => array(
                    'manage_users'         => current_user_can('ims_manage_users'),
                    'manage_settings'      => current_user_can('ims_manage_settings'),
                    'manage_academic'      => current_user_can('ims_manage_academic'),
                    'manage_students'      => current_user_can('ims_manage_students'),
                    'mark_attendance'      => current_user_can('ims_mark_attendance'),
                    'view_attendance'      => current_user_can('ims_view_attendance'),
                    'manage_finances'      => current_user_can('ims_manage_finances'),
                    'view_payroll'         => current_user_can('ims_view_payroll'),
                    'manage_payroll'       => current_user_can('ims_manage_payroll'),
                    'view_reports'         => current_user_can('ims_view_reports'),
                    'view_staff_sensitive' => current_user_can('ims_view_staff_sensitive'),
                )
            )
        )); ?>;
    </script>

    <?php if (file_exists($dist_dir . 'ims-admin.js')) : ?>
        <script type="text/javascript" src="<?php echo esc_url($dist_url . 'ims-admin.js?ver=' . filemtime($dist_dir . 'ims-admin.js')); ?>"></script>
    <?php endif; ?>

<?php endif; ?>

</body>
</html>
