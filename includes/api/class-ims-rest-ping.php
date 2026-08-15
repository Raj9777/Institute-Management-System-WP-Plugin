<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Ping extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/ping', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'handle_ping'),
            'permission_callback' => array($this, 'check_ping_permission'),
        ));
    }

    public function check_ping_permission() {
        // Real permission callback checking user is logged in
        if (!is_user_logged_in()) {
            return new WP_Error('ims_unauthorized', __('User is not logged in.', 'institute-management-system'), array('status' => 401));
        }
        return true;
    }

    public function handle_ping() {
        $user = wp_get_current_user();
        return $this->success_response(array(
            'message'   => 'pong',
            'user_id'   => $user->ID,
            'user_login'=> $user->user_login,
            'roles'     => (array) $user->roles,
            'timestamp' => current_time('mysql'),
        ));
    }
}
