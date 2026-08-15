<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Dashboard extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/dashboard/kpis', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_kpis'),
            'permission_callback' => function() { return is_user_logged_in(); },
        ));
    }

    public function get_kpis() {
        global $wpdb;

        // KPI 1: Active Students
        $active_students = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ims_students WHERE status = 'active' AND deleted_at IS NULL");

        // KPI 2: Active Courses & Batches
        $active_courses = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ims_courses WHERE status = 'active' AND deleted_at IS NULL");
        $active_batches = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ims_batches WHERE status = 'active' AND deleted_at IS NULL");

        // KPI 3: Total Active Staff
        $active_staff = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ims_staff WHERE status = 'active' AND deleted_at IS NULL");

        // Financial KPIs
        $monthly_revenue  = 0.00;
        $monthly_expenses = 0.00;
        $student_balance  = 0.00;
        $overdue_count    = 0;
        $overdue_amount   = 0.00;
        $today_attendance_pct = 0;

        if (current_user_can('ims_view_reports') || current_user_can('ims_manage_finances') || current_user_can('administrator')) {
            $month_start = date('Y-m-01');
            $cur_month   = intval(date('n'));
            $cur_year    = intval(date('Y'));
            $month_year_str   = sprintf('%04d-%02d', $cur_year, $cur_month);
            $monthly_revenue  = (float) $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(amount), 0) FROM {$wpdb->prefix}ims_payments WHERE payment_date >= %s AND is_reversal = 0 AND deleted_at IS NULL", $month_start));
            $vouchers_expense = (float) $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(amount), 0) FROM {$wpdb->prefix}ims_expenses WHERE expense_date >= %s AND deleted_at IS NULL", $month_start));
            $payroll_expense  = (float) $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(net_salary), 0) FROM {$wpdb->prefix}ims_payroll WHERE month_year = %s AND status IN ('finalized', 'paid') AND deleted_at IS NULL", $month_year_str));
            $monthly_expenses = $vouchers_expense + $payroll_expense;

            // Student Balance: SUM(net_fee - total_paid) for all active students
            $stud_balances = $wpdb->get_results("
                SELECT s.id, s.net_fee, s.created_at, COALESCE(p.paid, 0) AS total_paid
                FROM {$wpdb->prefix}ims_students s
                LEFT JOIN (
                    SELECT student_id, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS paid
                    FROM {$wpdb->prefix}ims_payments
                    WHERE deleted_at IS NULL
                    GROUP BY student_id
                ) p ON s.id = p.student_id
                WHERE s.status = 'active' AND s.deleted_at IS NULL
            ");

            $grace_days = 15; // 15-day grace period post-admission
            $grace_cutoff = date('Y-m-d H:i:s', strtotime("-{$grace_days} days"));

            foreach ($stud_balances as $sb) {
                $due = floatval($sb->net_fee) - floatval($sb->total_paid);
                if ($due > 0) {
                    $student_balance += $due;
                    if ($sb->created_at < $grace_cutoff) {
                        $overdue_count++;
                        $overdue_amount += $due;
                    }
                }
            }
        }

        // Today's attendance percentage
        $today = date('Y-m-d');
        $total_today_marked = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}ims_attendance WHERE attendance_date = %s AND entity_type = 'student' AND deleted_at IS NULL", $today));
        $present_today_marked = (int) $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->prefix}ims_attendance WHERE attendance_date = %s AND entity_type = 'student' AND status IN ('present', 'late', 'half_day') AND deleted_at IS NULL", $today));

        if ($total_today_marked > 0) {
            $today_attendance_pct = round(($present_today_marked / $total_today_marked) * 100, 1);
        }

        return $this->success_response(array(
            'active_students'      => $active_students,
            'active_courses'       => $active_courses,
            'active_batches'       => $active_batches,
            'active_staff'         => $active_staff,
            'monthly_revenue'      => $monthly_revenue,
            'monthly_expenses'     => $monthly_expenses,
            'student_balance'      => round($student_balance, 2),
            'overdue_count'        => $overdue_count,
            'overdue_amount'       => round($overdue_amount, 2),
            'today_attendance_pct' => $today_attendance_pct,
        ));
    }
}
