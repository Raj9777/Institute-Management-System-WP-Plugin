<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Staff extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/staff', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_staff_list'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_staff'),
                'permission_callback' => array($this, 'check_staff_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/staff/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_staff_member'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_staff'),
                'permission_callback' => array($this, 'check_staff_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_staff'),
                'permission_callback' => array($this, 'check_staff_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/staff/(?P<id>\d+)/full-profile', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_staff_full_profile'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
        ));

        register_rest_route($this->namespace, '/staff/(?P<id>\d+)/reveal-bank-details', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'reveal_bank_details'),
                'permission_callback' => function() { return current_user_can('ims_view_staff_sensitive') || current_user_can('administrator'); },
            ),
        ));
    }

    public function check_staff_permission_write() {
        return $this->check_capability('ims_manage_settings', true);
    }

    private function can_view_sensitive() {
        return current_user_can('ims_view_staff_sensitive') || current_user_can('administrator');
    }

    /**
     * Encryption Helpers (AES-256-CBC)
     */
    public static function get_encryption_key() {
        if (defined('IMS_ENCRYPTION_KEY') && !empty(IMS_ENCRYPTION_KEY)) {
            return hash('sha256', IMS_ENCRYPTION_KEY, true);
        }
        $salt = defined('AUTH_KEY') ? AUTH_KEY : (defined('SECURE_AUTH_KEY') ? SECURE_AUTH_KEY : wp_salt());
        return hash('sha256', 'ims_secret_' . $salt, true);
    }

    public static function encrypt_sensitive($text) {
        if (empty($text)) return '';
        $key = self::get_encryption_key();
        $iv = openssl_random_pseudo_bytes(16);
        $encrypted = openssl_encrypt($text, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }

    public static function decrypt_sensitive($cipher_text) {
        if (empty($cipher_text)) return '';
        $raw = base64_decode($cipher_text, true);
        if (!$raw || strlen($raw) <= 16) {
            return $cipher_text; // Return unencrypted legacy value if applicable
        }
        $iv = substr($raw, 0, 16);
        $cipher = substr($raw, 16);
        $key = self::get_encryption_key();
        $decrypted = openssl_decrypt($cipher, 'AES-256-CBC', $key, 0, $iv);
        return $decrypted !== false ? $decrypted : $cipher_text;
    }

    private function mask_value($str, $keep_last = 4) {
        if (empty($str)) return '';
        $len = strlen($str);
        if ($len <= $keep_last) {
            return str_repeat('•', $len);
        }
        return str_repeat('•', max(4, $len - $keep_last)) . ' ' . substr($str, -$keep_last);
    }

    /**
     * Requirement 7: Bulk Staff List MUST NEVER contain bank_details at all for any role!
     */
    public function get_staff_list() {
        global $wpdb;
        $table = "{$wpdb->prefix}ims_staff";
        $results = $wpdb->get_results("SELECT * FROM {$table} WHERE deleted_at IS NULL ORDER BY first_name ASC");

        $can_payroll = current_user_can('ims_view_payroll') || current_user_can('administrator');

        foreach ($results as &$staff) {
            if (!$can_payroll) {
                unset($staff->base_salary);
            }
            // Strictly exclude bank_details from bulk list for ALL roles
            unset($staff->bank_details);
        }

        return $this->success_response($results);
    }

    public function get_staff_member($request) {
        global $wpdb;
        $id      = (int) $request['id'];
        $table   = "{$wpdb->prefix}ims_staff";
        $b_table = "{$wpdb->prefix}ims_staff_bank_details";

        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$row) {
            return $this->error_response('not_found', __('Staff member not found.', 'institute-management-system'), 404);
        }

        if (!current_user_can('ims_view_payroll') && !current_user_can('administrator')) {
            unset($row->base_salary);
        }

        if ($this->can_view_sensitive()) {
            $bank = $wpdb->get_row($wpdb->prepare("SELECT account_holder_name, bank_name, account_number, ifsc_code, branch, upi_id FROM {$b_table} WHERE staff_id = %d", $row->id));
            if ($bank) {
                $raw_acc  = self::decrypt_sensitive($bank->account_number);
                $raw_ifsc = self::decrypt_sensitive($bank->ifsc_code);

                $row->bank_details = array(
                    'account_holder_name' => $bank->account_holder_name,
                    'bank_name'           => $bank->bank_name,
                    'account_number'      => $this->mask_value($raw_acc),
                    'ifsc_code'           => $this->mask_value($raw_ifsc),
                    'branch'              => $bank->branch,
                    'upi_id'              => $bank->upi_id,
                    'is_masked'           => true,
                );
            } else {
                $row->bank_details = null;
            }
        }

        $response = $this->success_response($row);
        if ($this->can_view_sensitive()) {
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
        return $response;
    }

    public function reveal_bank_details($request) {
        global $wpdb;
        $id      = (int) $request['id'];
        $table   = "{$wpdb->prefix}ims_staff";
        $b_table = "{$wpdb->prefix}ims_staff_bank_details";

        $staff = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));
        if (!$staff) {
            return $this->error_response('not_found', __('Staff member not found.', 'institute-management-system'), 404);
        }

        $bank = $wpdb->get_row($wpdb->prepare("SELECT account_holder_name, bank_name, account_number, ifsc_code, branch, upi_id FROM {$b_table} WHERE staff_id = %d", $id));
        if (!$bank) {
            return $this->error_response('not_found', __('Bank details record not found for staff.', 'institute-management-system'), 404);
        }

        $raw_acc  = self::decrypt_sensitive($bank->account_number);
        $raw_ifsc = self::decrypt_sensitive($bank->ifsc_code);

        // Audit Log Every Reveal (Requirement 4)
        require_once IMS_PLUGIN_DIR . 'includes/class-ims-audit.php';
        IMS_Audit::log(
            'reveal_staff_bank_details',
            get_current_user_id(),
            sprintf(__('Revealed sensitive bank details for staff member %s %s (%s)', 'institute-management-system'), $staff->first_name, $staff->last_name, $staff->staff_code),
            $id
        );

        $res_data = array(
            'account_holder_name' => $bank->account_holder_name,
            'bank_name'           => $bank->bank_name,
            'account_number'      => $raw_acc,
            'ifsc_code'           => $raw_ifsc,
            'branch'              => $bank->branch,
            'upi_id'              => $bank->upi_id,
            'is_masked'           => false,
        );

        $response = $this->success_response($res_data);
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        return $response;
    }

    public function create_staff($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $first_name = sanitize_text_field(isset($params['first_name']) ? $params['first_name'] : '');
        $last_name  = sanitize_text_field(isset($params['last_name']) ? $params['last_name'] : '');
        $role_key   = sanitize_text_field(isset($params['role_key']) ? $params['role_key'] : 'ims_teacher');

        if (empty($first_name) || empty($last_name)) {
            return $this->error_response('missing_fields', __('First and Last Name are required.', 'institute-management-system'));
        }

        $staff_code = IMS_DB::get_next_sequence('staff_code');

        $table = "{$wpdb->prefix}ims_staff";
        $wpdb->insert($table, array(
            'staff_code'   => $staff_code,
            'wp_user_id'   => !empty($params['wp_user_id']) ? intval($params['wp_user_id']) : null,
            'first_name'   => $first_name,
            'last_name'    => $last_name,
            'role_key'     => $role_key,
            'phone'        => sanitize_text_field(isset($params['phone']) ? $params['phone'] : ''),
            'email'        => sanitize_email(isset($params['email']) ? $params['email'] : ''),
            'address'      => sanitize_textarea_field(isset($params['address']) ? $params['address'] : ''),
            'designation'  => sanitize_text_field(isset($params['designation']) ? $params['designation'] : ''),
            'base_salary'  => floatval(isset($params['base_salary']) ? $params['base_salary'] : 0),
            'joining_date' => !empty($params['joining_date']) ? sanitize_text_field($params['joining_date']) : null,
            'photo_url'    => esc_url_raw(isset($params['photo_url']) ? $params['photo_url'] : ''),
            'status'       => 'active',
        ));

        $staff_id = $wpdb->insert_id;

        if ($this->can_view_sensitive() && !empty($params['bank_details'])) {
            $this->save_bank_details($staff_id, $params['bank_details']);
        }

        return $this->success_response(array('id' => $staff_id, 'staff_code' => $staff_code, 'message' => __('Staff record created.', 'institute-management-system')));
    }

    public function update_staff($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $table = "{$wpdb->prefix}ims_staff";
        $wpdb->update($table, array(
            'first_name'   => sanitize_text_field($params['first_name']),
            'last_name'    => sanitize_text_field($params['last_name']),
            'role_key'     => sanitize_text_field($params['role_key']),
            'phone'        => sanitize_text_field($params['phone']),
            'email'        => sanitize_email($params['email']),
            'address'      => sanitize_textarea_field(isset($params['address']) ? $params['address'] : ''),
            'designation'  => sanitize_text_field($params['designation']),
            'base_salary'  => floatval($params['base_salary']),
            'joining_date' => !empty($params['joining_date']) ? sanitize_text_field($params['joining_date']) : null,
            'photo_url'    => esc_url_raw(isset($params['photo_url']) ? $params['photo_url'] : ''),
            'status'       => isset($params['status']) ? sanitize_text_field($params['status']) : 'active',
        ), array('id' => $id));

        if ($this->can_view_sensitive() && isset($params['bank_details'])) {
            $this->save_bank_details($id, $params['bank_details']);
        }

        return $this->success_response(array('message' => __('Staff details updated.', 'institute-management-system')));
    }

    private function save_bank_details($staff_id, $bank_params) {
        global $wpdb;
        $b_table = "{$wpdb->prefix}ims_staff_bank_details";

        $raw_acc  = sanitize_text_field($bank_params['account_number'] ?? '');
        $raw_ifsc = sanitize_text_field($bank_params['ifsc_code'] ?? '');

        // Encrypt at Rest (Requirement 5), preserving existing cipher text if masked value is submitted unchanged
        if (!empty($raw_acc) && strpos($raw_acc, '•') !== false) {
            $existing_acc = $wpdb->get_var($wpdb->prepare("SELECT account_number FROM {$b_table} WHERE staff_id = %d", $staff_id));
            $enc_acc = !empty($existing_acc) ? $existing_acc : self::encrypt_sensitive($raw_acc);
        } else {
            $enc_acc = self::encrypt_sensitive($raw_acc);
        }

        if (!empty($raw_ifsc) && strpos($raw_ifsc, '•') !== false) {
            $existing_ifsc = $wpdb->get_var($wpdb->prepare("SELECT ifsc_code FROM {$b_table} WHERE staff_id = %d", $staff_id));
            $enc_ifsc = !empty($existing_ifsc) ? $existing_ifsc : self::encrypt_sensitive($raw_ifsc);
        } else {
            $enc_ifsc = self::encrypt_sensitive($raw_ifsc);
        }

        $bank_data = array(
            'staff_id'            => $staff_id,
            'account_holder_name' => sanitize_text_field($bank_params['account_holder_name'] ?? ''),
            'bank_name'           => sanitize_text_field($bank_params['bank_name'] ?? ''),
            'account_number'      => $enc_acc,
            'ifsc_code'           => $enc_ifsc,
            'branch'              => sanitize_text_field($bank_params['branch'] ?? ''),
            'upi_id'              => sanitize_text_field($bank_params['upi_id'] ?? ''),
        );

        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$b_table} WHERE staff_id = %d", $staff_id));
        if ($exists) {
            $wpdb->update($b_table, $bank_data, array('staff_id' => $staff_id));
        } else {
            $wpdb->insert($b_table, $bank_data);
        }
    }

    public function delete_staff($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_staff', $id);
        return $this->success_response(array('message' => __('Staff member deleted.', 'institute-management-system')));
    }

    public function get_staff_full_profile($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $staff_res = $this->get_staff_member($request);
        $staff_data = $staff_res->get_data();

        if (!$staff_data['ok']) {
            return $staff_res;
        }

        $staff = $staff_data['data'];

        // Fetch Attendance Summary (last 60 days)
        $att_table = "{$wpdb->prefix}ims_attendance";
        $attendance = $wpdb->get_results($wpdb->prepare("
            SELECT date, status
            FROM {$att_table}
            WHERE person_type = 'staff' AND person_id = %d AND deleted_at IS NULL
            ORDER BY date DESC LIMIT 60
        ", $id));

        // Fetch Payroll History
        $pr_table = "{$wpdb->prefix}ims_payroll_runs";
        $payroll_runs = $wpdb->get_results($wpdb->prepare("
            SELECT * FROM {$pr_table}
            WHERE staff_id = %d AND deleted_at IS NULL
            ORDER BY year DESC, month DESC
        ", $id));

        foreach ($payroll_runs as $r) {
            $r->per_day_rate = floatval($r->per_day_rate);
            $r->weighted_present_days = floatval($r->weighted_present_days);
            $r->calculated_amount = floatval($r->calculated_amount);
            $r->manual_adjustment = floatval($r->manual_adjustment);
            $r->net_payable = floatval($r->net_payable);
        }

        $response = $this->success_response(array(
            'staff'        => $staff,
            'attendance'   => $attendance,
            'payroll_runs' => $payroll_runs,
        ));

        if ($this->can_view_sensitive()) {
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        }

        return $response;
    }
}
