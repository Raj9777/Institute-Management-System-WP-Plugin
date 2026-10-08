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

        register_rest_route($this->namespace, '/reports/monthwise', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_monthwise_report'),
            'permission_callback' => array($this, 'check_reports_permission'),
        ));

        register_rest_route($this->namespace, '/reports/students-detailed', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_students_detailed_report'),
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

    /**
     * Monthwise Financial and Operational Summary
     */
    public function get_monthwise_report($request) {
        global $wpdb;
        $year = intval($request->get_param('year'));
        if ($year < 2000 || $year > 2100) {
            $year = (int) date('Y');
        }

        $month_names = array(
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        );

        // 1. Monthly Admissions
        $stud_sql = "
            SELECT MONTH(COALESCE(admission_date, DATE(created_at))) AS m, COUNT(id) AS total_admissions
            FROM {$wpdb->prefix}ims_students
            WHERE deleted_at IS NULL AND YEAR(COALESCE(admission_date, DATE(created_at))) = %d
            GROUP BY m
        ";
        $admissions_res = $wpdb->get_results($wpdb->prepare($stud_sql, $year), ARRAY_A);
        $admissions_by_m = array();
        foreach ($admissions_res as $r) {
            $admissions_by_m[(int)$r['m']] = (int)$r['total_admissions'];
        }

        // 2. Monthly Invoiced Amount
        $inv_sql = "
            SELECT MONTH(invoice_date) AS m, SUM(total_amount) AS total_invoiced
            FROM {$wpdb->prefix}ims_invoices
            WHERE deleted_at IS NULL AND YEAR(invoice_date) = %d
            GROUP BY m
        ";
        $inv_res = $wpdb->get_results($wpdb->prepare($inv_sql, $year), ARRAY_A);
        $invoiced_by_m = array();
        foreach ($inv_res as $r) {
            $invoiced_by_m[(int)$r['m']] = (float)$r['total_invoiced'];
        }

        // 3. Monthly Fee Collections (Payments)
        $pay_sql = "
            SELECT MONTH(payment_date) AS m, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS total_collected
            FROM {$wpdb->prefix}ims_payments
            WHERE deleted_at IS NULL AND YEAR(payment_date) = %d
            GROUP BY m
        ";
        $pay_res = $wpdb->get_results($wpdb->prepare($pay_sql, $year), ARRAY_A);
        $collected_by_m = array();
        foreach ($pay_res as $r) {
            $collected_by_m[(int)$r['m']] = (float)$r['total_collected'];
        }

        // 4. Monthly Expenses - Rent vs Other
        $exp_sql = "
            SELECT MONTH(expense_date) AS m,
                   SUM(CASE WHEN LOWER(category) LIKE '%rent%' OR LOWER(title) LIKE '%rent%' THEN amount ELSE 0 END) AS rent_expenses,
                   SUM(CASE WHEN LOWER(category) NOT LIKE '%rent%' AND LOWER(title) NOT LIKE '%rent%' THEN amount ELSE 0 END) AS other_expenses,
                   SUM(amount) AS total_expenses
            FROM {$wpdb->prefix}ims_expenses
            WHERE deleted_at IS NULL AND YEAR(expense_date) = %d
            GROUP BY m
        ";
        $exp_res = $wpdb->get_results($wpdb->prepare($exp_sql, $year), ARRAY_A);
        $rent_by_m = array();
        $other_exp_by_m = array();
        foreach ($exp_res as $r) {
            $rent_by_m[(int)$r['m']] = (float)$r['rent_expenses'];
            $other_exp_by_m[(int)$r['m']] = (float)$r['other_expenses'];
        }

        // 5. Monthly Staff Payroll Expenses
        $payr_sql = "
            SELECT MONTH(payment_date) AS m, SUM(net_salary) AS total_payroll
            FROM {$wpdb->prefix}ims_payroll
            WHERE deleted_at IS NULL AND YEAR(payment_date) = %d
            GROUP BY m
        ";
        $payr_res = $wpdb->get_results($wpdb->prepare($payr_sql, $year), ARRAY_A);
        $payroll_by_m = array();
        foreach ($payr_res as $r) {
            $payroll_by_m[(int)$r['m']] = (float)$r['total_payroll'];
        }

        // Combine into 12 months array + calculate overall totals
        $months_data = array();
        $totals = array(
            'total_admissions'    => 0,
            'total_invoiced'      => 0.0,
            'total_collected'     => 0.0,
            'total_rent'          => 0.0,
            'total_other_expense' => 0.0,
            'total_payroll'       => 0.0,
            'total_expenditure'   => 0.0,
            'total_balance'       => 0.0,
            'net_operating_margin'=> 0.0,
        );

        for ($m = 1; $m <= 12; $m++) {
            $adm = isset($admissions_by_m[$m]) ? $admissions_by_m[$m] : 0;
            $inv = isset($invoiced_by_m[$m]) ? $invoiced_by_m[$m] : 0.0;
            $col = isset($collected_by_m[$m]) ? $collected_by_m[$m] : 0.0;
            $rent = isset($rent_by_m[$m]) ? $rent_by_m[$m] : 0.0;
            $oth = isset($other_exp_by_m[$m]) ? $other_exp_by_m[$m] : 0.0;
            $prl = isset($payroll_by_m[$m]) ? $payroll_by_m[$m] : 0.0;

            $total_exp = $rent + $oth + $prl;
            $bal = max(0.0, $inv - $col);
            $margin = $col - $total_exp;

            $months_data[] = array(
                'month_num'            => $m,
                'month_name'           => $month_names[$m],
                'month_label'          => $month_names[$m] . ' ' . $year,
                'admissions'           => $adm,
                'invoiced'             => round($inv, 2),
                'fee_collected'        => round($col, 2),
                'house_rent'           => round($rent, 2),
                'other_expenses'       => round($oth, 2),
                'payroll_expenses'     => round($prl, 2),
                'total_expenditure'    => round($total_exp, 2),
                'pending_balance'      => round($bal, 2),
                'net_margin'           => round($margin, 2),
            );

            $totals['total_admissions']    += $adm;
            $totals['total_invoiced']      += $inv;
            $totals['total_collected']     += $col;
            $totals['total_rent']          += $rent;
            $totals['total_other_expense'] += $oth;
            $totals['total_payroll']       += $prl;
            $totals['total_expenditure']   += $total_exp;
            $totals['total_balance']       += $bal;
            $totals['net_operating_margin']+= $margin;
        }

        foreach ($totals as $k => $v) {
            if ($k !== 'total_admissions') {
                $totals[$k] = round($v, 2);
            }
        }

        return $this->success_response(array(
            'year'    => $year,
            'months'  => $months_data,
            'summary' => $totals,
        ));
    }

    /**
     * Detailed Students Directory with Current Position / Alumni Tracking
     */
    public function get_students_detailed_report($request) {
        global $wpdb;

        $search    = sanitize_text_field($request->get_param('search'));
        $status    = sanitize_text_field($request->get_param('status'));
        $course_id = intval($request->get_param('course_id'));
        $batch_id  = intval($request->get_param('batch_id'));
        $pos_status= sanitize_text_field($request->get_param('position_status'));
        $year      = sanitize_text_field($request->get_param('year'));

        $where = "WHERE s.deleted_at IS NULL";
        $params = array();

        if (!empty($search)) {
            $where .= " AND (s.first_name LIKE %s OR s.last_name LIKE %s OR CONCAT(s.first_name, ' ', s.last_name) LIKE %s OR s.roll_no LIKE %s OR s.phone LIKE %s OR s.email LIKE %s OR s.current_company_or_institution LIKE %s OR s.current_designation LIKE %s OR c.name LIKE %s)";
            $like = '%' . $wpdb->esc_like($search) . '%';
            for ($i = 0; $i < 9; $i++) {
                $params[] = $like;
            }
        }

        if (!empty($status) && $status !== 'all') {
            $where .= " AND s.status = %s";
            $params[] = $status;
        }

        if (!empty($course_id)) {
            $where .= " AND s.course_id = %d";
            $params[] = $course_id;
        }

        if (!empty($batch_id)) {
            $where .= " AND s.batch_id = %d";
            $params[] = $batch_id;
        }

        if (!empty($pos_status) && $pos_status !== 'all') {
            $where .= " AND s.current_position_status = %s";
            $params[] = $pos_status;
        }

        if (!empty($year)) {
            $where .= " AND (s.passed_out_year = %s OR YEAR(COALESCE(s.admission_date, DATE(s.created_at))) = %d)";
            $params[] = $year;
            $params[] = intval($year);
        }

        $sql = "
            SELECT s.id, s.roll_no, s.first_name, s.last_name, s.gender, s.dob, s.phone, s.email,
                   s.guardian_name, s.guardian_phone, s.address,
                   s.course_id, s.batch_id,
                   COALESCE(c.name, 'Unassigned') AS course_name,
                   COALESCE(c.duration_months, 1) AS course_duration_months,
                   COALESCE(b.name, 'Unassigned') AS batch_name,
                   s.status,
                   CAST(s.course_fee AS DECIMAL(12,2)) AS course_fee,
                   s.discount_type,
                   CAST(s.discount_value AS DECIMAL(12,2)) AS discount_value,
                   CAST(s.net_fee AS DECIMAL(12,2)) AS net_fee,
                   CAST(COALESCE(s.admission_fee, 0.00) AS DECIMAL(12,2)) AS admission_fee,
                   COALESCE(s.admission_date, DATE(s.created_at)) AS admission_date,
                   s.current_position,
                   s.current_position_status,
                   s.current_company_or_institution,
                   s.current_designation,
                   s.passed_out_year,
                   s.photo_url,
                   s.created_at,
                   CAST(COALESCE(p.paid, 0) AS DECIMAL(12,2)) AS total_paid,
                   CAST(GREATEST(0, (s.net_fee - COALESCE(p.paid, 0))) AS DECIMAL(12,2)) AS outstanding_balance,
                   (
                       SELECT i.invoice_no 
                       FROM {$wpdb->prefix}ims_invoices i 
                       WHERE i.student_id = s.id AND i.deleted_at IS NULL 
                       ORDER BY i.id DESC LIMIT 1
                   ) AS latest_invoice_no
            FROM {$wpdb->prefix}ims_students s
            LEFT JOIN {$wpdb->prefix}ims_courses c ON s.course_id = c.id
            LEFT JOIN {$wpdb->prefix}ims_batches b ON s.batch_id = b.id
            LEFT JOIN (
                SELECT student_id, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS paid
                FROM {$wpdb->prefix}ims_payments
                WHERE deleted_at IS NULL
                GROUP BY student_id
            ) p ON s.id = p.student_id
            {$where}
            ORDER BY s.id DESC
        ";

        if (!empty($params)) {
            $students = $wpdb->get_results($wpdb->prepare($sql, ...$params), ARRAY_A);
        } else {
            $students = $wpdb->get_results($sql, ARRAY_A);
        }

        // Summary counts
        $total_students = count($students);
        $total_active = 0;
        $total_passed = 0;
        $total_employed = 0;
        $total_higher_studies = 0;
        $total_revenue = 0.0;
        $total_collected = 0.0;
        $total_due = 0.0;

        foreach ($students as $stu) {
            if ($stu['status'] === 'active') $total_active++;
            if ($stu['status'] === 'completed' || !empty($stu['passed_out_year'])) $total_passed++;
            if (in_array(strtolower($stu['current_position_status']), array('employed', 'job', 'working', 'freelancer', 'business', 'entrepreneur'))) $total_employed++;
            if (in_array(strtolower($stu['current_position_status']), array('higher studies', 'studying', 'internship'))) $total_higher_studies++;

            $total_revenue += floatval($stu['net_fee']);
            $total_collected += floatval($stu['total_paid']);
            $total_due += floatval($stu['outstanding_balance']);
        }

        return $this->success_response(array(
            'records' => $students,
            'summary' => array(
                'total_students'       => $total_students,
                'total_active'         => $total_active,
                'total_passed'         => $total_passed,
                'total_employed'       => $total_employed,
                'total_higher_studies' => $total_higher_studies,
                'total_revenue'        => round($total_revenue, 2),
                'total_collected'      => round($total_collected, 2),
                'total_due'            => round($total_due, 2),
            )
        ));
    }
}
