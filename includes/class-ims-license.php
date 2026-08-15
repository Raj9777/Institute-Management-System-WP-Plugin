<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_License {

    public static function get_license_data() {
        return array(
            'status'      => 'active',
            'expires_at'  => null,
            'last_check'  => time(),
            'grace_until' => null,
            'license_key' => 'UNLIMITED',
        );
    }

    public static function verify_key($license_key = '') {
        return array('valid' => true, 'message' => __('Active.', 'institute-management-system'));
    }

    public static function scheduled_license_check() {
        // No-op: Licencing checks removed
    }

    public static function can_write() {
        return true;
    }
}
