<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_REST_Upload extends IMS_REST_Base {

    public function register_routes() {
        register_rest_route($this->namespace, '/upload', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'handle_upload'),
            'permission_callback' => function() { return is_user_logged_in(); },
        ));
    }

    public function handle_upload($request) {
        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        // Check if file is uploaded via multipart $_FILES
        $files = $request->get_file_params();
        if (!empty($files['file'])) {
            $uploadedfile = $files['file'];
            $upload_overrides = array(
                'test_form' => false,
                'mimes'     => array(
                    'jpg|jpeg|jpe' => 'image/jpeg',
                    'gif'          => 'image/gif',
                    'png'          => 'image/png',
                    'webp'         => 'image/webp',
                    'pdf'          => 'application/pdf',
                ),
            );

            $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

            if ($movefile && !isset($movefile['error'])) {
                return $this->success_response(array(
                    'url'  => $movefile['url'],
                    'file' => $movefile['file'],
                    'type' => $movefile['type'],
                ));
            } else {
                $err_msg = isset($movefile['error']) ? $movefile['error'] : __('Upload failed.', 'institute-management-system');
                return $this->error_response('upload_error', $err_msg, 400);
            }
        }

        // Check for base64 image data payload
        $params = $request->get_json_params();
        if (!empty($params['image_base64'])) {
            $base64_data = $params['image_base64'];
            if (preg_match('/^data:image\/(\w+);base64,/', $base64_data, $type)) {
                $base64_data = substr($base64_data, strpos($base64_data, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, gif, webp

                if (!in_array($type, array('jpg', 'jpeg', 'gif', 'png', 'webp'), true)) {
                    return $this->error_response('invalid_type', __('Invalid image type.', 'institute-management-system'), 400);
                }

                $decoded = base64_decode($base64_data);
                if ($decoded === false) {
                    return $this->error_response('base64_decode_failed', __('Failed to decode image data.', 'institute-management-system'), 400);
                }

                $upload_dir  = wp_upload_dir();
                $filename    = 'ims_photo_' . time() . '_' . wp_generate_password(6, false) . '.' . $type;
                $file_path   = $upload_dir['path'] . '/' . $filename;

                if (wp_mkdir_p($upload_dir['path'])) {
                    file_put_contents($file_path, $decoded);
                    $file_url = $upload_dir['url'] . '/' . $filename;

                    return $this->success_response(array(
                        'url'  => $file_url,
                        'file' => $file_path,
                        'type' => 'image/' . $type,
                    ));
                }
            }
        }

        return $this->error_response('no_file_provided', __('No file or image data provided in upload request.', 'institute-management-system'), 400);
    }
}
