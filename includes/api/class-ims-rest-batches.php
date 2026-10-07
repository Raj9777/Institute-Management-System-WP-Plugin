<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Batches extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/batches', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_batches'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_batch'),
                'permission_callback' => array($this, 'check_academic_permission_write'),
            ),
        ));

        register_rest_route($this->namespace, '/batches/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_batch'),
                'permission_callback' => function() { return is_user_logged_in(); },
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_batch'),
                'permission_callback' => array($this, 'check_academic_permission_write'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_batch'),
                'permission_callback' => array($this, 'check_academic_permission_write'),
            ),
        ));
    }

    public function check_academic_permission_write() {
        return $this->check_capability('ims_manage_academic', true);
    }

    public function get_batches() {
        global $wpdb;
        $batches_table = "{$wpdb->prefix}ims_batches";
        $courses_table = "{$wpdb->prefix}ims_courses";
        $staff_table   = "{$wpdb->prefix}ims_staff";

        $sql = "
SELECT b.*, c.name AS course_name, CONCAT(s.first_name, ' ', s.last_name) AS teacher_name,
       (SELECT COUNT(st.id) FROM {$wpdb->prefix}ims_students st WHERE st.batch_id = b.id AND st.deleted_at IS NULL) AS enrolled_count
FROM {$batches_table} b
LEFT JOIN {$courses_table} c ON b.course_id = c.id
LEFT JOIN {$staff_table} s ON b.teacher_id = s.id
WHERE b.deleted_at IS NULL
ORDER BY b.created_at DESC
        ";

        $results = $wpdb->get_results($sql);
        return $this->success_response($results);
    }

    public function get_batch($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $table = "{$wpdb->prefix}ims_batches";
        $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$row) {
            return $this->error_response('not_found', __('Batch not found.', 'institute-management-system'), 404);
        }
        return $this->success_response($row);
    }

    public function create_batch($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $course_id = intval(isset($params['course_id']) ? $params['course_id'] : 0);
        $name = sanitize_text_field(isset($params['name']) ? $params['name'] : '');
        $capacity = intval(isset($params['capacity']) ? $params['capacity'] : 30);
        $teacher_id = !empty($params['teacher_id']) ? intval($params['teacher_id']) : null;
        $start_date = !empty($params['start_date']) ? sanitize_text_field($params['start_date']) : null;
        $end_date = !empty($params['end_date']) ? sanitize_text_field($params['end_date']) : null;
        $timing = sanitize_text_field(isset($params['timing']) ? $params['timing'] : '');

        if (empty($name)) {
            return $this->error_response('missing_fields', __('Batch Name is required.', 'institute-management-system'));
        }

        $table = "{$wpdb->prefix}ims_batches";
        $inserted = $wpdb->insert($table, array(
            'course_id'  => $course_id ?: 0,
            'name'       => $name,
            'capacity'   => $capacity,
            'teacher_id' => $teacher_id,
            'start_date' => $start_date,
            'end_date'   => $end_date,
            'timing'     => $timing,
            'status'     => 'active',
        ));

        if (false === $inserted || !$wpdb->insert_id) {
            return $this->error_response('db_error', __('Failed to create batch: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
        }

        return $this->success_response(array('id' => $wpdb->insert_id, 'message' => __('Batch created successfully.', 'institute-management-system')));
    }

    public function update_batch($request) {
        global $wpdb;
        $id = (int) $request['id'];
        $params = $request->get_json_params();

        $table = "{$wpdb->prefix}ims_batches";
        $updated = $wpdb->update($table, array(
            'course_id'  => intval(isset($params['course_id']) ? $params['course_id'] : 0),
            'name'       => sanitize_text_field(isset($params['name']) ? $params['name'] : ''),
            'capacity'   => intval(isset($params['capacity']) ? $params['capacity'] : 30),
            'teacher_id' => !empty($params['teacher_id']) ? intval($params['teacher_id']) : null,
            'start_date' => !empty($params['start_date']) ? sanitize_text_field($params['start_date']) : null,
            'end_date'   => !empty($params['end_date']) ? sanitize_text_field($params['end_date']) : null,
            'timing'     => sanitize_text_field(isset($params['timing']) ? $params['timing'] : ''),
            'status'     => sanitize_text_field(isset($params['status']) ? $params['status'] : 'active'),
        ), array('id' => $id));

        if (false === $updated) {
            return $this->error_response('db_error', __('Failed to update batch: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database update error'), 500);
        }

        return $this->success_response(array('message' => __('Batch updated successfully.', 'institute-management-system')));
    }

    public function delete_batch($request) {
        $id = (int) $request['id'];
        IMS_DB::soft_delete('ims_batches', $id);
        return $this->success_response(array('message' => __('Batch deleted.', 'institute-management-system')));
    }
}
