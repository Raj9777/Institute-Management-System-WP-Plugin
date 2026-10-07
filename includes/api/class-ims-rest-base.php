<?php

if (!defined('ABSPATH')) {
    exit;
}

abstract class IMS_REST_Base {

    protected $namespace = IMS_REST_NAMESPACE;

    abstract public function register_routes();

    protected function success_response($data = null, $status = 200) {
        $response = new WP_REST_Response(array(
            'ok'    => true,
            'data'  => $data,
            'error' => null,
        ), $status);
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');
        return $response;
    }

    protected function error_response($code, $message, $status = 400) {
        $response = new WP_REST_Response(array(
            'ok'    => false,
            'data'  => null,
            'error' => array(
                'code'    => $code,
                'message' => $message,
            ),
        ), $status);
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');
        return $response;
    }

    protected function check_capability($capability, $check_write_license = false) {
        if (!is_user_logged_in()) {
            return new WP_Error('ims_unauthorized', __('User is not logged in.', 'institute-management-system'), array('status' => 401));
        }

        $user_id = get_current_user_id();

        // Check disabled status
        if (IMS_Roles::is_user_disabled($user_id)) {
            return new WP_Error('ims_user_disabled', __('Your account has been disabled by the Institute Super Admin.', 'institute-management-system'), array('status' => 403));
        }

        if (!current_user_can($capability) && !current_user_can('administrator')) {
            return new WP_Error('ims_forbidden', __('You do not have permission to access this resource.', 'institute-management-system'), array('status' => 403));
        }

        return true;
    }
}
