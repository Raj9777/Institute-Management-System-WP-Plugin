<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Finances extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/invoices', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_invoices'),
                'permission_callback' => array($this, 'check_finance_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_invoice'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/invoices/(?P<id>\d+)', array(
            'methods'             => 'DELETE',
            'callback'            => array($this, 'delete_invoice'),
            'permission_callback' => array($this, 'check_finance_permission_write'),
        ));

        register_rest_route($this->namespace, '/payments', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_payments'),
                'permission_callback' => array($this, 'check_finance_or_student_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_payment'),
                'permission_callback' => array($this, 'check_finance_or_student_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/payments/(?P<id>\d+)', array(
            'methods'             => 'DELETE',
            'callback'            => array($this, 'delete_payment'),
            'permission_callback' => array($this, 'check_finance_permission_write'),
        ));

        register_rest_route($this->namespace, '/payments/(?P<id>\d+)/receipt', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_payment_receipt'),
            'permission_callback' => function() { return is_user_logged_in(); },
        ));

        register_rest_route($this->namespace, '/payments/reversal', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'record_payment_reversal'),
            'permission_callback' => array($this, 'check_finance_permission_write'),
        ));

        register_rest_route($this->namespace, '/documents', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_documents'),
            'permission_callback' => function() {
                return is_user_logged_in() && (current_user_can('ims_manage_finances') || current_user_can('ims_manage_students') || current_user_can('administrator'));
            },
        ));
    }

    public function delete_invoice($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_invoices', $id);
        return $this->success_response(array('message' => __('Invoice cancelled and soft deleted.', 'institute-management-system')));
    }

    public function delete_payment($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_payments', $id);
        return $this->success_response(array('message' => __('Payment record deleted.', 'institute-management-system')));
    }

    public function check_finance_permission() {
        return $this->check_capability('ims_manage_finances');
    }

    public function check_finance_permission_write() {
        return $this->check_capability('ims_manage_finances', true);
    }

    public function check_finance_or_student_permission() {
        $fin = $this->check_capability('ims_manage_finances');
        if (true === $fin) {
            return true;
        }
        $stu = $this->check_capability('ims_manage_students');
        if (true === $stu) {
            return true;
        }
        return $fin;
    }

    public function check_finance_or_student_permission_write() {
        $fin = $this->check_capability('ims_manage_finances', true);
        if (true === $fin) {
            return true;
        }
        $stu = $this->check_capability('ims_manage_students', true);
        if (true === $stu) {
            return true;
        }
        return $fin;
    }

    public function get_invoices($request) {
        global $wpdb;
        $invoices_table = "{$wpdb->prefix}ims_invoices";
        $students_table = "{$wpdb->prefix}ims_students";

        $student_id = intval($request->get_param('student_id'));
        $where = "WHERE i.deleted_at IS NULL";
        $params = array();

        $courses_table  = "{$wpdb->prefix}ims_courses";

        if (!empty($student_id)) {
            $where .= " AND i.student_id = %d";
            $params[] = $student_id;
        }

        $sql = "
SELECT i.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.roll_no, c.name AS course_name,
       (SELECT COALESCE(SUM(p.amount), 0) FROM {$wpdb->prefix}ims_payments p WHERE p.invoice_id = i.id AND p.deleted_at IS NULL) AS paid_amount
FROM {$invoices_table} i
LEFT JOIN {$students_table} s ON i.student_id = s.id
LEFT JOIN {$courses_table} c ON s.course_id = c.id
{$where}
ORDER BY i.created_at DESC
        ";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $results = $wpdb->get_results($sql);
        return $this->success_response($results);
    }

    public function create_invoice($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $student_id     = intval($params['student_id']);
        $taxable_amount = floatval($params['taxable_amount']);

        if (empty($student_id) || $taxable_amount <= 0) {
            return $this->error_response('invalid_payload', __('Student ID and a positive Taxable Amount are required.', 'institute-management-system'));
        }

        $settings  = get_option('ims_institute_settings', array());
        $cgst_rate = floatval(isset($settings['cgst_rate']) ? $settings['cgst_rate'] : 9.00);
        $sgst_rate = floatval(isset($settings['sgst_rate']) ? $settings['sgst_rate'] : 9.00);
        $gstin     = sanitize_text_field(isset($settings['gstin']) ? $settings['gstin'] : '');

        $cgst_amount  = round(($taxable_amount * $cgst_rate) / 100, 2);
        $sgst_amount  = round(($taxable_amount * $sgst_rate) / 100, 2);
        $total_tax    = $cgst_amount + $sgst_amount;
        $total_amount = $taxable_amount + $total_tax;

        // Transaction-safe invoice number
        $invoice_no = IMS_DB::get_next_sequence('invoice');

        $invoice_date = !empty($params['invoice_date']) ? sanitize_text_field($params['invoice_date']) : current_time('Y-m-d');
        $date_check   = IMS_Validation::assert_date_allowed($invoice_date, 'Invoice Date');
        if (is_wp_error($date_check)) {
            return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
        }

        $table = "{$wpdb->prefix}ims_invoices";
        $inserted = $wpdb->insert($table, array(
            'invoice_no'     => $invoice_no,
            'student_id'     => $student_id,
            'gstin'          => $gstin,
            'taxable_amount' => $taxable_amount,
            'cgst_rate'      => $cgst_rate,
            'cgst_amount'    => $cgst_amount,
            'sgst_rate'      => $sgst_rate,
            'sgst_amount'    => $sgst_amount,
            'total_tax'      => $total_tax,
            'total_amount'   => $total_amount,
            'invoice_date'   => $invoice_date,
            'status'         => 'unpaid',
            'created_by'     => get_current_user_id() ?: 1,
        ));

        if (false === $inserted || !$wpdb->insert_id) {
            return $this->error_response('db_error', __('Failed to generate GST invoice: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
        }

        return $this->success_response(array(
            'id'           => $wpdb->insert_id,
            'invoice_no'   => $invoice_no,
            'total_amount' => $total_amount,
            'message'      => __('GST Invoice generated successfully.', 'institute-management-system')
        ));
    }

    public function get_payments($request) {
        global $wpdb;
        $payments_table = "{$wpdb->prefix}ims_payments";
        $students_table = "{$wpdb->prefix}ims_students";

        $invoice_id = intval($request->get_param('invoice_id'));
        $student_id = intval($request->get_param('student_id'));
        $where = "WHERE p.deleted_at IS NULL";
        $params = array();

        if (!empty($invoice_id)) {
            $where .= " AND p.invoice_id = %d";
            $params[] = $invoice_id;
        }

        if (!empty($student_id)) {
            $where .= " AND p.student_id = %d";
            $params[] = $student_id;
        }

        $sql = "
SELECT p.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.roll_no
FROM {$payments_table} p
LEFT JOIN {$students_table} s ON p.student_id = s.id
{$where}
ORDER BY p.created_at DESC
        ";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $results = $wpdb->get_results($sql);
        return $this->success_response($results);
    }

    public function create_payment($request) {
        global $wpdb;
        try {
            $params = $request->get_json_params();

            $invoice_id   = intval(isset($params['invoice_id']) ? $params['invoice_id'] : 0);
            $student_id   = intval(isset($params['student_id']) ? $params['student_id'] : 0);
            $amount       = floatval(isset($params['amount']) ? $params['amount'] : 0);
            $payment_mode = sanitize_text_field(isset($params['payment_mode']) ? $params['payment_mode'] : '');
            $payment_date = !empty($params['payment_date']) ? sanitize_text_field($params['payment_date']) : current_time('Y-m-d');
            $reference_no = sanitize_text_field(isset($params['reference_no']) ? $params['reference_no'] : '');

            if ($amount <= 0 || empty($payment_mode) || (empty($invoice_id) && empty($student_id))) {
                return $this->error_response('invalid_payload', __('Student selection or Invoice ID, valid Amount, and Payment Mode are required.', 'institute-management-system'), 400);
            }

            $date_check = IMS_Validation::assert_date_allowed($payment_date, 'Payment Date');
            if (is_wp_error($date_check)) {
                return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
            }

            $inv_table = "{$wpdb->prefix}ims_invoices";
            $students_table = "{$wpdb->prefix}ims_students";
            $invoice = null;

            if (!empty($invoice_id)) {
                $invoice = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$inv_table} WHERE id = %d AND deleted_at IS NULL", $invoice_id));
                if (!$invoice) {
                    return $this->error_response('not_found', __('Associated invoice not found.', 'institute-management-system'), 404);
                }
                $student_id = intval($invoice->student_id);
            } else {
                // Find open invoice for student or auto-create one
                $invoice = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$inv_table} WHERE student_id = %d AND deleted_at IS NULL ORDER BY id DESC LIMIT 1", $student_id));
                if (!$invoice) {
                    $student = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$students_table} WHERE id = %d AND deleted_at IS NULL", $student_id));
                    if (!$student) {
                        return $this->error_response('not_found', __('Selected student not found.', 'institute-management-system'), 404);
                    }
                    $invoice_no = IMS_DB::get_next_sequence('invoice');
                    $course_fee = floatval(!empty($student->net_fee) && $student->net_fee > 0 ? $student->net_fee : $amount);
                    $ins_inv = $wpdb->insert($inv_table, array(
                        'invoice_no'     => !empty($invoice_no) ? $invoice_no : ('INV-' . date('Y') . '-' . time()),
                        'student_id'     => $student_id,
                        'gstin'          => '',
                        'taxable_amount' => $course_fee,
                        'cgst_rate'      => 0.00,
                        'cgst_amount'    => 0.00,
                        'sgst_rate'      => 0.00,
                        'sgst_amount'    => 0.00,
                        'total_tax'      => 0.00,
                        'total_amount'   => $course_fee,
                        'invoice_date'   => $payment_date,
                        'status'         => 'unpaid',
                        'created_by'     => get_current_user_id() ?: 1,
                    ));
                    if (false === $ins_inv || !$wpdb->insert_id) {
                        error_log('[IMS create_payment db_error invoice] ' . $wpdb->last_error);
                        return $this->error_response('db_error', __('Failed to create invoice record for payment: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
                    }
                    $invoice_id = $wpdb->insert_id;
                    $invoice = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$inv_table} WHERE id = %d", $invoice_id));
                } else {
                    $invoice_id = intval($invoice->id);
                }
            }

            $receipt_no = IMS_DB::get_next_sequence('receipt');

            $fee_breakdown_raw = isset($params['fee_breakdown']) ? $params['fee_breakdown'] : null;
            $fee_breakdown_json = null;
            if (is_array($fee_breakdown_raw)) {
                $fee_breakdown_json = wp_json_encode(array(
                    'course_fee'     => floatval(isset($fee_breakdown_raw['course_fee']) ? $fee_breakdown_raw['course_fee'] : $amount),
                    'exam_fee'       => floatval(isset($fee_breakdown_raw['exam_fee']) ? $fee_breakdown_raw['exam_fee'] : 0),
                    'late_fee'       => floatval(isset($fee_breakdown_raw['late_fee']) ? $fee_breakdown_raw['late_fee'] : 0),
                    'prospectus'     => floatval(isset($fee_breakdown_raw['prospectus']) ? $fee_breakdown_raw['prospectus'] : 0),
                    'caution_deposit'=> floatval(isset($fee_breakdown_raw['caution_deposit']) ? $fee_breakdown_raw['caution_deposit'] : 0),
                    'others'         => floatval(isset($fee_breakdown_raw['others']) ? $fee_breakdown_raw['others'] : 0),
                    'towards'        => sanitize_text_field(isset($fee_breakdown_raw['towards']) ? $fee_breakdown_raw['towards'] : 'Course Fee'),
                    'drawn_on'       => sanitize_text_field(isset($fee_breakdown_raw['drawn_on']) ? $fee_breakdown_raw['drawn_on'] : ''),
                    'cheque_date'    => sanitize_text_field(isset($fee_breakdown_raw['cheque_date']) ? $fee_breakdown_raw['cheque_date'] : ''),
                ));
            }

            $table = "{$wpdb->prefix}ims_payments";
            $inserted_pay = $wpdb->insert($table, array(
                'receipt_no'          => !empty($receipt_no) ? $receipt_no : ('REC-' . date('Y') . '-' . time()),
                'invoice_id'          => $invoice_id ?: 0,
                'student_id'          => $student_id,
                'amount'              => $amount,
                'payment_mode'        => $payment_mode,
                'reference_no'        => $reference_no,
                'payment_date'        => $payment_date,
                'fee_breakdown'       => $fee_breakdown_json,
                'is_reversal'         => 0,
                'original_payment_id' => null,
                'reversal_reason'     => '',
                'created_by'          => get_current_user_id() ?: 1,
            ));

            if (false === $inserted_pay || !$wpdb->insert_id) {
                error_log('[IMS create_payment db_error payment] ' . $wpdb->last_error);
                return $this->error_response('db_error', __('Failed to record payment: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
            }

            $payment_id = $wpdb->insert_id;

            // Recalculate invoice status (paid vs partial)
            if ($invoice && !empty($invoice->id)) {
                $paid_sum = $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(amount), 0) FROM {$table} WHERE invoice_id = %d AND is_reversal = 0 AND deleted_at IS NULL", $invoice->id));
                $new_status = ($paid_sum >= floatval($invoice->total_amount)) ? 'paid' : 'partial';
                $wpdb->update($inv_table, array('status' => $new_status), array('id' => $invoice->id));
            } else {
                $new_status = 'paid';
            }

            return $this->success_response(array(
                'id'         => $payment_id,
                'receipt_no' => !empty($receipt_no) ? $receipt_no : ('REC-' . date('Y') . '-' . $payment_id),
                'status'     => $new_status,
                'message'    => __('Payment recorded and money receipt issued.', 'institute-management-system')
            ));
        } catch (Throwable $e) {
            error_log('[IMS create_payment Exception] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return $this->error_response('server_error', __('An error occurred while processing payment: ', 'institute-management-system') . $e->getMessage(), 500);
        }
    }

    public function get_payment_receipt($request) {
        global $wpdb;
        $id = (int) $request['id'];

        $p_table = "{$wpdb->prefix}ims_payments";
        $payment = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$p_table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$payment) {
            return $this->error_response('not_found', __('Payment record not found.', 'institute-management-system'), 404);
        }

        // Fetch Student details
        $s_table = "{$wpdb->prefix}ims_students";
        $c_table = "{$wpdb->prefix}ims_courses";
        $b_table = "{$wpdb->prefix}ims_batches";

        $student = $wpdb->get_row($wpdb->prepare("
            SELECT s.id, s.roll_no, s.first_name, s.last_name, s.guardian_name, s.phone, s.email,
                   c.name AS course_name, b.name AS batch_name
            FROM {$s_table} s
            LEFT JOIN {$c_table} c ON s.course_id = c.id
            LEFT JOIN {$b_table} b ON s.batch_id = b.id
            WHERE s.id = %d
        ", $payment->student_id));

        // Fetch Invoice details if linked
        $invoice_no = '';
        if (!empty($payment->invoice_id)) {
            $i_table = "{$wpdb->prefix}ims_invoices";
            $invoice_no = $wpdb->get_var($wpdb->prepare("SELECT invoice_no FROM {$i_table} WHERE id = %d", $payment->invoice_id));
        }

        // Parse fee breakdown
        $breakdown_raw = !empty($payment->fee_breakdown) ? json_decode($payment->fee_breakdown, true) : array();
        if (!is_array($breakdown_raw)) {
            $breakdown_raw = array();
        }

        $course_fee     = floatval(isset($breakdown_raw['course_fee']) ? $breakdown_raw['course_fee'] : $payment->amount);
        $exam_fee       = floatval(isset($breakdown_raw['exam_fee']) ? $breakdown_raw['exam_fee'] : 0);
        $late_fee       = floatval(isset($breakdown_raw['late_fee']) ? $breakdown_raw['late_fee'] : 0);
        $prospectus     = floatval(isset($breakdown_raw['prospectus']) ? $breakdown_raw['prospectus'] : 0);
        $caution_deposit= floatval(isset($breakdown_raw['caution_deposit']) ? $breakdown_raw['caution_deposit'] : 0);
        $others         = floatval(isset($breakdown_raw['others']) ? $breakdown_raw['others'] : 0);
        $towards        = !empty($breakdown_raw['towards']) ? sanitize_text_field($breakdown_raw['towards']) : ($student ? $student->course_name : 'Course Fee');

        $total_itemized = $course_fee + $exam_fee + $late_fee + $prospectus + $caution_deposit + $others;
        if ($total_itemized <= 0) {
            $course_fee     = floatval($payment->amount);
            $total_itemized = floatval($payment->amount);
        }

        $drawn_on    = !empty($breakdown_raw['drawn_on']) ? sanitize_text_field($breakdown_raw['drawn_on']) : '';
        $cheque_date = !empty($breakdown_raw['cheque_date']) ? sanitize_text_field($breakdown_raw['cheque_date']) : '';

        // Generate amount in words using IMS_Helper
        require_once IMS_PLUGIN_DIR . 'includes/class-ims-helper.php';
        $amount_in_words = IMS_Helper::number_to_words_inr($payment->amount);

        // Fetch Institute Settings
        $settings = get_option('ims_institute_settings', array());
        $receipt_prefix = !empty($settings['receipt_prefix']) ? $settings['receipt_prefix'] : 'REC';

        // Format receipt_no
        $formatted_receipt_no = $payment->receipt_no;
        if (strpos($formatted_receipt_no, '/') === false && strpos($formatted_receipt_no, '-') === false) {
            $formatted_receipt_no = $receipt_prefix . '/' . str_pad($payment->id, 5, '0', STR_PAD_LEFT);
        }

        $receipt_data = array(
            'id'              => intval($payment->id),
            'receipt_no'      => $formatted_receipt_no,
            'raw_receipt_no'  => $payment->receipt_no,
            'payment_date'    => date('d/m/Y', strtotime($payment->payment_date)),
            'raw_date'        => $payment->payment_date,
            'invoice_id'      => intval($payment->invoice_id),
            'invoice_no'      => $invoice_no ?: 'N/A',
            'student_id'      => intval($payment->student_id),
            'amount'          => floatval($payment->amount),
            'amount_in_words' => $amount_in_words,
            'payment_mode'    => $payment->payment_mode,
            'reference_no'    => $payment->reference_no,
            'drawn_on'        => $drawn_on,
            'cheque_date'     => $cheque_date,
            'towards'         => $towards,
            'fee_breakdown'   => array(
                'course_fee'     => $course_fee,
                'exam_fee'       => $exam_fee,
                'late_fee'       => $late_fee,
                'prospectus'     => $prospectus,
                'caution_deposit'=> $caution_deposit,
                'others'         => $others,
                'total'          => $total_itemized,
            )
        );

        $student_data = array(
            'id'            => $student ? intval($student->id) : 0,
            'roll_no'       => $student ? $student->roll_no : 'N/A',
            'full_name'     => $student ? trim($student->first_name . ' ' . $student->last_name) : 'N/A',
            'guardian_name' => $student ? ($student->guardian_name ?: trim($student->first_name . ' ' . $student->last_name)) : 'N/A',
            'course_name'   => $student ? ($student->course_name ?: 'Course Fee') : 'Course Fee',
            'batch_name'    => $student ? ($student->batch_name ?: 'Standard') : 'Standard',
        );

        $settings_data = array(
            'institute_name' => !empty($settings['institute_name']) ? $settings['institute_name'] : 'Apinet Computer Education',
            'tagline'        => !empty($settings['tagline']) ? $settings['tagline'] : 'Excellence in Education',
            'website'        => !empty($settings['website']) ? $settings['website'] : 'www.apineteducation.com',
            'logo_url'       => !empty($settings['logo_url']) ? $settings['logo_url'] : '',
            'signature_url'  => !empty($settings['signature_url']) ? $settings['signature_url'] : '',
            'address'        => !empty($settings['address']) ? $settings['address'] : '123 Academic Row, Education Hub',
            'phone'          => !empty($settings['phone']) ? $settings['phone'] : '+91 9876543210',
            'gstin'          => !empty($settings['gstin']) ? $settings['gstin'] : '',
            'receipt_terms'  => !empty($settings['receipt_terms']) ? $settings['receipt_terms'] : "* Cheques subject to realisation.\nThe receipt must be produced when demanded. Fee once paid are not refundable.",
        );

        return $this->success_response(array(
            'receipt'  => $receipt_data,
            'student'  => $student_data,
            'settings' => $settings_data,
        ));
    }

    public function record_payment_reversal($request) {
        global $wpdb;
        try {
            $params = $request->get_json_params();

            $original_payment_id = intval($params['original_payment_id']);
            $reason              = sanitize_text_field($params['reversal_reason']);

            if (empty($original_payment_id) || empty($reason)) {
                return $this->error_response('missing_fields', __('Original Payment ID and Reversal Reason are required.', 'institute-management-system'));
            }

            $payments_table = "{$wpdb->prefix}ims_payments";
            $orig = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$payments_table} WHERE id = %d AND is_reversal = 0 AND deleted_at IS NULL", $original_payment_id));

            if (!$orig) {
                return $this->error_response('not_found', __('Original payment record not found.', 'institute-management-system'), 404);
            }

            $reversal_date = !empty($params['payment_date']) ? sanitize_text_field($params['payment_date']) : current_time('Y-m-d');
            $date_check    = IMS_Validation::assert_date_allowed($reversal_date, 'Reversal Date');
            if (is_wp_error($date_check)) {
                return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
            }

            $receipt_no = IMS_DB::get_next_sequence('receipt') . '-REV';

            // Insert reversal row (immutable ledger entry)
            $wpdb->insert($payments_table, array(
                'receipt_no'          => $receipt_no,
                'invoice_id'          => $orig->invoice_id,
                'student_id'          => $orig->student_id,
                'amount'              => -abs($orig->amount),
                'payment_mode'        => $orig->payment_mode,
                'reference_no'        => 'REV-' . $orig->receipt_no,
                'payment_date'        => $reversal_date,
                'is_reversal'         => 1,
                'original_payment_id' => $orig->id,
                'reversal_reason'     => $reason,
                'created_by'          => get_current_user_id(),
            ));

            // Update invoice status after reversal
            $inv_table = "{$wpdb->prefix}ims_invoices";
            $paid_sum  = $wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(amount), 0) FROM {$payments_table} WHERE invoice_id = %d AND deleted_at IS NULL", $orig->invoice_id));
            $invoice   = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$inv_table} WHERE id = %d", $orig->invoice_id));

            $new_status = 'unpaid';
            if ($invoice && floatval($invoice->total_amount) > 0) {
                if ($paid_sum >= floatval($invoice->total_amount)) {
                    $new_status = 'paid';
                } elseif ($paid_sum > 0) {
                    $new_status = 'partial';
                }
            }
            if ($orig->invoice_id) {
                $wpdb->update($inv_table, array('status' => $new_status), array('id' => $orig->invoice_id));
            }

            return $this->success_response(array('message' => __('Payment reversal entry recorded successfully.', 'institute-management-system')));
        } catch (Throwable $e) {
            error_log('[IMS record_payment_reversal Exception] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return $this->error_response('server_error', __('An error occurred while reversing payment: ', 'institute-management-system') . $e->getMessage(), 500);
        }
    }

    public function get_documents($request) {
        global $wpdb;
        $type       = sanitize_text_field($request->get_param('type'));
        $student_id = intval($request->get_param('student_id'));
        $start_date = sanitize_text_field($request->get_param('start_date'));
        $end_date   = sanitize_text_field($request->get_param('end_date'));
        $search     = sanitize_text_field($request->get_param('search'));

        $has_finance_cap = current_user_can('ims_manage_finances') || current_user_can('administrator');

        if ($type === 'invoice' && !$has_finance_cap) {
            return $this->error_response('permission_denied', __('You do not have permission to access financial invoice documents.', 'institute-management-system'), 403);
        }

        $documents = array();

        // Fetch Receipts
        if ($type !== 'invoice') {
            $p_where = "WHERE p.deleted_at IS NULL AND p.is_reversal = 0";
            $p_params = array();

            if ($student_id > 0) {
                $p_where .= " AND p.student_id = %d";
                $p_params[] = $student_id;
            }
            if (!empty($start_date)) {
                $p_where .= " AND p.payment_date >= %s";
                $p_params[] = $start_date;
            }
            if (!empty($end_date)) {
                $p_where .= " AND p.payment_date <= %s";
                $p_params[] = $end_date;
            }
            if (!empty($search)) {
                $p_where .= " AND (p.receipt_no LIKE %s OR s.first_name LIKE %s OR s.last_name LIKE %s OR s.roll_no LIKE %s)";
                $s_like = '%' . $wpdb->esc_like($search) . '%';
                $p_params[] = $s_like;
                $p_params[] = $s_like;
                $p_params[] = $s_like;
                $p_params[] = $s_like;
            }

            $p_sql = "
                SELECT p.id, 'receipt' AS doc_type, p.receipt_no AS doc_no, p.payment_date AS doc_date,
                       p.amount, 'paid' AS status, p.payment_mode, p.reference_no, p.notes,
                       s.id AS student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.roll_no,
                       c.name AS course_name, b.name AS batch_name
                FROM {$wpdb->prefix}ims_payments p
                LEFT JOIN {$wpdb->prefix}ims_students s ON p.student_id = s.id
                LEFT JOIN {$wpdb->prefix}ims_courses c ON s.course_id = c.id
                LEFT JOIN {$wpdb->prefix}ims_batches b ON s.batch_id = b.id
                {$p_where}
            ";

            if (!empty($p_params)) {
                $p_sql = $wpdb->prepare($p_sql, $p_params);
            }
            $receipts = $wpdb->get_results($p_sql);
            foreach ($receipts as $r) {
                $r->amount = floatval($r->amount);
                $documents[] = $r;
            }
        }

        // Fetch Invoices (only if user holds financial capability)
        if ($type !== 'receipt' && $has_finance_cap) {
            $i_where = "WHERE i.deleted_at IS NULL";
            $i_params = array();

            if ($student_id > 0) {
                $i_where .= " AND i.student_id = %d";
                $i_params[] = $student_id;
            }
            if (!empty($start_date)) {
                $i_where .= " AND i.invoice_date >= %s";
                $i_params[] = $start_date;
            }
            if (!empty($end_date)) {
                $i_where .= " AND i.invoice_date <= %s";
                $i_params[] = $end_date;
            }
            if (!empty($search)) {
                $i_where .= " AND (i.invoice_no LIKE %s OR s.first_name LIKE %s OR s.last_name LIKE %s OR s.roll_no LIKE %s)";
                $s_like = '%' . $wpdb->esc_like($search) . '%';
                $i_params[] = $s_like;
                $i_params[] = $s_like;
                $i_params[] = $s_like;
                $i_params[] = $s_like;
            }

            $i_sql = "
                SELECT i.id, 'invoice' AS doc_type, i.invoice_no AS doc_no, i.invoice_date AS doc_date,
                       i.total_amount AS amount, i.status, '' AS payment_mode, '' AS reference_no, '' AS notes,
                       i.taxable_amount, i.cgst_amount, i.sgst_amount, i.total_tax,
                       s.id AS student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name, s.roll_no,
                       c.name AS course_name, b.name AS batch_name
                FROM {$wpdb->prefix}ims_invoices i
                LEFT JOIN {$wpdb->prefix}ims_students s ON i.student_id = s.id
                LEFT JOIN {$wpdb->prefix}ims_courses c ON s.course_id = c.id
                LEFT JOIN {$wpdb->prefix}ims_batches b ON s.batch_id = b.id
                {$i_where}
            ";

            if (!empty($i_params)) {
                $i_sql = $wpdb->prepare($i_sql, $i_params);
            }
            $invoices = $wpdb->get_results($i_sql);
            foreach ($invoices as $inv) {
                $inv->amount = floatval($inv->amount);
                $inv->taxable_amount = floatval($inv->taxable_amount);
                $inv->cgst_amount = floatval($inv->cgst_amount);
                $inv->sgst_amount = floatval($inv->sgst_amount);
                $inv->total_tax = floatval($inv->total_tax);
                $documents[] = $inv;
            }
        }

        // Sort combined documents by date descending
        usort($documents, function($a, $b) {
            return strtotime($b->doc_date) - strtotime($a->doc_date);
        });

        return $this->success_response($documents);
    }
}
