<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Validation {

    /**
     * Assert whether current user is allowed to submit the given date string.
     * Only Super Admin (or WP manage_options) can enter past dates.
     *
     * @param string $date_string Date string in Y-m-d format.
     * @param string $field_label Human-readable field label for error message.
     * @param bool   $allow_future Whether future dates are permitted.
     * @return true|WP_Error Returns true if valid, or WP_Error if restricted.
     */
    public static function assert_date_allowed($date_string, $field_label = 'Date', $allow_future = false) {
        // Super admin users and manage_options capability holders bypass past-date restrictions
        if (current_user_can('manage_options') || current_user_can('ims_super_admin')) {
            return true;
        }

        $user = wp_get_current_user();
        if ($user && is_array($user->roles) && in_array('ims_super_admin', $user->roles, true)) {
            return true;
        }

        if (empty($date_string)) {
            return new WP_Error(
                'invalid_date',
                sprintf(__('%s is required.', 'institute-management-system'), $field_label),
                array('status' => 422)
            );
        }

        // Standardize Y-m-d format
        $submitted_time = strtotime($date_string);
        if (false === $submitted_time) {
            return new WP_Error(
                'invalid_date',
                sprintf(__('Invalid date format for %s.', 'institute-management-system'), $field_label),
                array('status' => 422)
            );
        }

        $submitted_date = date('Y-m-d', $submitted_time);
        $today          = current_time('Y-m-d'); // Respects WordPress timezone setting
        $yesterday      = date('Y-m-d', strtotime('-1 day', strtotime($today)));
        $tomorrow       = date('Y-m-d', strtotime('+1 day', strtotime($today)));

        // 1. Past Date check for non-Super Admin (allow yesterday as grace period for timezone offsets)
        if ($submitted_date < $yesterday) {
            return new WP_Error(
                'backdate_restricted',
                sprintf(__('Back-dated %s entries are restricted to Super Admin.', 'institute-management-system'), strtolower($field_label)),
                array('status' => 422)
            );
        }

        // 2. Future Date check (allow tomorrow as grace period for timezone offsets)
        if (!$allow_future && $submitted_date > $tomorrow) {
            return new WP_Error(
                'future_date_restricted',
                sprintf(__('%s cannot be in the future.', 'institute-management-system'), $field_label),
                array('status' => 422)
            );
        }

        return true;
    }
}
