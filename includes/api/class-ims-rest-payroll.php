<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Payroll extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/payroll', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_payroll'),
                'permission_callback' => array($this, 'check_payroll_view_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_payroll_record'),
                'permission_callback' => array($this, 'check_payroll_manage_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/payroll/runs', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_payroll_runs'),
                'permission_callback' => array($this, 'check_payroll_view_permission'),
            ),
        ));

        register_rest_route($this->namespace, '/payroll/runs/adjustment', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'save_run_adjustment'),
                'permission_callback' => array($this, 'check_payroll_manage_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/payroll/runs/finalize', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'finalize_month'),
                'permission_callback' => array($this, 'check_payroll_manage_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/payroll/(?P<id>\d+)', array(
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_payroll_record'),
                'permission_callback' => array($this, 'check_payroll_manage_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_payroll_record'),
                'permission_callback' => array($this, 'check_payroll_manage_permission_write'),
            ),
        ));
    }

    public function check_payroll_view_permission() {
        return $this->check_capability('ims_view_payroll');
    }

    public function check_payroll_manage_permission_write() {
        return $this->check_capability('ims_manage_payroll', true);
    }

    /**
     * Compute working days basis for a month according to Option (b):
     * Calendar days in month minus weekly-off days (default: Sunday)
     */
    private function calculate_working_days_basis($month, $year, $weekly_off_day = 'Sunday') {
        $days_in_month = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $weekly_off_count = 0;

        for ($d = 1; $d <= $days_in_month; $d++) {
            $date_str = sprintf('%04d-%02d-%02d', $year, $month, $d);
            $day_name = date('l', strtotime($date_str));
            if (strcasecmp($day_name, $weekly_off_day) === 0) {
                $weekly_off_count++;
            }
        }

        return array(
            'days_in_month'     => $days_in_month,
            'weekly_off_count'  => $weekly_off_count,
            'working_days_basis'=> max(1, $days_in_month - $weekly_off_count),
        );
    }

    /**
     * GET /payroll/runs?month=X&year=Y
     * Automated payroll calculation based on marked attendance and staff contract salary.
     */
    public function get_payroll_runs($request) {
        global $wpdb;

        $month = intval($request->get_param('month'));
        $year  = intval($request->get_param('year'));

        if (!$month || $month < 1 || $month > 12) {
            $month = intval(date('n'));
        }
        if (!$year || $year < 2000 || $year > 2099) {
            $year = intval(date('Y'));
        }

        $settings = get_option('ims_institute_settings', array());
        $weekly_off_day = !empty($settings['weekly_off_day']) ? $settings['weekly_off_day'] : 'Sunday';
        $weights = !empty($settings['attendance_weights']) && is_array($settings['attendance_weights']) ? $settings['attendance_weights'] : array(
            'present'  => 1.0,
            'half_day' => 0.5,
            'late'     => 1.0,
            'leave'    => 1.0,
            'absent'   => 0.0,
            'holiday'  => 1.0,
        );

        $basis_info = $this->calculate_working_days_basis($month, $year, $weekly_off_day);
        $basis_days = $basis_info['working_days_basis'];
        $days_in_month = $basis_info['days_in_month'];

        $month_start = sprintf('%04d-%02d-01', $year, $month);
        $month_end   = sprintf('%04d-%02d-%02d', $year, $month, $days_in_month);

        // Fetch active staff
        $staff_members = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ims_staff WHERE status = 'active' AND deleted_at IS NULL ORDER BY first_name ASC");

        // Fetch existing saved/finalized runs for this month/year
        $runs_table = "{$wpdb->prefix}ims_payroll_runs";
        $saved_runs_raw = $wpdb->get_results($wpdb->prepare("SELECT * FROM {$runs_table} WHERE year = %d AND month = %d AND deleted_at IS NULL", $year, $month));
        $saved_runs = array();
        foreach ($saved_runs_raw as $sr) {
            $saved_runs[$sr->staff_id] = $sr;
        }

        // Fetch all staff attendance records for this month
        $att_table = "{$wpdb->prefix}ims_attendance";
        $attendance_rows = $wpdb->get_results($wpdb->prepare("
            SELECT entity_id, status, COUNT(*) as cnt
            FROM {$att_table}
            WHERE entity_type = 'staff'
              AND attendance_date >= %s
              AND attendance_date <= %s
              AND deleted_at IS NULL
            GROUP BY entity_id, status
        ", $month_start, $month_end));

        $staff_att = array();
        foreach ($attendance_rows as $ar) {
            if (!isset($staff_att[$ar->entity_id])) {
                $staff_att[$ar->entity_id] = array(
                    'present'  => 0,
                    'half_day' => 0,
                    'late'     => 0,
                    'leave'    => 0,
                    'absent'   => 0,
                    'holiday'  => 0,
                );
            }
            $status_key = strtolower($ar->status);
            if (array_key_exists($status_key, $staff_att[$ar->entity_id])) {
                $staff_att[$ar->entity_id][$status_key] = (int) $ar->cnt;
            }
        }

        $runs_list = array();
        $is_month_finalized = true;

        foreach ($staff_members as $s) {
            $s_id = (int) $s->id;
            $saved = isset($saved_runs[$s_id]) ? $saved_runs[$s_id] : null;

            if ($saved && $saved->status === 'finalized') {
                // Return finalized immutable row
                $runs_list[] = array(
                    'id'                    => (int) $saved->id,
                    'staff_id'              => $s_id,
                    'staff_code'            => $s->staff_code,
                    'staff_name'            => trim($s->first_name . ' ' . $s->last_name),
                    'designation'           => $s->designation,
                    'base_salary'           => floatval($s->base_salary),
                    'month'                 => $month,
                    'year'                  => $year,
                    'working_days_basis'    => (int) $saved->working_days_basis,
                    'per_day_rate'          => floatval($saved->per_day_rate),
                    'weighted_present_days' => floatval($saved->weighted_present_days),
                    'calculated_amount'     => floatval($saved->calculated_amount),
                    'manual_adjustment'     => floatval($saved->manual_adjustment),
                    'adjustment_reason'     => $saved->adjustment_reason ?: '',
                    'net_payable'           => floatval($saved->net_payable),
                    'status'                => 'finalized',
                    'finalized_at'          => $saved->finalized_at,
                    'attendance_breakdown'  => isset($staff_att[$s_id]) ? $staff_att[$s_id] : array(
                        'present'  => 0, 'half_day' => 0, 'late' => 0, 'leave' => 0, 'absent' => 0, 'holiday' => 0,
                    ),
                );
            } else {
                $is_month_finalized = false;
                $att_counts = isset($staff_att[$s_id]) ? $staff_att[$s_id] : array(
                    'present'  => 0, 'half_day' => 0, 'late' => 0, 'leave' => 0, 'absent' => 0, 'holiday' => 0,
                );

                // Compute weighted present days
                $w_days = 0.0;
                foreach ($att_counts as $st => $cnt) {
                    $w = isset($weights[$st]) ? floatval($weights[$st]) : 0.0;
                    $w_days += ($cnt * $w);
                }

                $base_sal = floatval($s->base_salary);
                $per_day  = round($base_sal / $basis_days, 2);
                $calc_amt = round($per_day * $w_days, 2);

                $adj        = $saved ? floatval($saved->manual_adjustment) : 0.0;
                $adj_reason = $saved ? ($saved->adjustment_reason ?: '') : '';
                $net        = round($calc_amt + $adj, 2);

                $runs_list[] = array(
                    'id'                    => $saved ? (int) $saved->id : null,
                    'staff_id'              => $s_id,
                    'staff_code'            => $s->staff_code,
                    'staff_name'            => trim($s->first_name . ' ' . $s->last_name),
                    'designation'           => $s->designation,
                    'base_salary'           => $base_sal,
                    'month'                 => $month,
                    'year'                  => $year,
                    'working_days_basis'    => $basis_days,
                    'per_day_rate'          => $per_day,
                    'weighted_present_days' => $w_days,
                    'calculated_amount'     => $calc_amt,
                    'manual_adjustment'     => $adj,
                    'adjustment_reason'     => $adj_reason,
                    'net_payable'           => $net,
                    'status'                => $saved ? $saved->status : 'draft',
                    'finalized_at'          => null,
                    'attendance_breakdown'  => $att_counts,
                );
            }
        }

        return $this->success_response(array(
            'month'                  => $month,
            'year'                   => $year,
            'working_days_basis'     => $basis_days,
            'days_in_month'          => $days_in_month,
            'weekly_off_day'         => $weekly_off_day,
            'is_finalized'           => !empty($runs_list) && $is_month_finalized,
            'attendance_weights'     => $weights,
            'runs'                   => $runs_list,
        ));
    }

    /**
     * POST /payroll/runs/adjustment
     * Save manual adjustment and required reason for a staff member's payroll run
     */
    public function save_run_adjustment($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $staff_id   = intval($params['staff_id']);
        $month      = intval($params['month']);
        $year       = intval($params['year']);
        $adjustment = floatval(isset($params['manual_adjustment']) ? $params['manual_adjustment'] : 0);
        $reason     = sanitize_text_field(isset($params['adjustment_reason']) ? $params['adjustment_reason'] : '');

        if (!$staff_id || !$month || !$year) {
            return $this->error_response('invalid_payload', __('Staff ID, Month, and Year are required.', 'institute-management-system'));
        }

        if ($adjustment != 0 && empty($reason)) {
            return $this->error_response('reason_required', __('An adjustment reason is required when entering a non-zero manual adjustment.', 'institute-management-system'));
        }

        $runs_table = "{$wpdb->prefix}ims_payroll_runs";
        $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$runs_table} WHERE staff_id = %d AND year = %d AND month = %d AND deleted_at IS NULL", $staff_id, $year, $month));

        if ($existing && $existing->status === 'finalized') {
            return $this->error_response('run_finalized', __('This month\'s payroll has already been finalized and cannot be modified.', 'institute-management-system'));
        }

        // Recompute calculation
        $settings = get_option('ims_institute_settings', array());
        $weekly_off_day = !empty($settings['weekly_off_day']) ? $settings['weekly_off_day'] : 'Sunday';
        $weights = !empty($settings['attendance_weights']) && is_array($settings['attendance_weights']) ? $settings['attendance_weights'] : array(
            'present' => 1.0, 'half_day' => 0.5, 'late' => 1.0, 'leave' => 1.0, 'absent' => 0.0, 'holiday' => 1.0
        );

        $basis_info = $this->calculate_working_days_basis($month, $year, $weekly_off_day);
        $basis_days = $basis_info['working_days_basis'];

        $staff = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}ims_staff WHERE id = %d", $staff_id));
        if (!$staff) {
            return $this->error_response('staff_not_found', __('Staff member not found.', 'institute-management-system'));
        }

        $month_start = sprintf('%04d-%02d-01', $year, $month);
        $month_end   = sprintf('%04d-%02d-%02d', $year, $month, $basis_info['days_in_month']);

        $att_table = "{$wpdb->prefix}ims_attendance";
        $attendance_rows = $wpdb->get_results($wpdb->prepare("
            SELECT status, COUNT(*) as cnt
            FROM {$att_table}
            WHERE entity_type = 'staff' AND entity_id = %d AND attendance_date >= %s AND attendance_date <= %s AND deleted_at IS NULL
            GROUP BY status
        ", $staff_id, $month_start, $month_end));

        $w_days = 0.0;
        foreach ($attendance_rows as $ar) {
            $st = strtolower($ar->status);
            $w  = isset($weights[$st]) ? floatval($weights[$st]) : 0.0;
            $w_days += ($ar->cnt * $w);
        }

        $base_sal = floatval($staff->base_salary);
        $per_day  = round($base_sal / $basis_days, 2);
        $calc_amt = round($per_day * $w_days, 2);
        $net      = round($calc_amt + $adjustment, 2);

        if ($existing) {
            $wpdb->update($runs_table, array(
                'working_days_basis'    => $basis_days,
                'per_day_rate'          => $per_day,
                'weighted_present_days' => $w_days,
                'calculated_amount'     => $calc_amt,
                'manual_adjustment'     => $adjustment,
                'adjustment_reason'     => $reason,
                'net_payable'           => $net,
            ), array('id' => $existing->id));
        } else {
            $wpdb->insert($runs_table, array(
                'staff_id'              => $staff_id,
                'month'                 => $month,
                'year'                  => $year,
                'working_days_basis'    => $basis_days,
                'per_day_rate'          => $per_day,
                'weighted_present_days' => $w_days,
                'calculated_amount'     => $calc_amt,
                'manual_adjustment'     => $adjustment,
                'adjustment_reason'     => $reason,
                'net_payable'           => $net,
                'status'                => 'draft',
            ));
        }

        return $this->success_response(array('message' => __('Adjustment saved successfully.', 'institute-management-system')));
    }

    /**
     * POST /payroll/runs/finalize
     * Locks all draft payroll runs for the given month/year into finalized status
     */
    public function finalize_month($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $month = intval($params['month']);
        $year  = intval($params['year']);

        if (!$month || !$year) {
            return $this->error_response('invalid_payload', __('Month and Year are required to finalize payroll.', 'institute-management-system'));
        }

        $runs_table = "{$wpdb->prefix}ims_payroll_runs";

        // Check if already finalized
        $already = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$runs_table} WHERE year = %d AND month = %d AND status = 'finalized' AND deleted_at IS NULL", $year, $month));
        if ($already > 0) {
            return $this->error_response('already_finalized', __('Payroll for this month is already finalized.', 'institute-management-system'));
        }

        // Fetch active staff
        $staff_members = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}ims_staff WHERE status = 'active' AND deleted_at IS NULL");

        $settings = get_option('ims_institute_settings', array());
        $weekly_off_day = !empty($settings['weekly_off_day']) ? $settings['weekly_off_day'] : 'Sunday';
        $weights = !empty($settings['attendance_weights']) && is_array($settings['attendance_weights']) ? $settings['attendance_weights'] : array(
            'present' => 1.0, 'half_day' => 0.5, 'late' => 1.0, 'leave' => 1.0, 'absent' => 0.0, 'holiday' => 1.0
        );

        $basis_info = $this->calculate_working_days_basis($month, $year, $weekly_off_day);
        $basis_days = $basis_info['working_days_basis'];
        $days_in_month = $basis_info['days_in_month'];

        $month_start = sprintf('%04d-%02d-01', $year, $month);
        $month_end   = sprintf('%04d-%02d-%02d', $year, $month, $days_in_month);

        $now = current_time('mysql');
        $user_id = get_current_user_id();

        foreach ($staff_members as $s) {
            $s_id = (int) $s->id;
            $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$runs_table} WHERE staff_id = %d AND year = %d AND month = %d AND deleted_at IS NULL", $s_id, $year, $month));

            $att_table = "{$wpdb->prefix}ims_attendance";
            $attendance_rows = $wpdb->get_results($wpdb->prepare("
                SELECT status, COUNT(*) as cnt
                FROM {$att_table}
                WHERE entity_type = 'staff' AND entity_id = %d AND attendance_date >= %s AND attendance_date <= %s AND deleted_at IS NULL
                GROUP BY status
            ", $s_id, $month_start, $month_end));

            $w_days = 0.0;
            foreach ($attendance_rows as $ar) {
                $st = strtolower($ar->status);
                $w  = isset($weights[$st]) ? floatval($weights[$st]) : 0.0;
                $w_days += ($ar->cnt * $w);
            }

            $base_sal = floatval($s->base_salary);
            $per_day  = round($base_sal / $basis_days, 2);
            $calc_amt = round($per_day * $w_days, 2);

            $adj        = $existing ? floatval($existing->manual_adjustment) : 0.0;
            $adj_reason = $existing ? ($existing->adjustment_reason ?: '') : '';
            $net        = round($calc_amt + $adj, 2);

            if ($existing) {
                $wpdb->update($runs_table, array(
                    'working_days_basis'    => $basis_days,
                    'per_day_rate'          => $per_day,
                    'weighted_present_days' => $w_days,
                    'calculated_amount'     => $calc_amt,
                    'manual_adjustment'     => $adj,
                    'adjustment_reason'     => $adj_reason,
                    'net_payable'           => $net,
                    'status'                => 'finalized',
                    'finalized_at'          => $now,
                    'finalized_by_user_id'  => $user_id,
                ), array('id' => $existing->id));
            } else {
                $wpdb->insert($runs_table, array(
                    'staff_id'              => $s_id,
                    'month'                 => $month,
                    'year'                  => $year,
                    'working_days_basis'    => $basis_days,
                    'per_day_rate'          => $per_day,
                    'weighted_present_days' => $w_days,
                    'calculated_amount'     => $calc_amt,
                    'manual_adjustment'     => $adj,
                    'adjustment_reason'     => $adj_reason,
                    'net_payable'           => $net,
                    'status'                => 'finalized',
                    'finalized_at'          => $now,
                    'finalized_by_user_id'  => $user_id,
                ));
            }
        }

        require_once __DIR__ . '/../class-ims-audit.php';
        IMS_Audit::log('payroll_finalized', 0, sprintf('Finalized monthly payroll for %04d-%02d across %d staff members.', $year, $month, count($staff_members)), $user_id);

        return $this->success_response(array('message' => sprintf(__('Payroll for %04d-%02d finalized successfully.', 'institute-management-system'), $year, $month)));
    }

    public function get_payroll($request) {
        global $wpdb;
        $payroll_table = "{$wpdb->prefix}ims_payroll";
        $staff_table   = "{$wpdb->prefix}ims_staff";

        $staff_id   = intval($request->get_param('staff_id'));
        $month_year = sanitize_text_field($request->get_param('month_year'));

        $where = "WHERE p.deleted_at IS NULL";
        $params = array();

        if (!empty($staff_id)) {
            $where .= " AND p.staff_id = %d";
            $params[] = $staff_id;
        }

        if (!empty($month_year)) {
            $where .= " AND p.month_year = %s";
            $params[] = $month_year;
        }

        $sql = "
SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) AS staff_name, s.staff_code, s.designation
FROM {$payroll_table} p
LEFT JOIN {$staff_table} s ON p.staff_id = s.id
{$where}
ORDER BY p.payment_date DESC
        ";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $results = $wpdb->get_results($sql);
        return $this->success_response($results);
    }

    public function create_payroll_record($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $staff_id   = intval($params['staff_id']);
        $month_year = sanitize_text_field($params['month_year']);
        $base       = floatval($params['base_salary']);
        $bonus      = floatval(isset($params['bonus']) ? $params['bonus'] : 0);
        $deductions = floatval(isset($params['deductions']) ? $params['deductions'] : 0);

        if (empty($staff_id) || empty($month_year) || $base <= 0) {
            return $this->error_response('invalid_payload', __('Staff ID, Month/Year (e.g. 2026-08), and Base Salary are required.', 'institute-management-system'));
        }

        $net_salary = $base + $bonus - $deductions;

        $payment_date = !empty($params['payment_date']) ? sanitize_text_field($params['payment_date']) : current_time('Y-m-d');
        $date_check   = IMS_Validation::assert_date_allowed($payment_date, 'Disbursement Date');
        if (is_wp_error($date_check)) {
            return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
        }

        $table = "{$wpdb->prefix}ims_payroll";
        $wpdb->insert($table, array(
            'staff_id'     => $staff_id,
            'month_year'   => $month_year,
            'base_salary'  => $base,
            'bonus'        => $bonus,
            'deductions'   => $deductions,
            'net_salary'   => $net_salary,
            'payment_date' => $payment_date,
            'payment_mode' => sanitize_text_field(isset($params['payment_mode']) ? $params['payment_mode'] : 'bank_transfer'),
            'reference_no' => sanitize_text_field(isset($params['reference_no']) ? $params['reference_no'] : ''),
            'status'       => 'paid',
            'created_by'   => get_current_user_id(),
        ));

        return $this->success_response(array('id' => $wpdb->insert_id, 'net_salary' => $net_salary, 'message' => __('Staff payroll disbursement recorded.', 'institute-management-system')));
    }

    public function update_payroll_record($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $base       = floatval($params['base_salary']);
        $bonus      = floatval(isset($params['bonus']) ? $params['bonus'] : 0);
        $deductions = floatval(isset($params['deductions']) ? $params['deductions'] : 0);
        $net_salary = $base + $bonus - $deductions;

        $payment_date = !empty($params['payment_date']) ? sanitize_text_field($params['payment_date']) : current_time('Y-m-d');
        $date_check   = IMS_Validation::assert_date_allowed($payment_date, 'Disbursement Date');
        if (is_wp_error($date_check)) {
            return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
        }

        $table = "{$wpdb->prefix}ims_payroll";
        $wpdb->update($table, array(
            'staff_id'     => intval($params['staff_id']),
            'month_year'   => sanitize_text_field($params['month_year']),
            'base_salary'  => $base,
            'bonus'        => $bonus,
            'deductions'   => $deductions,
            'net_salary'   => $net_salary,
            'payment_date' => $payment_date,
            'payment_mode' => sanitize_text_field(isset($params['payment_mode']) ? $params['payment_mode'] : 'bank_transfer'),
            'reference_no' => sanitize_text_field(isset($params['reference_no']) ? $params['reference_no'] : ''),
            'status'       => sanitize_text_field(isset($params['status']) ? $params['status'] : 'paid'),
        ), array('id' => $id));

        return $this->success_response(array('message' => __('Payroll record updated.', 'institute-management-system')));
    }

    public function delete_payroll_record($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_payroll', $id);
        return $this->success_response(array('message' => __('Payroll record deleted.', 'institute-management-system')));
    }
}
