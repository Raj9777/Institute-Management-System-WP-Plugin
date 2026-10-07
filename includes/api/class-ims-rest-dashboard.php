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

        // Financial KPIs & Collection Breakdown
        $monthly_revenue  = 0.00;
        $new_student_fee  = 0.00;
        $old_student_fee  = 0.00;
        $monthly_expenses = 0.00;
        $student_balance  = 0.00;
        $due_amount       = 0.00;
        $critical_amount  = 0.00;
        $today_attendance_pct = 0;

        $due_students      = array();
        $critical_students = array();

        if (current_user_can('ims_view_reports') || current_user_can('ims_manage_finances') || current_user_can('ims_manage_students') || current_user_can('administrator')) {
            $month_start = date('Y-m-01');
            $month_end   = date('Y-m-t');
            $cur_month   = intval(date('n'));
            $cur_year    = intval(date('Y'));
            $month_year_str = sprintf('%04d-%02d', $cur_year, $cur_month);

            // Detailed collection breakdown for the current month
            $payments_breakdown = $wpdb->get_results($wpdb->prepare("
                SELECT p.amount, s.created_at AS student_admission_date
                FROM {$wpdb->prefix}ims_payments p
                LEFT JOIN {$wpdb->prefix}ims_students s ON p.student_id = s.id
                WHERE p.payment_date >= %s AND p.payment_date <= %s
                  AND p.is_reversal = 0 AND p.deleted_at IS NULL
            ", $month_start, $month_end));

            foreach ($payments_breakdown as $pb) {
                $amt = floatval($pb->amount);
                $monthly_revenue += $amt;
                if (!empty($pb->student_admission_date) && $pb->student_admission_date >= $month_start) {
                    $new_student_fee += $amt;
                } else {
                    $old_student_fee += $amt;
                }
            }

            // Monthly expenditure
            $vouchers_expense = (float) $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(amount), 0) FROM {$wpdb->prefix}ims_expenses WHERE expense_date >= %s AND deleted_at IS NULL", $month_start));
            $payroll_expense  = (float) $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(net_salary), 0) FROM {$wpdb->prefix}ims_payroll WHERE month_year = %s AND status IN ('finalized', 'paid') AND deleted_at IS NULL", $month_year_str));
            $monthly_expenses = $vouchers_expense + $payroll_expense;

            // Student Balance & Overdue Lists
            $active_students_list = $wpdb->get_results("
                SELECT s.id, s.roll_no, s.first_name, s.last_name, s.phone, s.net_fee, s.created_at,
                       c.name AS course_name, b.name AS batch_name,
                       COALESCE(p.paid, 0) AS total_paid
                FROM {$wpdb->prefix}ims_students s
                LEFT JOIN {$wpdb->prefix}ims_courses c ON s.course_id = c.id
                LEFT JOIN {$wpdb->prefix}ims_batches b ON s.batch_id = b.id
                LEFT JOIN (
                    SELECT student_id, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS paid
                    FROM {$wpdb->prefix}ims_payments
                    WHERE deleted_at IS NULL
                    GROUP BY student_id
                ) p ON s.id = p.student_id
                WHERE s.status = 'active' AND s.deleted_at IS NULL
                ORDER BY s.id DESC
            ");

            $today_ts = strtotime(date('Y-m-d'));
            $cur_day  = intval(date('j'));

            foreach ($active_students_list as $s) {
                $net = floatval($s->net_fee);
                $paid = floatval($s->total_paid);
                $outstanding = $net - $paid;

                if ($outstanding > 0) {
                    $student_balance += $outstanding;

                    // Calculate 1st installment due date based on rules:
                    // Admission <= 20th of month -> Due 10th of next month
                    // Admission > 20th of month  -> Due 10th of next-next month
                    $calc_due_date = IMS_Helper::calculate_installment_due_date($s->created_at, 0);
                    $due_ts = strtotime($calc_due_date);
                    $days_diff = round(($today_ts - $due_ts) / 86400);

                    $student_item = array(
                        'id'             => (int) $s->id,
                        'roll_no'        => $s->roll_no,
                        'name'           => trim($s->first_name . ' ' . $s->last_name),
                        'phone'          => $s->phone ?: 'N/A',
                        'course_name'    => $s->course_name ?: 'Unassigned',
                        'batch_name'     => $s->batch_name ?: 'Unassigned',
                        'admission_date' => date('d/m/Y', strtotime($s->created_at)),
                        'net_fee'        => round($net, 2),
                        'total_paid'     => round($paid, 2),
                        'due_amount'     => round($outstanding, 2),
                        'due_date'       => date('d/m/Y', $due_ts),
                        'raw_due_date'   => $calc_due_date,
                        'days_overdue'   => max(0, $days_diff),
                    );

                    if ($days_diff > 15) {
                        // After 15 days past due date -> moves to Critical Section
                        $student_item['status'] = 'critical';
                        $critical_students[] = $student_item;
                        $critical_amount += $outstanding;
                    } elseif ($days_diff >= 0 || $cur_day >= 5) {
                        // Unpaid installment due before 5th / current month
                        $student_item['status'] = 'due';
                        $due_students[] = $student_item;
                        $due_amount += $outstanding;
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

        $total_should_collect = $monthly_revenue + $student_balance;

        return $this->success_response(array(
            'active_students'      => $active_students,
            'active_courses'       => $active_courses,
            'active_batches'       => $active_batches,
            'active_staff'         => $active_staff,
            'monthly_revenue'      => round($monthly_revenue, 2),
            'new_student_fee'      => round($new_student_fee, 2),
            'old_student_fee'      => round($old_student_fee, 2),
            'monthly_expenses'     => round($monthly_expenses, 2),
            'student_balance'      => round($student_balance, 2),
            'total_should_collect' => round($total_should_collect, 2),
            'due_count'            => count($due_students),
            'due_amount'           => round($due_amount, 2),
            'due_students'         => $due_students,
            'critical_count'       => count($critical_students),
            'critical_amount'      => round($critical_amount, 2),
            'critical_students'    => $critical_students,
            'today_attendance_pct' => $today_attendance_pct,
        ));
    }
}
