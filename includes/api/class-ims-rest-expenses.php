<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Expenses extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/expenses', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_expenses'),
                'permission_callback' => array($this, 'check_finance_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_expense'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/expenses/(?P<id>\d+)', array(
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_expense'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_expense'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/vendors', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_vendors'),
                'permission_callback' => array($this, 'check_finance_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_vendor'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/vendors/(?P<id>\d+)', array(
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_vendor'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_vendor'),
                'permission_callback' => array($this, 'check_finance_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/vendors/(?P<id>\d+)/expenses', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_vendor_expenses'),
                'permission_callback' => array($this, 'check_finance_permission'),
            ),
        ));
    }

    public function check_finance_permission() {
        return $this->check_capability('ims_manage_finances');
    }

    public function check_finance_permission_write() {
        return $this->check_capability('ims_manage_finances', true);
    }

    public function get_expenses($request) {
        global $wpdb;
        $table = "{$wpdb->prefix}ims_expenses";
        $v_table = "{$wpdb->prefix}ims_vendors";

        $results = $wpdb->get_results("
            SELECT e.*, COALESCE(v.name, e.vendor_name) AS vendor_display_name
            FROM {$table} e
            LEFT JOIN {$v_table} v ON e.vendor_id = v.id
            WHERE e.deleted_at IS NULL
            ORDER BY e.expense_date DESC
        ");
        return $this->success_response($results);
    }

    public function create_expense($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $category    = sanitize_text_field(isset($params['category']) ? $params['category'] : 'General');
        $title       = sanitize_text_field(isset($params['title']) ? $params['title'] : '');
        $amount      = floatval(isset($params['amount']) ? $params['amount'] : 0);
        $description = sanitize_textarea_field(isset($params['description']) ? $params['description'] : '');
        $vendor_id   = !empty($params['vendor_id']) ? intval($params['vendor_id']) : null;
        $vendor_name = sanitize_text_field(isset($params['vendor_name']) ? $params['vendor_name'] : '');

        if (empty($title) || $amount <= 0) {
            return $this->error_response('invalid_payload', __('Title and a positive Amount are required.', 'institute-management-system'));
        }

        if ($vendor_id > 0 && empty($vendor_name)) {
            $v_row = $wpdb->get_row($wpdb->prepare("SELECT name FROM {$wpdb->prefix}ims_vendors WHERE id = %d", $vendor_id));
            if ($v_row) {
                $vendor_name = $v_row->name;
            }
        }

        $expense_date = !empty($params['expense_date']) ? sanitize_text_field($params['expense_date']) : current_time('Y-m-d');
        $date_check   = IMS_Validation::assert_date_allowed($expense_date, 'Expense Date');
        if (is_wp_error($date_check)) {
            return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
        }

        $voucher_no = IMS_DB::get_next_sequence('voucher');

        $table = "{$wpdb->prefix}ims_expenses";
        $wpdb->insert($table, array(
            'voucher_no'   => $voucher_no,
            'category'     => $category,
            'vendor_id'    => $vendor_id,
            'title'        => $title,
            'description'  => $description,
            'amount'       => $amount,
            'gstin'        => sanitize_text_field(isset($params['gstin']) ? $params['gstin'] : ''),
            'vendor_name'  => $vendor_name,
            'expense_date' => $expense_date,
            'payment_mode' => sanitize_text_field(isset($params['payment_mode']) ? $params['payment_mode'] : 'cash'),
            'receipt_url'  => esc_url_raw(isset($params['receipt_url']) ? $params['receipt_url'] : ''),
            'created_by'   => get_current_user_id(),
        ));

        return $this->success_response(array('id' => $wpdb->insert_id, 'voucher_no' => $voucher_no, 'message' => __('Expense voucher recorded.', 'institute-management-system')));
    }

    public function update_expense($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $vendor_id   = !empty($params['vendor_id']) ? intval($params['vendor_id']) : null;
        $vendor_name = sanitize_text_field(isset($params['vendor_name']) ? $params['vendor_name'] : '');

        if ($vendor_id > 0 && empty($vendor_name)) {
            $v_row = $wpdb->get_row($wpdb->prepare("SELECT name FROM {$wpdb->prefix}ims_vendors WHERE id = %d", $vendor_id));
            if ($v_row) {
                $vendor_name = $v_row->name;
            }
        }

        $expense_date = !empty($params['expense_date']) ? sanitize_text_field($params['expense_date']) : current_time('Y-m-d');
        $date_check   = IMS_Validation::assert_date_allowed($expense_date, 'Expense Date');
        if (is_wp_error($date_check)) {
            return $this->error_response($date_check->get_error_code(), $date_check->get_error_message(), 422);
        }

        $table = "{$wpdb->prefix}ims_expenses";
        $wpdb->update($table, array(
            'category'     => sanitize_text_field($params['category']),
            'vendor_id'    => $vendor_id,
            'title'        => sanitize_text_field($params['title']),
            'description'  => sanitize_textarea_field($params['description']),
            'amount'       => floatval($params['amount']),
            'gstin'        => sanitize_text_field(isset($params['gstin']) ? $params['gstin'] : ''),
            'vendor_name'  => $vendor_name,
            'expense_date' => $expense_date,
            'payment_mode' => sanitize_text_field(isset($params['payment_mode']) ? $params['payment_mode'] : 'cash'),
            'receipt_url'  => esc_url_raw(isset($params['receipt_url']) ? $params['receipt_url'] : ''),
        ), array('id' => $id));

        return $this->success_response(array('message' => __('Expense voucher updated.', 'institute-management-system')));
    }

    public function delete_expense($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_expenses', $id);
        return $this->success_response(array('message' => __('Expense voucher deleted.', 'institute-management-system')));
    }

    // Vendor Management Endpoints
    public function get_vendors($request) {
        global $wpdb;
        $table = "{$wpdb->prefix}ims_vendors";
        $results = $wpdb->get_results("SELECT * FROM {$table} WHERE deleted_at IS NULL ORDER BY name ASC");
        return $this->success_response($results);
    }

    public function create_vendor($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $name = sanitize_text_field($params['name'] ?? '');
        if (empty($name)) {
            return $this->error_response('missing_name', __('Vendor name is required.', 'institute-management-system'));
        }

        $table = "{$wpdb->prefix}ims_vendors";
        $inserted = $wpdb->insert($table, array(
            'name'     => $name,
            'phone'    => sanitize_text_field($params['phone'] ?? ''),
            'email'    => sanitize_email($params['email'] ?? ''),
            'address'  => sanitize_textarea_field($params['address'] ?? ''),
            'gstin'    => sanitize_text_field($params['gstin'] ?? ''),
            'category' => sanitize_text_field($params['category'] ?? 'Supplies'),
            'status'   => sanitize_text_field($params['status'] ?? 'active'),
        ));

        if (false === $inserted || !$wpdb->insert_id) {
            return $this->error_response('db_error', __('Failed to create vendor: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
        }

        return $this->success_response(array('id' => $wpdb->insert_id, 'message' => __('Vendor created successfully.', 'institute-management-system')));
    }

    public function update_vendor($request) {
        global $wpdb;
        $id = intval($request['id']);
        $params = $request->get_json_params();

        $table = "{$wpdb->prefix}ims_vendors";
        $wpdb->update($table, array(
            'name'     => sanitize_text_field($params['name']),
            'phone'    => sanitize_text_field($params['phone'] ?? ''),
            'email'    => sanitize_email($params['email'] ?? ''),
            'address'  => sanitize_textarea_field($params['address'] ?? ''),
            'gstin'    => sanitize_text_field($params['gstin'] ?? ''),
            'category' => sanitize_text_field($params['category'] ?? 'Supplies'),
            'status'   => sanitize_text_field($params['status'] ?? 'active'),
        ), array('id' => $id));

        return $this->success_response(array('message' => __('Vendor details updated.', 'institute-management-system')));
    }

    public function delete_vendor($request) {
        $id = intval($request['id']);
        IMS_DB::soft_delete('ims_vendors', $id);
        return $this->success_response(array('message' => __('Vendor deleted.', 'institute-management-system')));
    }

    public function get_vendor_expenses($request) {
        global $wpdb;
        $id         = intval($request['id']);
        $start_date = sanitize_text_field($request->get_param('start_date'));
        $end_date   = sanitize_text_field($request->get_param('end_date'));

        $v_table = "{$wpdb->prefix}ims_vendors";
        $e_table = "{$wpdb->prefix}ims_expenses";

        $vendor = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$v_table} WHERE id = %d AND deleted_at IS NULL", $id));
        if (!$vendor) {
            return $this->error_response('not_found', __('Vendor not found.', 'institute-management-system'), 404);
        }

        $where = "WHERE e.deleted_at IS NULL AND (e.vendor_id = %d OR (e.vendor_id IS NULL AND e.vendor_name = %s))";
        $params = array($id, $vendor->name);

        if (!empty($start_date)) {
            $where .= " AND e.expense_date >= %s";
            $params[] = $start_date;
        }
        if (!empty($end_date)) {
            $where .= " AND e.expense_date <= %s";
            $params[] = $end_date;
        }

        $sql = "SELECT e.* FROM {$e_table} e {$where} ORDER BY e.expense_date DESC";
        $expenses = $wpdb->get_results($wpdb->prepare($sql, $params));

        $total_paid = 0;
        foreach ($expenses as $e) {
            $e->amount = floatval($e->amount);
            $total_paid += $e->amount;
        }

        return $this->success_response(array(
            'vendor'     => $vendor,
            'total_paid' => $total_paid,
            'expenses'   => $expenses,
        ));
    }
}
