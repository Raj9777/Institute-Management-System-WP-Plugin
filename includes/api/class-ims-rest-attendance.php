<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Attendance extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/attendance', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_attendance'),
                'permission_callback' => array($this, 'check_attendance_view_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'bulk_save_attendance'),
                'permission_callback' => array($this, 'check_attendance_mark_permission'),
            ),
        ));
    }

    public function check_attendance_view_permission() {
        return $this->check_capability('ims_view_attendance');
    }

    public function check_attendance_mark_permission() {
        return $this->check_capability('ims_mark_attendance', true);
    }

    public function get_attendance($request) {
        global $wpdb;
        $table = "{$wpdb->prefix}ims_attendance";

        $date        = sanitize_text_field($request->get_param('date'));
        $entity_type = sanitize_text_field($request->get_param('entity_type')); // 'student' or 'staff'
        $batch_id    = intval($request->get_param('batch_id'));

        if (empty($date) || empty($entity_type)) {
            return $this->error_response('missing_params', __('Date and Entity Type are required.', 'institute-management-system'));
        }

        $where = "WHERE attendance_date = %s AND entity_type = %s AND deleted_at IS NULL";
        $params = array($date, $entity_type);

        if (!empty($batch_id)) {
            $where .= " AND batch_id = %d";
            $params[] = $batch_id;
        }

        $sql = $wpdb->prepare("SELECT * FROM {$table} {$where}", $params);
        $results = $wpdb->get_results($sql);

        return $this->success_response($results);
    }

    public function bulk_save_attendance($request) {
        global $wpdb;
        $params      = $request->get_json_params();
        $date        = sanitize_text_field(isset($params['date']) ? $params['date'] : '');
        $entity_type = sanitize_text_field(isset($params['entity_type']) ? $params['entity_type'] : '');
        $batch_id    = !empty($params['batch_id']) ? intval($params['batch_id']) : null;
        $records     = isset($params['records']) ? (array) $params['records'] : array();

        if (empty($date) || empty($entity_type) || empty($records)) {
            return $this->error_response('invalid_payload', __('Date, Entity Type, and Records list are required.', 'institute-management-system'));
        }

        $table     = "{$wpdb->prefix}ims_attendance";
        $marked_by = get_current_user_id();

        $valid_statuses = array('present', 'absent', 'late', 'half_day', 'leave', 'holiday');

        foreach ($records as $rec) {
            $entity_id = intval($rec['entity_id']);
            $status    = sanitize_text_field($rec['status']);
            $remarks   = sanitize_text_field(isset($rec['remarks']) ? $rec['remarks'] : '');

            if (!in_array($status, $valid_statuses, true)) {
                continue;
            }

            // UPSERT logic: check if existing record for entity, date, batch
            $existing_id = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM {$table} WHERE entity_type = %s AND entity_id = %d AND attendance_date = %s AND deleted_at IS NULL",
                $entity_type,
                $entity_id,
                $date
            ));

            if ($existing_id) {
                $wpdb->update($table, array(
                    'status'    => $status,
                    'remarks'   => $remarks,
                    'marked_by' => $marked_by,
                ), array('id' => $existing_id));
            } else {
                $wpdb->insert($table, array(
                    'entity_type'     => $entity_type,
                    'entity_id'       => $entity_id,
                    'batch_id'        => $batch_id,
                    'attendance_date' => $date,
                    'status'          => $status,
                    'remarks'         => $remarks,
                    'marked_by'       => $marked_by,
                ));
            }
        }

        return $this->success_response(array('message' => __('Attendance recorded successfully.', 'institute-management-system')));
    }
}
