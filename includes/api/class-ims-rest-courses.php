<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Courses extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/courses', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_courses'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_course'),
                'permission_callback' => array($this, 'check_academic_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/courses/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_course'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_course'),
                'permission_callback' => array($this, 'check_academic_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_course'),
                'permission_callback' => array($this, 'check_academic_permission_write'),
            ),
        ));
    }

    public function check_academic_permission_write() {
        return $this->check_capability('ims_manage_academic', true);
    }

    public function get_courses() {
        global $wpdb;
        $table = "{$wpdb->prefix}ims_courses";
        $results = $wpdb->get_results("SELECT * FROM {$table} WHERE deleted_at IS NULL ORDER BY name ASC");
        return $this->success_response($results);
    }

    public function get_course($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $table = "{$wpdb->prefix}ims_courses";
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$row) {
            return $this->error_response('not_found', __('Course not found.', 'institute-management-system'), 404);
        }
        return $this->success_response($row);
    }

    public function create_course($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $code = sanitize_text_field(isset($params['code']) ? $params['code'] : '');
        $name = sanitize_text_field(isset($params['name']) ? $params['name'] : '');
        $description = sanitize_textarea_field(isset($params['description']) ? $params['description'] : '');
        $fee_amount = floatval(isset($params['fee_amount']) ? $params['fee_amount'] : 0);
        $duration_months = intval(isset($params['duration_months']) ? $params['duration_months'] : 1);

        if (empty($code) || empty($name)) {
            return $this->error_response('missing_fields', __('Course code and name are required.', 'institute-management-system'));
        }

        $table = "{$wpdb->prefix}ims_courses";
        $inserted = $wpdb->insert($table, array(
            'code'            => $code,
            'name'            => $name,
            'description'     => $description,
            'fee_amount'      => $fee_amount,
            'duration_months' => $duration_months,
            'status'          => 'active',
        ));

        if (false === $inserted || !$wpdb->insert_id) {
            return $this->error_response('db_error', __('Failed to create course: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
        }

        return $this->success_response(array('id' => $wpdb->insert_id, 'message' => __('Course created.', 'institute-management-system')));
    }

    public function update_course($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $code = sanitize_text_field(isset($params['code']) ? $params['code'] : '');
        $name = sanitize_text_field(isset($params['name']) ? $params['name'] : '');
        $description = sanitize_textarea_field(isset($params['description']) ? $params['description'] : '');
        $fee_amount = floatval(isset($params['fee_amount']) ? $params['fee_amount'] : 0);
        $duration_months = intval(isset($params['duration_months']) ? $params['duration_months'] : 1);
        $status = sanitize_text_field(isset($params['status']) ? $params['status'] : 'active');

        $table = "{$wpdb->prefix}ims_courses";
        $data = array(
            'name'            => $name,
            'description'     => $description,
            'fee_amount'      => $fee_amount,
            'duration_months' => $duration_months,
            'status'          => $status,
        );
        if (!empty($code)) {
            $data['code'] = $code;
        }

        $updated = $wpdb->update($table, $data, array('id' => $id));

        if (false === $updated) {
            return $this->error_response('db_error', __('Failed to update course: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database update error'), 500);
        }

        return $this->success_response(array('message' => __('Course updated.', 'institute-management-system')));
    }

    public function delete_course($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_courses', $id);
        return $this->success_response(array('message' => __('Course deleted.', 'institute-management-system')));
    }
}
