<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/class-ims-db-base.php';

class IMS_Audit extends IMS_DB_Base {

    public static function log($event_type, $target_id = 0, $details = '', $actor_id = null) {
        if (null === $actor_id) {
            $actor_id = get_current_user_id();
        }

        $ip_address = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '';

        return self::insert('audit_logs', array(
            'event_type' => sanitize_text_field($event_type),
            'actor_id'   => intval($actor_id),
            'target_id'  => intval($target_id),
            'details'    => is_array($details) ? json_encode($details) : sanitize_textarea_field($details),
            'ip_address' => $ip_address,
        ), array('%s', '%d', '%d', '%s', '%s'));
    }

    public static function get_logs($limit = 50, $offset = 0) {
        $table = self::get_table_name('audit_logs');
        return self::get_results("SELECT * FROM {$table} ORDER BY created_at DESC LIMIT %d OFFSET %d", $limit, $offset);
    }
}
