<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Reports extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/reports/export', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'export_csv'),
            'permission_callback' => array($this, 'check_reports_permission'),
        ));

        register_rest_route($this->namespace, '/reports/full-export', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'export_full_data'),
            'permission_callback' => array($this, 'check_reports_permission'),
        ));
    }

    public function check_reports_permission() {
        // Data Exports are NEVER gated by license status ($check_write_license = false)
        return $this->check_capability('ims_view_reports', false);
    }

    public function export_csv($request) {
        global $wpdb;
        $type = sanitize_text_field($request->get_param('type'));

        $rows = array();
        $filename = "ims-export-{$type}-" . date('Y-m-d') . ".csv";

        switch ($type) {
            case 'students':
                $table = "{$wpdb->prefix}ims_students";
                $results = $wpdb->get_results("SELECT roll_no, first_name, last_name, gender, phone, email, status, created_at FROM {$table} WHERE deleted_at IS NULL", ARRAY_A);
                $rows = $results;
                break;

            case 'invoices':
                $table = "{$wpdb->prefix}ims_invoices";
                $results = $wpdb->get_results("SELECT invoice_no, gstin, taxable_amount, cgst_amount, sgst_amount, total_tax, total_amount, invoice_date, status FROM {$table} WHERE deleted_at IS NULL", ARRAY_A);
                $rows = $results;
                break;

            case 'payments':
                $table = "{$wpdb->prefix}ims_payments";
                $results = $wpdb->get_results("SELECT receipt_no, amount, payment_mode, reference_no, payment_date, is_reversal, reversal_reason FROM {$table} WHERE deleted_at IS NULL", ARRAY_A);
                $rows = $results;
                break;

            case 'expenses':
                $table = "{$wpdb->prefix}ims_expenses";
                $results = $wpdb->get_results("SELECT voucher_no, category, title, amount, gstin, vendor_name, expense_date, payment_mode FROM {$table} WHERE deleted_at IS NULL", ARRAY_A);
                $rows = $results;
                break;

            default:
                return $this->error_response('invalid_type', __('Invalid export report type.', 'institute-management-system'));
        }

        $bom = "\xEF\xBB\xBF";
        $csv_lines = array();

        if (!empty($rows)) {
            $headers = array_keys($rows[0]);
            $csv_lines[] = implode(',', array_map(function($h) { return '"' . str_replace('"', '""', $h) . '"'; }, $headers));

            foreach ($rows as $row) {
                $line = array_map(function($val) { return '"' . str_replace('"', '""', $val) . '"'; }, array_values($row));
                $csv_lines[] = implode(',', $line);
            }
        }

        $csv_raw = $bom . implode("\n", $csv_lines);

        return $this->success_response(array(
            'filename' => $filename,
            'records'  => $rows,
            'csv_raw'  => $csv_raw,
        ));
    }

    /**
     * Full Data Export (Safety net for host migrations - NEVER gated by license status)
     */
    public function export_full_data() {
        global $wpdb;

        $tables = array(
            'students'   => "{$wpdb->prefix}ims_students",
            'courses'    => "{$wpdb->prefix}ims_courses",
            'batches'    => "{$wpdb->prefix}ims_batches",
            'staff'      => "{$wpdb->prefix}ims_staff",
            'attendance' => "{$wpdb->prefix}ims_attendance",
            'invoices'   => "{$wpdb->prefix}ims_invoices",
            'payments'   => "{$wpdb->prefix}ims_payments",
            'expenses'   => "{$wpdb->prefix}ims_expenses",
            'payroll'    => "{$wpdb->prefix}ims_payroll",
            'sequences'  => "{$wpdb->prefix}ims_sequences",
            'audit_logs' => "{$wpdb->prefix}ims_audit_logs",
        );

        $export_payload = array(
            'version'     => IMS_VERSION,
            'export_date' => current_time('mysql'),
            'site_url'    => get_site_url(),
            'settings'    => get_option('ims_institute_settings', array()),
            'tables'      => array(),
        );

        foreach ($tables as $key => $table_name) {
            $export_payload['tables'][$key] = $wpdb->get_results("SELECT * FROM {$table_name}", ARRAY_A);
        }

        $filename = "ims-full-backup-" . date('Y-m-d') . ".json";

        return $this->success_response(array(
            'filename'  => $filename,
            'data_json' => $export_payload,
        ));
    }
}
