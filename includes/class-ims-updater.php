<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Updater {

    const UPDATE_API_URL = 'https://license.example.com/api/v1/update-check';

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_filter('pre_set_site_transient_update_plugins', array($this, 'check_for_plugin_update'));
        add_filter('plugins_api', array($this, 'plugin_popup_info'), 20, 3);
    }

    public function check_for_plugin_update($transient) {
        if (!is_object($transient) || empty($transient->checked)) {
            return $transient;
        }

        $license_key = get_option('ims_license_key', '');
        $current_version = IMS_VERSION;
        $plugin_slug = plugin_basename(IMS_PLUGIN_FILE); // institute-management-system/institute-management-system.php

        $body = array(
            'license_key'    => $license_key,
            'plugin_version' => $current_version,
            'site_url'       => get_site_url(),
            'wp_version'     => get_bloginfo('version'),
        );

        $response = wp_remote_post(self::UPDATE_API_URL, array(
            'timeout' => 10,
            'body'    => json_encode($body),
            'headers' => array('Content-Type' => 'application/json'),
        ));

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return $transient;
        }

        $data = json_decode(wp_remote_retrieve_body($response));

        if (!empty($data->new_version) && version_compare($current_version, $data->new_version, '<')) {
            $obj = new stdClass();
            $obj->slug        = 'institute-management-system';
            $obj->plugin      = $plugin_slug;
            $obj->new_version = $data->new_version;
            $obj->url         = isset($data->url) ? $data->url : 'https://example.com';
            $obj->package     = isset($data->package) ? $data->package : '';
            $obj->icons       = array('default' => IMS_PLUGIN_URL . 'assets/dist/icon.png');
            $obj->banners     = array('default' => IMS_PLUGIN_URL . 'assets/dist/banner.png');

            $transient->response[$plugin_slug] = $obj;
        }

        return $transient;
    }

    public function plugin_popup_info($result, $action, $args) {
        if ($action !== 'plugin_information') {
            return $result;
        }

        if (!isset($args->slug) || $args->slug !== 'institute-management-system') {
            return $result;
        }

        $license_key = get_option('ims_license_key', '');
        $body = array(
            'license_key'    => $license_key,
            'plugin_version' => IMS_VERSION,
            'site_url'       => get_site_url(),
        );

        $response = wp_remote_post(self::UPDATE_API_URL, array(
            'timeout' => 10,
            'body'    => json_encode($body),
            'headers' => array('Content-Type' => 'application/json'),
        ));

        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            return $result;
        }

        $data = json_decode(wp_remote_retrieve_body($response));

        $res = new stdClass();
        $res->name           = 'Institute Management System';
        $res->slug           = 'institute-management-system';
        $res->version        = isset($data->new_version) ? $data->new_version : IMS_VERSION;
        $res->author         = '<a href="https://example.com">Pixe</a>';
        $res->homepage       = 'https://example.com';
        $res->download_link  = isset($data->package) ? $data->package : '';
        $res->sections       = array(
            'description' => 'Commercial Institute Management System for educational institutes in India.',
            'changelog'   => isset($data->changelog) ? $data->changelog : 'Bug fixes and performance improvements.',
        );

        return $res;
    }
}
