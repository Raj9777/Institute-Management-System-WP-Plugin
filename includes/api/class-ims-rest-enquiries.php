<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Enquiries extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/enquiries', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_enquiries'),
                'permission_callback' => array($this, 'check_student_permission'),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'create_enquiry'),
                'permission_callback' => array($this, 'check_student_permission'),
            ),
        ));

        register_rest_route($this->namespace, '/enquiries/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_enquiry'),
                'permission_callback' => array($this, 'check_student_permission'),
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_enquiry'),
                'permission_callback' => array($this, 'check_student_permission'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_enquiry'),
                'permission_callback' => array($this, 'check_student_permission'),
            ),
        ));

        register_rest_route($this->namespace, '/enquiries/(?P<id>\d+)/notes', array(
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'add_enquiry_note'),
                'permission_callback' => array($this, 'check_student_permission'),
            ),
        ));
    }

    public function check_student_permission() {
        return is_user_logged_in() && (current_user_can('ims_manage_students') || current_user_can('administrator'));
    }

    public function get_enquiries($request) {
        global $wpdb;
        $status          = sanitize_text_field($request->get_param('status'));
        $follow_up_date  = sanitize_text_field($request->get_param('follow_up_date')); // 'today', 'overdue', 'all'
        $search          = sanitize_text_field($request->get_param('search'));

        $where = "WHERE e.deleted_at IS NULL";
        $params = array();

        if (!empty($status) && $status !== 'all') {
            $where .= " AND e.status = %s";
            $params[] = $status;
        }

        if ($follow_up_date === 'today') {
            $where .= " AND e.next_follow_up_date = %s";
            $params[] = date('Y-m-d');
        } elseif ($follow_up_date === 'overdue') {
            $where .= " AND e.next_follow_up_date <= %s AND e.status IN ('New', 'Follow-up')";
            $params[] = date('Y-m-d');
        }

        if (!empty($search)) {
            $where .= " AND (e.name LIKE %s OR e.phone LIKE %s OR e.email LIKE %s)";
            $s_like = '%' . $wpdb->esc_like($search) . '%';
            $params[] = $s_like;
            $params[] = $s_like;
            $params[] = $s_like;
        }

        $sql = "
            SELECT e.*, c.name AS course_name,
                   u.display_name AS created_by_name,
                   s.roll_no AS converted_student_roll_no
            FROM {$wpdb->prefix}ims_enquiries e
            LEFT JOIN {$wpdb->prefix}ims_courses c ON e.course_id = c.id
            LEFT JOIN {$wpdb->users} u ON e.created_by_user_id = u.ID
            LEFT JOIN {$wpdb->prefix}ims_students s ON e.converted_student_id = s.id
            {$where}
            ORDER BY e.created_at DESC
        ";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $records = $wpdb->get_results($sql);
        foreach ($records as $r) {
            $r->notes = json_decode($r->notes) ?: array();
        }

        return $this->success_response($records);
    }

    public function get_enquiry($request) {
        global $wpdb;
        $id = intval($request['id']);
        $sql = $wpdb->prepare("
            SELECT e.*, c.name AS course_name, u.display_name AS created_by_name
            FROM {$wpdb->prefix}ims_enquiries e
            LEFT JOIN {$wpdb->prefix}ims_courses c ON e.course_id = c.id
            LEFT JOIN {$wpdb->users} u ON e.created_by_user_id = u.ID
            WHERE e.id = %d AND e.deleted_at IS NULL
        ", $id);
        $record = $wpdb->get_row($sql);

        if (!$record) {
            return $this->error_response('not_found', __('Enquiry not found.', 'institute-management-system'), 404);
        }

        $record->notes = json_decode($record->notes) ?: array();
        return $this->success_response($record);
    }

    public function create_enquiry($request) {
        global $wpdb;
        $params = $request->get_json_params();

        $name               = sanitize_text_field($params['name'] ?? '');
        $phone              = sanitize_text_field($params['phone'] ?? '');
        $email              = sanitize_email($params['email'] ?? '');
        $course_id          = !empty($params['course_id']) ? intval($params['course_id']) : null;
        $source             = sanitize_text_field($params['source'] ?? 'Walk-in');
        $status             = sanitize_text_field($params['status'] ?? 'New');
        $next_follow_up_date = !empty($params['next_follow_up_date']) ? sanitize_text_field($params['next_follow_up_date']) : null;
        $initial_note       = sanitize_text_field($params['initial_note'] ?? '');

        if (empty($name) || empty($phone)) {
            return $this->error_response('missing_fields', __('Name and Phone number are required.', 'institute-management-system'));
        }

        $notes_array = array();
        if (!empty($initial_note)) {
            $notes_array[] = array(
                'date'   => date('Y-m-d H:i:s'),
                'author' => wp_get_current_user()->display_name ?: 'Staff',
                'text'   => $initial_note,
            );
        }

        $table = "{$wpdb->prefix}ims_enquiries";
        $inserted = $wpdb->insert($table, array(
            'name'                => $name,
            'phone'               => $phone,
            'email'               => $email,
            'course_id'           => $course_id,
            'source'              => $source,
            'status'              => $status,
            'notes'               => json_encode($notes_array),
            'next_follow_up_date' => $next_follow_up_date,
            'created_by_user_id'  => get_current_user_id(),
        ));

        if (false === $inserted || !$wpdb->insert_id) {
            return $this->error_response('db_error', __('Failed to create student enquiry: ', 'institute-management-system') . ($wpdb->last_error ?: 'Database insert error'), 500);
        }

        $id = $wpdb->insert_id;
        return $this->success_response(array('id' => $id, 'message' => __('Student Enquiry registered successfully.', 'institute-management-system')));
    }

    public function update_enquiry($request) {
        global $wpdb;
        $id     = intval($request['id']);
        $params = $request->get_json_params();

        $table = "{$wpdb->prefix}ims_enquiries";
        $orig  = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$orig) {
            return $this->error_response('not_found', __('Enquiry record not found.', 'institute-management-system'), 404);
        }

        $data = array();
        if (isset($params['name'])) $data['name'] = sanitize_text_field($params['name']);
        if (isset($params['phone'])) $data['phone'] = sanitize_text_field($params['phone']);
        if (isset($params['email'])) $data['email'] = sanitize_email($params['email']);
        if (array_key_exists('course_id', $params)) $data['course_id'] = !empty($params['course_id']) ? intval($params['course_id']) : null;
        if (isset($params['source'])) $data['source'] = sanitize_text_field($params['source']);
        if (isset($params['status'])) $data['status'] = sanitize_text_field($params['status']);
        if (array_key_exists('next_follow_up_date', $params)) $data['next_follow_up_date'] = !empty($params['next_follow_up_date']) ? sanitize_text_field($params['next_follow_up_date']) : null;
        if (array_key_exists('converted_student_id', $params)) $data['converted_student_id'] = !empty($params['converted_student_id']) ? intval($params['converted_student_id']) : null;

        if (!empty($data)) {
            $wpdb->update($table, $data, array('id' => $id));
        }

        return $this->success_response(array('message' => __('Enquiry updated successfully.', 'institute-management-system')));
    }

    public function add_enquiry_note($request) {
        global $wpdb;
        $id     = intval($request['id']);
        $params = $request->get_json_params();

        $text   = sanitize_text_field($params['text'] ?? '');
        $status = sanitize_text_field($params['status'] ?? '');
        $next_date = sanitize_text_field($params['next_follow_up_date'] ?? '');

        if (empty($text)) {
            return $this->error_response('missing_fields', __('Follow-up note text is required.', 'institute-management-system'));
        }

        $table = "{$wpdb->prefix}ims_enquiries";
        $orig  = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id = %d AND deleted_at IS NULL", $id));

        if (!$orig) {
            return $this->error_response('not_found', __('Enquiry record not found.', 'institute-management-system'), 404);
        }

        $notes_array = json_decode($orig->notes, true) ?: array();
        $notes_array[] = array(
            'date'   => date('Y-m-d H:i:s'),
            'author' => wp_get_current_user()->display_name ?: 'Staff',
            'text'   => $text,
        );

        $update_data = array('notes' => json_encode($notes_array));
        if (!empty($status)) {
            $update_data['status'] = $status;
        }
        if (!empty($next_date)) {
            $update_data['next_follow_up_date'] = $next_date;
        }

        $wpdb->update($table, $update_data, array('id' => $id));
        return $this->success_response(array('message' => __('Follow-up note logged successfully.', 'institute-management-system')));
    }

    public function delete_enquiry($request) {
        $id = intval($request['id']);
        IMS_DB::soft_delete('ims_enquiries', $id);
        return $this->success_response(array('message' => __('Enquiry record soft deleted.', 'institute-management-system')));
    }
}
