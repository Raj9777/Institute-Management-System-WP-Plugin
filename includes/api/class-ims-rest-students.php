<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Students extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/students', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_students'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_student'),
                'permission_callback' => array($this, 'check_student_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/students/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_student'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_student'),
                'permission_callback' => array($this, 'check_student_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_student'),
                'permission_callback' => array($this, 'check_student_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/students/(?P<id>\d+)/position', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'update_position'),
                'permission_callback' => array($this, 'check_student_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/students/(?P<id>\d+)/upgrade', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'upgrade_course'),
                'permission_callback' => array($this, 'check_student_permission_write'),
            ),
        ));
    }

    public function check_student_permission_write() {
        return $this->check_capability('ims_manage_students', true);
    }

    public function get_students($request) {
        global $wpdb;
        $students_table = "{$wpdb->prefix}ims_students";
        $courses_table  = "{$wpdb->prefix}ims_courses";
        $batches_table  = "{$wpdb->prefix}ims_batches";
        $payments_table = "{$wpdb->prefix}ims_payments";

        $search   = sanitize_text_field($request->get_param('search'));
        $batch_id = intval($request->get_param('batch_id'));
        $status   = sanitize_text_field($request->get_param('status'));

        $where = "WHERE s.deleted_at IS NULL";
        $params = array();

        if (!empty($search)) {
            $where .= " AND (s.first_name LIKE %s OR s.last_name LIKE %s OR CONCAT(s.first_name, ' ', s.last_name) LIKE %s OR s.roll_no LIKE %s OR s.phone LIKE %s OR s.email LIKE %s OR s.guardian_name LIKE %s OR c.name LIKE %s OR b.name LIKE %s)";
            $like = '%' . $wpdb->esc_like($search) . '%';
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }

        if (!empty($batch_id)) {
            $where .= " AND s.batch_id = %d";
            $params[] = $batch_id;
        }

        if (!empty($status)) {
            $where .= " AND s.status = %s";
            $params[] = $status;
        }

        $sql = "
SELECT s.*, 
       c.name AS course_name, c.code AS course_code, c.duration_months,
       b.name AS batch_name,
       COALESCE(p.total_paid, 0) AS total_paid,
       GREATEST(0, s.net_fee - COALESCE(p.total_paid, 0)) AS outstanding_balance
FROM {$students_table} s
LEFT JOIN {$courses_table} c ON s.course_id = c.id
LEFT JOIN {$batches_table} b ON s.batch_id = b.id
LEFT JOIN (
    SELECT student_id, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS total_paid
    FROM {$payments_table}
    WHERE deleted_at IS NULL
    GROUP BY student_id
) p ON s.id = p.student_id
{$where}
ORDER BY s.created_at DESC
        ";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $results = $wpdb->get_results($sql);
        return $this->success_response($results);
    }

    public function get_student($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $students_table = "{$wpdb->prefix}ims_students";
        $courses_table  = "{$wpdb->prefix}ims_courses";
        $batches_table  = "{$wpdb->prefix}ims_batches";
        $payments_table = "{$wpdb->prefix}ims_payments";

        $sql = $wpdb->prepare("
SELECT s.*, 
       c.name AS course_name, c.code AS course_code, c.duration_months,
       b.name AS batch_name,
       COALESCE(p.total_paid, 0) AS total_paid,
       GREATEST(0, s.net_fee - COALESCE(p.total_paid, 0)) AS outstanding_balance
FROM {$students_table} s
LEFT JOIN {$courses_table} c ON s.course_id = c.id
LEFT JOIN {$batches_table} b ON s.batch_id = b.id
LEFT JOIN (
    SELECT student_id, SUM(CASE WHEN is_reversal = 1 THEN -ABS(amount) ELSE amount END) AS total_paid
    FROM {$payments_table}
    WHERE deleted_at IS NULL
    GROUP BY student_id
) p ON s.id = p.student_id
WHERE s.id = %d AND s.deleted_at IS NULL
        ", $id);

        $row = $wpdb->get_row($sql);
        if (!$row) {
            return $this->error_response('not_found', __('Student not found.', 'institute-management-system'), 404);
        }

        // Build running ledger for this student
        $ledger = array();

        // 1. Debit entry for Course Net Fee at Enrollment
        $running_balance = floatval($row->net_fee);
        $ledger[] = array(
            'date'            => substr($row->created_at, 0, 10),
            'type'            => 'charge',
            'description'     => sprintf(__('Course Fee Charge (%s)', 'institute-management-system'), $row->course_name ? $row->course_name : __('Admission Fee', 'institute-management-system')),
            'debit'           => floatval($row->net_fee),
            'credit'          => 0.00,
            'running_balance' => $running_balance,
            'reference'       => $row->roll_no,
        );

        // 2. Fetch payments & reversals
        $pay_sql = $wpdb->prepare("
            SELECT receipt_no, amount, payment_mode, reference_no, payment_date, is_reversal, reversal_reason, created_at
            FROM {$payments_table}
            WHERE student_id = %d AND deleted_at IS NULL
            ORDER BY payment_date ASC, id ASC
        ", $id);
        $payments_rows = $wpdb->get_results($pay_sql);

        foreach ($payments_rows as $p) {
            $amt = floatval($p->amount);
            if ($p->is_reversal) {
                $running_balance += abs($amt);
                $ledger[] = array(
                    'date'            => $p->payment_date,
                    'type'            => 'reversal',
                    'description'     => sprintf(__('Reversal: %s', 'institute-management-system'), $p->reversal_reason ? $p->reversal_reason : __('Payment Reversed', 'institute-management-system')),
                    'debit'           => abs($amt),
                    'credit'          => 0.00,
                    'running_balance' => $running_balance,
                    'reference'       => $p->receipt_no,
                );
            } else {
                $running_balance -= $amt;
                $ledger[] = array(
                    'date'            => $p->payment_date,
                    'type'            => 'payment',
                    'description'     => sprintf(__('Fee Payment (%s)', 'institute-management-system'), strtoupper($p->payment_mode)),
                    'debit'           => 0.00,
                    'credit'          => $amt,
                    'running_balance' => $running_balance,
                    'reference'       => $p->receipt_no,
                );
            }
        }

        $row->ledger = $ledger;
        return $this->success_response($row);
    }

    public function create_student($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $first_name = sanitize_text_field(isset($params['first_name']) ? $params['first_name'] : '');
        $last_name  = sanitize_text_field(isset($params['last_name']) ? $params['last_name'] : '');

        if (empty($first_name) || empty($last_name)) {
            return $this->error_response('missing_fields', __('First and Last Name are required.', 'institute-management-system'));
        }

        $course_id     = !empty($params['course_id']) ? intval($params['course_id']) : null;
        $batch_id      = !empty($params['batch_id']) ? intval($params['batch_id']) : null;
        $course_fee    = isset($params['course_fee']) ? floatval($params['course_fee']) : 0.00;
        $discount_type = isset($params['discount_type']) && $params['discount_type'] === 'amount' ? 'amount' : 'percentage';
        $discount_val  = isset($params['discount_value']) ? floatval($params['discount_value']) : 0.00;

        // Calculate Net Fee live and clamp to >= 0
        if ($discount_type === 'percentage') {
            $net_fee = $course_fee - ($course_fee * ($discount_val / 100.0));
        } else {
            $net_fee = $course_fee - $discount_val;
        }
        $net_fee = max(0.00, round($net_fee, 2));

        $admission_date = !empty($params['admission_date']) ? sanitize_text_field($params['admission_date']) : current_time('Y-m-d');
        $admission_fee  = isset($params['admission_fee']) ? floatval($params['admission_fee']) : 0.00;

        // Generate transaction-safe Roll Number
        $roll_no = IMS_DB::get_next_sequence('roll_no');

        $created_datetime = $admission_date . ' ' . current_time('H:i:s');

        $table = "{$wpdb->prefix}ims_students";
        $inserted = $wpdb->insert($table, array(
            'roll_no'        => $roll_no,
            'first_name'     => $first_name,
            'last_name'      => $last_name,
            'gender'         => sanitize_text_field(isset($params['gender']) ? $params['gender'] : 'unspecified'),
            'dob'            => !empty($params['dob']) ? sanitize_text_field($params['dob']) : null,
            'phone'          => sanitize_text_field(isset($params['phone']) ? $params['phone'] : ''),
            'email'          => sanitize_email(isset($params['email']) ? $params['email'] : ''),
            'address'        => sanitize_textarea_field(isset($params['address']) ? $params['address'] : ''),
            'guardian_name'  => sanitize_text_field(isset($params['guardian_name']) ? $params['guardian_name'] : ''),
            'guardian_phone' => sanitize_text_field(isset($params['guardian_phone']) ? $params['guardian_phone'] : ''),
            'course_id'      => $course_id,
            'batch_id'       => $batch_id,
            'course_fee'     => $course_fee,
            'discount_type'  => $discount_type,
            'discount_value' => $discount_val,
            'net_fee'        => $net_fee,
            'admission_fee'  => $admission_fee,
            'admission_date' => $admission_date,
            'current_position' => sanitize_textarea_field(isset($params['current_position']) ? $params['current_position'] : ''),
            'current_position_status' => sanitize_text_field(isset($params['current_position_status']) ? $params['current_position_status'] : ''),
            'current_company_or_institution' => sanitize_text_field(isset($params['current_company_or_institution']) ? $params['current_company_or_institution'] : ''),
            'current_designation' => sanitize_text_field(isset($params['current_designation']) ? $params['current_designation'] : ''),
            'passed_out_year' => sanitize_text_field(isset($params['passed_out_year']) ? $params['passed_out_year'] : ''),
            'photo_url'      => esc_url_raw(isset($params['photo_url']) ? $params['photo_url'] : ''),
            'status'         => 'active',
            'created_at'     => $created_datetime,
        ));

        if (false === $inserted) {
            return $this->error_response('db_error', __('Failed to create student record: ', 'institute-management-system') . $wpdb->last_error, 500);
        }

        $student_id = $wpdb->insert_id;

        return $this->success_response(array('id' => $student_id, 'roll_no' => $roll_no, 'net_fee' => $net_fee, 'message' => __('Student admitted successfully.', 'institute-management-system')));
    }

    public function update_student($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $first_name = sanitize_text_field(isset($params['first_name']) ? $params['first_name'] : '');
        $last_name  = sanitize_text_field(isset($params['last_name']) ? $params['last_name'] : '');

        if (empty($first_name) || empty($last_name)) {
            return $this->error_response('missing_fields', __('First and Last Name are required.', 'institute-management-system'));
        }

        $course_id     = !empty($params['course_id']) ? intval($params['course_id']) : null;
        $batch_id      = !empty($params['batch_id']) ? intval($params['batch_id']) : null;
        $course_fee    = isset($params['course_fee']) ? floatval($params['course_fee']) : 0.00;
        $discount_type = isset($params['discount_type']) && $params['discount_type'] === 'amount' ? 'amount' : 'percentage';
        $discount_val  = isset($params['discount_value']) ? floatval($params['discount_value']) : 0.00;

        if ($discount_type === 'percentage') {
            $net_fee = $course_fee - ($course_fee * ($discount_val / 100.0));
        } else {
            $net_fee = $course_fee - $discount_val;
        }
        $net_fee = max(0.00, round($net_fee, 2));

        $admission_date = !empty($params['admission_date']) ? sanitize_text_field($params['admission_date']) : null;
        $admission_fee  = isset($params['admission_fee']) ? floatval($params['admission_fee']) : 0.00;

        $update_data = array(
            'first_name'     => $first_name,
            'last_name'      => $last_name,
            'gender'         => sanitize_text_field(isset($params['gender']) ? $params['gender'] : 'unspecified'),
            'dob'            => !empty($params['dob']) ? sanitize_text_field($params['dob']) : null,
            'phone'          => sanitize_text_field(isset($params['phone']) ? $params['phone'] : ''),
            'email'          => sanitize_email(isset($params['email']) ? $params['email'] : ''),
            'address'        => sanitize_textarea_field(isset($params['address']) ? $params['address'] : ''),
            'guardian_name'  => sanitize_text_field(isset($params['guardian_name']) ? $params['guardian_name'] : ''),
            'guardian_phone' => sanitize_text_field(isset($params['guardian_phone']) ? $params['guardian_phone'] : ''),
            'course_id'      => $course_id,
            'batch_id'       => $batch_id,
            'course_fee'     => $course_fee,
            'discount_type'  => $discount_type,
            'discount_value' => $discount_val,
            'net_fee'        => $net_fee,
            'admission_fee'  => $admission_fee,
            'photo_url'      => esc_url_raw(isset($params['photo_url']) ? $params['photo_url'] : ''),
            'status'         => sanitize_text_field(isset($params['status']) ? $params['status'] : 'active'),
        );

        if (!empty($admission_date)) {
            $update_data['admission_date'] = $admission_date;
        }
        if (isset($params['current_position'])) {
            $update_data['current_position'] = sanitize_textarea_field($params['current_position']);
        }
        if (isset($params['current_position_status'])) {
            $update_data['current_position_status'] = sanitize_text_field($params['current_position_status']);
        }
        if (isset($params['current_company_or_institution'])) {
            $update_data['current_company_or_institution'] = sanitize_text_field($params['current_company_or_institution']);
        }
        if (isset($params['current_designation'])) {
            $update_data['current_designation'] = sanitize_text_field($params['current_designation']);
        }
        if (isset($params['passed_out_year'])) {
            $update_data['passed_out_year'] = sanitize_text_field($params['passed_out_year']);
        }

        $table = "{$wpdb->prefix}ims_students";
        $updated = $wpdb->update($table, $update_data, array('id' => $id));

        if (false === $updated) {
            return $this->error_response('db_error', __('Failed to update student record: ', 'institute-management-system') . $wpdb->last_error, 500);
        }

        return $this->success_response(array('message' => __('Student profile updated.', 'institute-management-system')));
    }

    public function update_position($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $table = "{$wpdb->prefix}ims_students";
        $student = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));
        if (!$student) {
            return $this->error_response('not_found', __('Student record not found.', 'institute-management-system'), 404);
        }

        $update_data = array(
            'current_position'               => sanitize_textarea_field(isset($params['current_position']) ? $params['current_position'] : ''),
            'current_position_status'        => sanitize_text_field(isset($params['current_position_status']) ? $params['current_position_status'] : ''),
            'current_company_or_institution' => sanitize_text_field(isset($params['current_company_or_institution']) ? $params['current_company_or_institution'] : ''),
            'current_designation'            => sanitize_text_field(isset($params['current_designation']) ? $params['current_designation'] : ''),
            'passed_out_year'                => sanitize_text_field(isset($params['passed_out_year']) ? $params['passed_out_year'] : ''),
        );

        if (!empty($params['status'])) {
            $update_data['status'] = sanitize_text_field($params['status']);
        }

        $updated = $wpdb->update($table, $update_data, array('id' => $id));
        if (false === $updated) {
            return $this->error_response('db_error', __('Failed to update position details: ', 'institute-management-system') . $wpdb->last_error, 500);
        }

        require_once __DIR__ . '/../class-ims-audit.php';
        IMS_Audit::log('student_position_updated', $id, sprintf('Updated current position for student %s (%s): %s at %s', $student->roll_no, $student->first_name . ' ' . $student->last_name, $update_data['current_position_status'], $update_data['current_company_or_institution']), get_current_user_id());

        return $this->success_response(array('message' => __('Student position and career details updated successfully.', 'institute-management-system')));
    }

    public function upgrade_course($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $table = "{$wpdb->prefix}ims_students";
        $student = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));
        if (!$student) {
            return $this->error_response('not_found', __('Student record not found.', 'institute-management-system'), 404);
        }

        $new_course_id = !empty($params['course_id']) ? intval($params['course_id']) : $student->course_id;
        $new_batch_id  = !empty($params['batch_id']) ? intval($params['batch_id']) : $student->batch_id;
        $course_fee    = isset($params['course_fee']) ? floatval($params['course_fee']) : floatval($student->course_fee);
        $discount_type = isset($params['discount_type']) && $params['discount_type'] === 'amount' ? 'amount' : 'percentage';
        $discount_val  = isset($params['discount_value']) ? floatval($params['discount_value']) : 0.00;

        if ($discount_type === 'percentage') {
            $net_fee = $course_fee - ($course_fee * ($discount_val / 100.0));
        } else {
            $net_fee = $course_fee - $discount_val;
        }
        $net_fee = max(0.00, round($net_fee, 2));

        $updated = $wpdb->update($table, array(
            'course_id'      => $new_course_id,
            'batch_id'       => $new_batch_id,
            'course_fee'     => $course_fee,
            'discount_type'  => $discount_type,
            'discount_value' => $discount_val,
            'net_fee'        => $net_fee,
            'status'         => 'active',
        ), array('id' => $id));

        if (false === $updated) {
            return $this->error_response('db_error', __('Failed to upgrade student course: ', 'institute-management-system') . $wpdb->last_error, 500);
        }

        require_once __DIR__ . '/../class-ims-audit.php';
        IMS_Audit::log('student_course_upgraded', $id, sprintf('Student %s (%s) upgraded to Course ID #%d / Batch ID #%d (New Net Fee: ₹%s)', $student->roll_no, $student->first_name . ' ' . $student->last_name, $new_course_id, $new_batch_id, number_format($net_fee, 2)), get_current_user_id());

        return $this->success_response(array('message' => __('Student upgraded/enrolled in new course successfully.', 'institute-management-system'), 'net_fee' => $net_fee));
    }

    public function delete_student($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_students', $id);
        return $this->success_response(array('message' => __('Student profile deleted.', 'institute-management-system')));
    }
}
