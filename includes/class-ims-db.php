<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/class-ims-db-base.php';

/**
 * Concrete Database Operations Manager extending IMS_DB_Base
 */
class IMS_DB extends IMS_DB_Base {

    /**
     * Atomically fetch and increment a sequence number within a DB transaction using row locking (FOR UPDATE).
     */
    public static function get_next_sequence($key) {
        global $wpdb;
        $table = self::get_table_name('sequences');
        $settings = get_option('ims_institute_settings', array());

        $prefix = '';
        switch ($key) {
            case 'invoice':
                $prefix = isset($settings['invoice_prefix']) ? $settings['invoice_prefix'] : 'INV';
                break;
            case 'receipt':
                $prefix = isset($settings['receipt_prefix']) ? $settings['receipt_prefix'] : 'REC';
                break;
            case 'voucher':
                $prefix = isset($settings['voucher_prefix']) ? $settings['voucher_prefix'] : 'VOU';
                break;
            case 'roll_no':
                $prefix = isset($settings['student_prefix']) ? $settings['student_prefix'] : 'STU';
                break;
            case 'staff_code':
                $prefix = 'STF';
                break;
            default:
                $prefix = strtoupper($key);
                break;
        }

        try {
            self::begin_transaction();

            // Lock row for update via base method
            $current = self::get_var("SELECT current_value FROM {$table} WHERE sequence_key = %s FOR UPDATE", $key);

            if (null === $current) {
                $next_val = 1;
                self::insert('sequences', array(
                    'sequence_key' => $key,
                    'current_value' => $next_val,
                ));
            } else {
                $next_val = (int) $current + 1;
                self::update(
                    'sequences',
                    array('current_value' => $next_val),
                    array('sequence_key' => $key),
                    array('%d'),
                    array('%s')
                );
            }

            self::commit();
        } catch (Throwable $e) {
            self::rollback();
            error_log('[IMS Sequence Error] ' . $e->getMessage());
            $next_val = time() % 10000;
        }

        $year = date('Y');
        $month = date('m');

        if ($key === 'roll_no') {
            if (!empty($prefix)) {
                return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $next_val);
            }
            return sprintf('%s%s-%04d', $year, $month, $next_val);
        }

        if ($key === 'voucher') {
            if (!empty($prefix) && $prefix !== 'VOU') {
                return sprintf('%s-%s%s-%04d', $prefix, $year, $month, $next_val);
            }
            return sprintf('%s%s%04d', $year, $month, $next_val);
        }

        return sprintf('%s-%s-%04d', $prefix, $year, $next_val);
    }

    public static function delete_record($table_suffix, $id) {
        return self::soft_delete($table_suffix, $id);
    }
}
