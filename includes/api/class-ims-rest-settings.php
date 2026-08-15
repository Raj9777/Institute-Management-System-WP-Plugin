<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Settings extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/settings', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_settings'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'update_settings'),
                'permission_callback' => array($this, 'check_settings_permission_write'),
            ),
        ));
    }

    public function check_settings_permission() {
        return $this->check_capability('ims_manage_settings');
    }

    public function check_settings_permission_write() {
        return $this->check_capability('ims_manage_settings', true);
    }

    public function get_settings() {
        $settings = get_option('ims_institute_settings', array());
        if (empty($settings['app_slug'])) {
            $settings['app_slug'] = 'institute-app';
        }
        if (empty($settings['weekly_off_day'])) {
            $settings['weekly_off_day'] = 'Sunday';
        }
        if (empty($settings['attendance_weights'])) {
            $settings['attendance_weights'] = array(
                'present'  => 1.0,
                'half_day' => 0.5,
                'late'     => 1.0,
                'leave'    => 1.0,
                'absent'   => 0.0,
                'holiday'  => 1.0,
            );
        }
        if (empty($settings['website'])) {
            $settings['website'] = 'www.institute.com';
        }
        if (!isset($settings['signature_url'])) {
            $settings['signature_url'] = '';
        }
        if (!isset($settings['receipt_terms'])) {
            $settings['receipt_terms'] = "* Cheques subject to realisation.\nThe receipt must be produced when demanded. Fee once paid are not refundable.";
        }
        if (!isset($settings['admission_terms'])) {
            $settings['admission_terms'] = "I have read and understood the code of conduct, and payment term / Installment plan mentioned above and agree to abide by them and also the terms and conditions Printed overleaf.";
        }
        if (class_exists('IMS_Frontend')) {
            $settings['app_url'] = IMS_Frontend::get_app_url();
        } else {
            $settings['app_url'] = home_url('/' . $settings['app_slug'] . '/');
        }
        return $this->success_response($settings);
    }

    public function update_settings($request) {
        $params = $request->get_json_params();
        $current = get_option('ims_institute_settings', array());

        $new_slug = isset($params['app_slug']) ? sanitize_title($params['app_slug']) : (isset($current['app_slug']) ? $current['app_slug'] : 'institute-app');
        if (empty($new_slug)) {
            $new_slug = 'institute-app';
        }

        $weights_input = isset($params['attendance_weights']) && is_array($params['attendance_weights']) ? $params['attendance_weights'] : (isset($current['attendance_weights']) ? $current['attendance_weights'] : array());
        $clean_weights = array(
            'present'  => isset($weights_input['present']) ? floatval($weights_input['present']) : 1.0,
            'half_day' => isset($weights_input['half_day']) ? floatval($weights_input['half_day']) : 0.5,
            'late'     => isset($weights_input['late']) ? floatval($weights_input['late']) : 1.0,
            'leave'    => isset($weights_input['leave']) ? floatval($weights_input['leave']) : 1.0,
            'absent'   => isset($weights_input['absent']) ? floatval($weights_input['absent']) : 0.0,
            'holiday'  => isset($weights_input['holiday']) ? floatval($weights_input['holiday']) : 1.0,
        );

        $updated = array(
            'institute_name'     => sanitize_text_field(isset($params['institute_name']) ? $params['institute_name'] : (isset($current['institute_name']) ? $current['institute_name'] : '')),
            'tagline'            => sanitize_text_field(isset($params['tagline']) ? $params['tagline'] : (isset($current['tagline']) ? $current['tagline'] : '')),
            'website'            => sanitize_text_field(isset($params['website']) ? $params['website'] : (isset($current['website']) ? $current['website'] : '')),
            'gstin'              => sanitize_text_field(isset($params['gstin']) ? $params['gstin'] : (isset($current['gstin']) ? $current['gstin'] : '')),
            'currency'           => sanitize_text_field(isset($params['currency']) ? $params['currency'] : 'INR'),
            'phone'              => sanitize_text_field(isset($params['phone']) ? $params['phone'] : (isset($current['phone']) ? $current['phone'] : '')),
            'email'              => sanitize_email(isset($params['email']) ? $params['email'] : (isset($current['email']) ? $current['email'] : '')),
            'address'            => sanitize_textarea_field(isset($params['address']) ? $params['address'] : (isset($current['address']) ? $current['address'] : '')),
            'logo_url'           => esc_url_raw(isset($params['logo_url']) ? $params['logo_url'] : (isset($current['logo_url']) ? $current['logo_url'] : '')),
            'signature_url'      => esc_url_raw(isset($params['signature_url']) ? $params['signature_url'] : (isset($current['signature_url']) ? $current['signature_url'] : '')),
            'invoice_prefix'     => sanitize_text_field(isset($params['invoice_prefix']) ? $params['invoice_prefix'] : 'INV'),
            'receipt_prefix'     => sanitize_text_field(isset($params['receipt_prefix']) ? $params['receipt_prefix'] : 'REC'),
            'voucher_prefix'     => sanitize_text_field(isset($params['voucher_prefix']) ? $params['voucher_prefix'] : 'VOU'),
            'student_prefix'     => sanitize_text_field(isset($params['student_prefix']) ? $params['student_prefix'] : 'STU'),
            'cgst_rate'          => floatval(isset($params['cgst_rate']) ? $params['cgst_rate'] : 9.00),
            'sgst_rate'          => floatval(isset($params['sgst_rate']) ? $params['sgst_rate'] : 9.00),
            'app_slug'           => $new_slug,
            'weekly_off_day'    => sanitize_text_field(isset($params['weekly_off_day']) ? $params['weekly_off_day'] : 'Sunday'),
            'receipt_terms'      => sanitize_textarea_field(isset($params['receipt_terms']) ? $params['receipt_terms'] : (isset($current['receipt_terms']) ? $current['receipt_terms'] : '')),
            'admission_terms'    => sanitize_textarea_field(isset($params['admission_terms']) ? $params['admission_terms'] : (isset($current['admission_terms']) ? $current['admission_terms'] : '')),
            'attendance_weights' => $clean_weights,
        );

        update_option('ims_institute_settings', $updated);

        if (class_exists('IMS_Frontend')) {
            IMS_Frontend::create_app_page($new_slug);
            flush_rewrite_rules();
            $updated['app_url'] = IMS_Frontend::get_app_url();
        } else {
            $updated['app_url'] = home_url('/' . $new_slug . '/');
        }

        return $this->success_response($updated);
    }
}
