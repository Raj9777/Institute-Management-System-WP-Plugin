<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Auth extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/auth/me', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_current_user_profile'),
            'permission_callback' => function() { return is_user_logged_in(); },
        ));

        register_rest_route($this->namespace, '/users', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_plugin_users'),
                'permission_callback' => array($this, 'check_manage_users_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_plugin_user'),
                'permission_callback' => array($this, 'check_manage_users_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/users/(?P<id>\d+)', array(
            'methods'             => 'DELETE',
            'callback'            => array($this, 'delete_plugin_user'),
            'permission_callback' => array($this, 'check_manage_users_permission_write'),
        ));

        register_rest_route($this->namespace, '/users/(?P<id>\d+)/status', array(
            'methods'             => 'PUT',
            'callback'            => array($this, 'toggle_user_status'),
            'permission_callback' => array($this, 'check_manage_users_permission_write'),
        ));

        register_rest_route($this->namespace, '/users/(?P<id>\d+)/capabilities', array(
            'methods'             => 'PUT',
            'callback'            => array($this, 'update_user_capabilities'),
            'permission_callback' => array($this, 'check_manage_users_permission_write'),
        ));

        register_rest_route($this->namespace, '/audit-logs', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_audit_logs'),
            'permission_callback' => array($this, 'check_manage_users_permission'),
        ));
    }

    public function check_manage_users_permission() {
        return $this->check_capability('ims_manage_users');
    }

    public function check_manage_users_permission_write() {
        return $this->check_capability('ims_manage_users', true);
    }

    public function get_current_user_profile() {
        $user = wp_get_current_user();
        $roles = (array) $user->roles;

        return $this->success_response(array(
            'id'           => $user->ID,
            'user_login'   => $user->user_login,
            'display_name' => $user->display_name,
            'email'        => $user->user_email,
            'roles'        => $roles,
            'is_disabled'  => IMS_Roles::is_user_disabled($user->ID),
            'capabilities' => array(
                'manage_users'    => current_user_can('ims_manage_users'),
                'manage_settings' => current_user_can('ims_manage_settings'),
                'manage_academic' => current_user_can('ims_manage_academic'),
                'manage_students' => current_user_can('ims_manage_students'),
                'mark_attendance' => current_user_can('ims_mark_attendance'),
                'view_attendance' => current_user_can('ims_view_attendance'),
                'manage_finances' => current_user_can('ims_manage_finances'),
                'view_payroll'    => current_user_can('ims_view_payroll'),
                'manage_payroll'       => current_user_can('ims_manage_payroll'),
                'view_reports'         => current_user_can('ims_view_reports'),
                'view_staff_sensitive' => current_user_can('ims_view_staff_sensitive'),
            ),
        ));
    }

    public function get_plugin_users() {
        $roles = array('ims_super_admin', 'ims_admin', 'ims_accountant', 'ims_front_desk', 'ims_teacher', 'ims_read_only');
        $users = get_users(array('role__in' => $roles));

        $data = array();
        foreach ($users as $u) {
            $data[] = array(
                'id'           => $u->ID,
                'username'     => $u->user_login,
                'display_name' => $u->display_name,
                'email'        => $u->user_email,
                'roles'        => (array) $u->roles,
                'is_disabled'  => IMS_Roles::is_user_disabled($u->ID),
                'overrides'    => IMS_Roles::get_user_cap_overrides($u->ID),
                'registered'   => $u->user_registered,
            );
        }

        return $this->success_response($data);
    }

    public function create_plugin_user($request) {
        $actor_id = get_current_user_id();
        $username = sanitize_user($request->get_param('username'));
        $email    = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');
        $role     = sanitize_text_field($request->get_param('role'));
        $name     = sanitize_text_field($request->get_param('display_name'));

        if (empty($username) || empty($email) || empty($password) || empty($role)) {
            return $this->error_response('missing_fields', __('All fields are required.', 'institute-management-system'));
        }

        // Hierarchy rule: A user can never assign a role above their own
        if (!IMS_Roles::can_assign_role($actor_id, $role)) {
            return $this->error_response('role_hierarchy_violation', __('You cannot assign a role higher than or equal to your own rank.', 'institute-management-system'), 403);
        }

        if (username_exists($username) || email_exists($email)) {
            return $this->error_response('user_exists', __('Username or Email already exists.', 'institute-management-system'));
        }

        $user_id = wp_create_user($username, $password, $email);
        if (is_wp_error($user_id)) {
            return $this->error_response('create_failed', $user_id->get_error_message());
        }

        $u = new WP_User($user_id);
        $u->set_role($role);
        if (!empty($name)) {
            wp_update_user(array('ID' => $user_id, 'display_name' => $name));
        }

        IMS_Audit::log('user_created', $user_id, "Created plugin user {$username} with role {$role}");

        return $this->success_response(array('id' => $user_id, 'message' => __('Plugin user created successfully.', 'institute-management-system')));
    }

    public function delete_plugin_user($request) {
        $actor_id  = get_current_user_id();
        $target_id = (int) $request['id'];

        if ($target_id === $actor_id) {
            return $this->error_response('self_delete_forbidden', __('You cannot delete your own user account.', 'institute-management-system'), 400);
        }

        $target_user = get_userdata($target_id);
        if (!$target_user) {
            return $this->error_response('not_found', __('User not found.', 'institute-management-system'), 404);
        }

        $target_rank = IMS_Roles::get_user_highest_rank($target_id);
        $actor_rank  = IMS_Roles::get_user_highest_rank($actor_id);

        if ($actor_rank <= $target_rank && !current_user_can('administrator')) {
            return $this->error_response('hierarchy_forbidden', __('You cannot delete a user with an equal or higher role rank.', 'institute-management-system'), 403);
        }

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        $username = $target_user->user_login;
        $deleted  = wp_delete_user($target_id);

        if (!$deleted) {
            return $this->error_response('delete_failed', __('Failed to delete user account.', 'institute-management-system'), 500);
        }

        IMS_Audit::log('user_deleted', $target_id, "Deleted plugin user {$username} (ID #{$target_id})");

        return $this->success_response(array('message' => sprintf(__('User %s has been deleted successfully.', 'institute-management-system'), $username)));
    }

    public function toggle_user_status($request) {
        $actor_id  = get_current_user_id();
        $target_id = (int) $request['id'];
        $disabled  = (bool) $request->get_param('disabled');

        if ($target_id === $actor_id) {
            return $this->error_response('self_disable_forbidden', __('You cannot disable your own user account.', 'institute-management-system'), 400);
        }

        $target_rank = IMS_Roles::get_user_highest_rank($target_id);
        $actor_rank  = IMS_Roles::get_user_highest_rank($actor_id);

        if ($actor_rank <= $target_rank && !current_user_can('administrator')) {
            return $this->error_response('hierarchy_forbidden', __('You cannot modify a user with an equal or higher role rank.', 'institute-management-system'), 403);
        }

        IMS_Roles::set_user_disabled($target_id, $disabled);
        $event = $disabled ? 'user_disabled' : 'user_enabled';
        IMS_Audit::log($event, $target_id, "User status updated to " . ($disabled ? 'disabled' : 'active'));

        return $this->success_response(array('message' => $disabled ? __('User disabled.', 'institute-management-system') : __('User enabled.', 'institute-management-system')));
    }

    public function update_user_capabilities($request) {
        $actor_id  = get_current_user_id();
        $target_id = (int) $request['id'];
        $overrides = (array) $request->get_param('overrides');

        $target_rank = IMS_Roles::get_user_highest_rank($target_id);
        $actor_rank  = IMS_Roles::get_user_highest_rank($actor_id);

        if ($actor_rank <= $target_rank && !current_user_can('administrator')) {
            return $this->error_response('hierarchy_forbidden', __('You cannot modify capabilities of a user with an equal or higher rank.', 'institute-management-system'), 403);
        }

        IMS_Roles::set_user_cap_overrides($target_id, $overrides);
        IMS_Audit::log('capability_overrides_updated', $target_id, $overrides);

        return $this->success_response(array('message' => __('User capability overrides saved successfully.', 'institute-management-system')));
    }

    public function get_audit_logs() {
        $logs = IMS_Audit::get_logs(100, 0);
        return $this->success_response($logs);
    }
}
