<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Base DB Access Class
 * All IMS model classes extend this base class so every SQL execution,
 * preparation, and transaction goes through a single audited point.
 */
abstract class IMS_DB_Base {

    public static function get_table_name($table_suffix) {
        global $wpdb;
        $suffix = ltrim($table_suffix, '_');
        if (strpos($suffix, 'ims_') === 0) {
            $suffix = substr($suffix, 4);
        }
        return $wpdb->prefix . 'ims_' . $suffix;
    }

    /**
     * Standard prepared query execution
     */
    public static function query($query, ...$args) {
        global $wpdb;
        if (!empty($args)) {
            if (count($args) === 1 && is_array($args[0])) {
                $args = $args[0];
            }
            $query = $wpdb->prepare($query, ...$args);
        }
        return $wpdb->query($query);
    }

    /**
     * Fetch multiple rows
     */
    public static function get_results($query, ...$args) {
        global $wpdb;
        if (!empty($args)) {
            if (count($args) === 1 && is_array($args[0])) {
                $args = $args[0];
            }
            $query = $wpdb->prepare($query, ...$args);
        }
        return $wpdb->get_results($query);
    }

    /**
     * Fetch a single row
     */
    public static function get_row($query, ...$args) {
        global $wpdb;
        if (!empty($args)) {
            if (count($args) === 1 && is_array($args[0])) {
                $args = $args[0];
            }
            $query = $wpdb->prepare($query, ...$args);
        }
        return $wpdb->get_row($query);
    }

    /**
     * Fetch a single variable
     */
    public static function get_var($query, ...$args) {
        global $wpdb;
        if (!empty($args)) {
            if (count($args) === 1 && is_array($args[0])) {
                $args = $args[0];
            }
            $query = $wpdb->prepare($query, ...$args);
        }
        return $wpdb->get_var($query);
    }

    /**
     * Insert a record
     */
    public static function insert($table_suffix, array $data, array $format = null) {
        global $wpdb;
        $table = self::get_table_name($table_suffix);
        $result = $wpdb->insert($table, $data, $format);
        return $result ? $wpdb->insert_id : false;
    }

    /**
     * Update record(s)
     */
    public static function update($table_suffix, array $data, array $where, array $format = null, array $where_format = null) {
        global $wpdb;
        $table = self::get_table_name($table_suffix);
        return $wpdb->update($table, $data, $where, $format, $where_format);
    }

    /**
     * Soft delete record (sets deleted_at = NOW())
     */
    public static function soft_delete($table_suffix, $id) {
        global $wpdb;
        $table = self::get_table_name($table_suffix);
        $sql = $wpdb->prepare("UPDATE {$table} SET deleted_at = NOW() WHERE id = %d AND deleted_at IS NULL", $id);
        return $wpdb->query($sql);
    }

    /**
     * Begin DB Transaction
     */
    public static function begin_transaction() {
        global $wpdb;
        $wpdb->query("START TRANSACTION");
    }

    /**
     * Commit DB Transaction
     */
    public static function commit() {
        global $wpdb;
        $wpdb->query("COMMIT");
    }

    /**
     * Rollback DB Transaction
     */
    public static function rollback() {
        global $wpdb;
        $wpdb->query("ROLLBACK");
    }
}
