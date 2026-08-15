<?php
/**
 * PHPUnit Bootstrap for IMS Plugin Tests
 */

$_tests_dir = getenv('WP_TESTS_DIR');
if (!$_tests_dir) {
    $_tests_dir = rtrim(sys_get_temp_dir(), '/\\') . '/wordpress-tests-lib';
}

if (file_exists($_tests_dir . '/includes/functions.php')) {
    require_once $_tests_dir . '/includes/functions.php';

    function _manually_load_plugin() {
        require dirname(__DIR__) . '/institute-management-system.php';
    }
    tests_add_filter('muplugins_loaded', '_manually_load_plugin');

    require $_tests_dir . '/includes/bootstrap.php';
} else {
    // Standalone fallback mock for test environment
    require_once dirname(__DIR__) . '/institute-management-system.php';
}
