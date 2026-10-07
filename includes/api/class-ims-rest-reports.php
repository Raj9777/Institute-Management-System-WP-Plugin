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
                $sql = "
                    SELECT s.roll_no, s.first_name, s.last_name, s.gender, s.phone, s.email,
                           COALESCE(c.name, 'Unassigned') AS course_name,
                           COALESCE(b.name, 'Unassigned') AS batch_name,
                           s.status,
                           CAST(s.net_fee AS DECIMAL(12,2)) AS net_fee,
                           CAST(COALESCE(p.paid, 0) AS DECIMAL(12,2)) AS total_paid,
                           CAST(GREATEST(0, (s.net_fee - COALESCE(p.paid, 0))) AS DECIMAL(12,2)) AS outstanding_balance,
                           DATE(s.created_at) AS admission_date
                    FROM {$table} s
                    LEFT JOIN {$wpdb->prefix}ims_courses c ON s.course_id = c.id
                    LEFT JOIN {$wpdb->prefix}ims_batches b ON s.batch_id = b.id
                    LEFT JOIN (
                        SELECT student_id, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS paid
                        FROM {$wpdb->prefix}ims_payments
                        WHERE deleted_at IS NULL
                        GROUP BY student_id
                    ) p ON s.id = p.student_id
                    WHERE s.deleted_at IS NULL
                    ORDER BY s.id DESC
                ";
                $rows = $wpdb->get_results($sql, ARRAY_A);
                break;

            case 'invoices':
                $table = "{$wpdb->prefix}ims_invoices";
                $sql = "
                    SELECT i.invoice_no, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.roll_no,
                           i.gstin, i.taxable_amount, i.cgst_amount, i.sgst_amount, i.total_tax, i.total_amount,
                           i.invoice_date, i.status
                    FROM {$table} i
                    LEFT JOIN {$wpdb->prefix}ims_students s ON i.student_id = s.id
                    WHERE i.deleted_at IS NULL
                    ORDER BY i.id DESC
                ";
                $rows = $wpdb->get_results($sql, ARRAY_A);
                break;

            case 'payments':
                $table = "{$wpdb->prefix}ims_payments";
                $sql = "
                    SELECT p.receipt_no, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.roll_no,
                           p.amount, p.payment_mode, p.reference_no, p.payment_date,
                           p.is_reversal, p.reversal_reason
                    FROM {$table} p
                    LEFT JOIN {$wpdb->prefix}ims_students s ON p.student_id = s.id
                    WHERE p.deleted_at IS NULL
                    ORDER BY p.id DESC
                ";
                $rows = $wpdb->get_results($sql, ARRAY_A);
                break;

            case 'expenses':
                $table = "{$wpdb->prefix}ims_expenses";
                $sql = "
                    SELECT voucher_no, category, title, description, amount, gstin, vendor_name, expense_date, payment_mode
                    FROM {$table}
                    WHERE deleted_at IS NULL
                    ORDER BY expense_date DESC, id DESC
                ";
                $rows = $wpdb->get_results($sql, ARRAY_A);
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
