<?php
/**
 * Fired when the plugin is uninstalled via WordPress admin.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$confirm_uninstall = get_option('ims_confirm_uninstall', false);

if ($confirm_uninstall) {
    global $wpdb;

    $tables = array(
        "{$wpdb->prefix}ims_students",
        "{$wpdb->prefix}ims_courses",
        "{$wpdb->prefix}ims_batches",
        "{$wpdb->prefix}ims_staff",
        "{$wpdb->prefix}ims_attendance",
        "{$wpdb->prefix}ims_invoices",
        "{$wpdb->prefix}ims_payments",
        "{$wpdb->prefix}ims_expenses",
        "{$wpdb->prefix}ims_payroll",
        "{$wpdb->prefix}ims_payroll_runs",
        "{$wpdb->prefix}ims_sequences",
        "{$wpdb->prefix}ims_audit_logs",
        "{$wpdb->prefix}ims_enquiries",
        "{$wpdb->prefix}ims_vendors",
        "{$wpdb->prefix}ims_staff_bank_details",
        "{$wpdb->prefix}ims_admission_agreements",
    );

    foreach ($tables as $table) {
        $wpdb->query("DROP TABLE IF EXISTS {$table}");
    }

    delete_option('ims_license_key');
    delete_option('ims_license_data');
    delete_option('ims_institute_settings');
    delete_option('ims_confirm_uninstall');

    remove_role('ims_super_admin');
    remove_role('ims_admin');
    remove_role('ims_accountant');
    remove_role('ims_front_desk');
    remove_role('ims_teacher');
    remove_role('ims_read_only');
}
