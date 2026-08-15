<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Deactivator {

    public static function deactivate() {
        $timestamp = wp_next_scheduled('ims_cron_license_check');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'ims_cron_license_check');
        }
        flush_rewrite_rules();
    }
}
