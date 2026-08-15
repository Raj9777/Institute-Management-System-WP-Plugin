<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Agreements extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/admission-agreements', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_agreements'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_agreement'),
                'permission_callback' => array($this, 'check_agreements_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/admission-agreements/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_agreement'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_agreement'),
                'permission_callback' => array($this, 'check_agreements_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/admission-agreements/(?P<id>\d+)/print', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_agreement_print'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
        ));
    }

    public function check_agreements_permission_write() {
        return $this->check_capability('ims_manage_finances', true) || $this->check_capability('ims_manage_students', true);
    }

    public function get_agreements($request) {
        global $wpdb;
        $table   = "{$wpdb->prefix}ims_admission_agreements";
        $s_table = "{$wpdb->prefix}ims_students";
        $c_table = "{$wpdb->prefix}ims_courses";

        $student_id = (int) $request->get_param('student_id');

        $where = "WHERE a.deleted_at IS NULL";
        $params = array();

        if (!empty($student_id)) {
            $where .= " AND a.student_id = %d";
            $params[] = $student_id;
        }

        $sql = "
            SELECT a.*, s.roll_no, s.first_name, s.last_name, s.phone, c.name AS course_name
            FROM {$table} a
            LEFT JOIN {$s_table} s ON a.student_id = s.id
            LEFT JOIN {$c_table} c ON s.course_id = c.id
            {$where}
            ORDER BY a.id DESC
        ";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $results = $wpdb->get_results($sql);

        foreach ($results as &$row) {
            $row->id            = intval($row->id);
            $row->student_id    = intval($row->student_id);
            $row->exam_fee      = floatval($row->exam_fee);
            $row->inv_val       = floatval($row->inv_val);
            $row->caution_deposit = floatval($row->caution_deposit);
            $row->first_receipt_val = floatval($row->first_receipt_val);
            $row->student_name  = trim($row->first_name . ' ' . $row->last_name);
            $row->instalments   = !empty($row->instalments) ? json_decode($row->instalments, true) : array();
        }

        return $this->success_response($results);
    }

    public function get_agreement($request) {
        global $wpdb;
        $id      = (int) $request['id'];
        $table   = "{$wpdb->prefix}ims_admission_agreements";
        $s_table = "{$wpdb->prefix}ims_students";
        $c_table = "{$wpdb->prefix}ims_courses";

        $row = $wpdb->get_row($wpdb->prepare("
            SELECT a.*, s.roll_no, s.first_name, s.last_name, s.guardian_name, s.address AS student_address, s.phone, c.name AS course_name
            FROM {$table} a
            LEFT JOIN {$s_table} s ON a.student_id = s.id
            LEFT JOIN {$c_table} c ON s.course_id = c.id
            WHERE a.id = %d AND a.deleted_at IS NULL
        ", $id));

        if (!$row) {
            return $this->error_response('not_found', __('Admission Agreement record not found.', 'institute-management-system'), 404);
        }

        $row->id            = intval($row->id);
        $row->student_id    = intval($row->student_id);
        $row->exam_fee      = floatval($row->exam_fee);
        $row->inv_val       = floatval($row->inv_val);
        $row->caution_deposit = floatval($row->caution_deposit);
        $row->first_receipt_val = floatval($row->first_receipt_val);
        $row->student_name  = trim($row->first_name . ' ' . $row->last_name);
        $row->instalments   = !empty($row->instalments) ? json_decode($row->instalments, true) : array();

        return $this->success_response($row);
    }

    public function create_agreement($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $student_id = intval(isset($params['student_id']) ? $params['student_id'] : 0);
        if (empty($student_id)) {
            return $this->error_response('missing_fields', __('Student selection is required for Admission Agreement.', 'institute-management-system'));
        }

        $s_table = "{$wpdb->prefix}ims_students";
        $student = $wpdb->get_row($wpdb->prepare("SELECT id FROM {$s_table} WHERE id = %d AND deleted_at IS NULL", $student_id));
        if (!$student) {
            return $this->error_response('not_found', __('Selected student not found.', 'institute-management-system'), 404);
        }

        $agreement_date = !empty($params['agreement_date']) ? sanitize_text_field($params['agreement_date']) : current_time('Y-m-d');
        $agreement_no   = IMS_DB::get_next_sequence('admission_agreement');

        // Parse instalments array
        $instalments_input = isset($params['instalments']) && is_array($params['instalments']) ? $params['instalments'] : array();
        $clean_instalments = array();
        foreach ($instalments_input as $inst) {
            if (!is_array($inst)) continue;
            $clean_instalments[] = array(
                'name'        => sanitize_text_field(isset($inst['name']) ? $inst['name'] : 'Instalment'),
                'due_date'    => !empty($inst['due_date']) ? date('d/m/Y', strtotime($inst['due_date'])) : '',
                'raw_due'     => sanitize_text_field(isset($inst['due_date']) ? $inst['due_date'] : ''),
                'amount'      => floatval(isset($inst['amount']) ? $inst['amount'] : 0),
                'amount_date' => sanitize_text_field(isset($inst['amount_date']) ? $inst['amount_date'] : ''),
                'paid_date'   => sanitize_text_field(isset($inst['paid_date']) ? $inst['paid_date'] : ''),
            );
        }

        $table = "{$wpdb->prefix}ims_admission_agreements";
        $wpdb->insert($table, array(
            'agreement_no'       => $agreement_no,
            'student_id'         => $student_id,
            'prev_invoice_no'    => sanitize_text_field(isset($params['prev_invoice_no']) ? $params['prev_invoice_no'] : ''),
            'agreement_date'     => $agreement_date,
            'exam_fee'           => floatval(isset($params['exam_fee']) ? $params['exam_fee'] : 0),
            'inv_val'            => floatval(isset($params['inv_val']) ? $params['inv_val'] : 0),
            'caution_deposit'    => floatval(isset($params['caution_deposit']) ? $params['caution_deposit'] : 0),
            'first_receipt_no'   => sanitize_text_field(isset($params['first_receipt_no']) ? $params['first_receipt_no'] : ''),
            'first_receipt_val'  => floatval(isset($params['first_receipt_val']) ? $params['first_receipt_val'] : 0),
            'first_receipt_date' => !empty($params['first_receipt_date']) ? sanitize_text_field($params['first_receipt_date']) : null,
            'second_receipt_no'  => sanitize_text_field(isset($params['second_receipt_no']) ? $params['second_receipt_no'] : ''),
            'second_receipt_date'=> !empty($params['second_receipt_date']) ? sanitize_text_field($params['second_receipt_date']) : null,
            'instalments'        => wp_json_encode($clean_instalments),
            'notes'              => sanitize_textarea_field(isset($params['notes']) ? $params['notes'] : ''),
            'created_by'         => get_current_user_id(),
        ));

        $id = $wpdb->insert_id;

        return $this->success_response(array(
            'id'           => $id,
            'agreement_no' => $agreement_no,
            'message'      => __('Admission Agreement created successfully.', 'institute-management-system')
        ));
    }

    public function delete_agreement($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_admission_agreements', $id);
        return $this->success_response(array('message' => __('Admission Agreement deleted.', 'institute-management-system')));
    }

    public function get_agreement_print($request) {
        global $wpdb;
        $id      = (int) $request['id'];
        $table   = "{$wpdb->prefix}ims_admission_agreements";
        $s_table = "{$wpdb->prefix}ims_students";
        $c_table = "{$wpdb->prefix}ims_courses";

        $agreement = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$agreement) {
            return $this->error_response('not_found', __('Admission Agreement not found.', 'institute-management-system'), 404);
        }

        // Student details
        $student = $wpdb->get_row($wpdb->prepare("
            SELECT s.id, s.roll_no, s.first_name, s.last_name, s.guardian_name, s.phone, s.email, s.address,
                   c.name AS course_name
            FROM {$s_table} s
            LEFT JOIN {$c_table} c ON s.course_id = c.id
            WHERE s.id = %d
        ", $agreement->student_id));

        $instalments = !empty($agreement->instalments) ? json_decode($agreement->instalments, true) : array();
        if (!is_array($instalments)) {
            $instalments = array();
        }

        // Format agreement details
        $agreement_data = array(
            'id'                  => intval($agreement->id),
            'agreement_no'        => $agreement->agreement_no,
            'prev_invoice_no'     => $agreement->prev_invoice_no,
            'agreement_date'      => date('d/m/Y', strtotime($agreement->agreement_date)),
            'raw_date'            => $agreement->agreement_date,
            'exam_fee'            => floatval($agreement->exam_fee),
            'inv_val'             => floatval($agreement->inv_val),
            'caution_deposit'     => floatval($agreement->caution_deposit),
            'first_receipt_no'    => $agreement->first_receipt_no,
            'first_receipt_val'   => floatval($agreement->first_receipt_val),
            'first_receipt_date'  => !empty($agreement->first_receipt_date) ? date('d/m/Y', strtotime($agreement->first_receipt_date)) : '',
            'second_receipt_no'   => $agreement->second_receipt_no,
            'second_receipt_date' => !empty($agreement->second_receipt_date) ? date('d/m/Y', strtotime($agreement->second_receipt_date)) : '',
            'instalments'         => $instalments,
            'notes'               => $agreement->notes,
        );

        $student_data = array(
            'id'            => $student ? intval($student->id) : 0,
            'roll_no'       => $student ? $student->roll_no : 'N/A',
            'full_name'     => $student ? trim($student->first_name . ' ' . $student->last_name) : 'N/A',
            'guardian_name' => $student ? ($student->guardian_name ?: '') : '',
            'address'       => $student ? ($student->address ?: '') : '',
            'course_name'   => $student ? ($student->course_name ?: 'Course Program') : 'Course Program',
            'phone'         => $student ? $student->phone : '',
        );

        $settings = get_option('ims_institute_settings', array());
        $settings_data = array(
            'institute_name'  => !empty($settings['institute_name']) ? $settings['institute_name'] : 'Apinet Computer Education',
            'tagline'         => !empty($settings['tagline']) ? $settings['tagline'] : 'Excellence in Education',
            'website'         => !empty($settings['website']) ? $settings['website'] : 'www.apineteducation.com',
            'logo_url'        => !empty($settings['logo_url']) ? $settings['logo_url'] : '',
            'signature_url'   => !empty($settings['signature_url']) ? $settings['signature_url'] : '',
            'address'         => !empty($settings['address']) ? $settings['address'] : '123 Academic Row, Education Hub',
            'phone'           => !empty($settings['phone']) ? $settings['phone'] : '+91 9876543210',
            'admission_terms' => !empty($settings['admission_terms']) ? $settings['admission_terms'] : "I have read and understood the code of conduct, and payment term / Installment plan mentioned above and agree to abide by them and also the terms and conditions Printed overleaf.",
        );

        return $this->success_response(array(
            'agreement' => $agreement_data,
            'student'   => $student_data,
            'settings'  => $settings_data,
        ));
    }
}
