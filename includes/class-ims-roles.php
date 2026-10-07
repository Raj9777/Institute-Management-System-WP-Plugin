<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Roles {

    public static function get_role_ranks() {
        return array(
            'ims_super_admin' => 100,
            'administrator'   => 100,
            'ims_admin'       => 80,
            'ims_accountant'  => 60,
            'ims_front_desk'  => 40,
            'ims_teacher'     => 40,
            'ims_read_only'   => 20,
        );
    }

    public static function get_user_highest_rank($user_id) {
        $user = new WP_User($user_id);
        if (!$user->exists()) {
            return 0;
        }

        $ranks = self::get_role_ranks();
        $max = 0;
        foreach ((array) $user->roles as $r) {
            if (isset($ranks[$r]) && $ranks[$r] > $max) {
                $max = $ranks[$r];
            }
        }
        return $max;
    }

    public static function can_assign_role($actor_id, $target_role) {
        $actor_rank = self::get_user_highest_rank($actor_id);
        $ranks = self::get_role_ranks();
        $target_rank = isset($ranks[$target_role]) ? $ranks[$target_role] : 100;

        return $actor_rank >= $target_rank;
    }

    public static function is_user_disabled($user_id) {
        return (bool) get_user_meta($user_id, '_ims_disabled', true);
    }

    public static function set_user_disabled($user_id, $disabled = true) {
        update_user_meta($user_id, '_ims_disabled', $disabled ? 1 : 0);
    }

    public static function get_user_cap_overrides($user_id) {
        $overrides = get_user_meta($user_id, '_ims_cap_overrides', true);
        return is_array($overrides) ? $overrides : array();
    }

    public static function set_user_cap_overrides($user_id, array $overrides) {
        update_user_meta($user_id, '_ims_cap_overrides', $overrides);
        $user = new WP_User($user_id);
        if ($user->exists()) {
            foreach ($overrides as $cap => $granted) {
                if ($granted === true || $granted === 1 || $granted === '1') {
                    $user->add_cap($cap, true);
                } elseif ($granted === false || $granted === 0 || $granted === '0') {
                    $user->add_cap($cap, false);
                } else {
                    $user->remove_cap($cap);
                }
            }
        }
    }

    public static function get_capability_definitions() {
        return array(
            'students' => array(
                'section' => __('Student Management & Admissions', 'institute-management-system'),
                'capabilities' => array(
                    'ims_manage_students' => array(
                        'label' => __('Manage Student Admissions & Enquiries', 'institute-management-system'),
                        'description' => __('Enquiry capture, student admissions, profile editing, and ledger viewing.', 'institute-management-system'),
                    ),
                ),
            ),
            'academic' => array(
                'section' => __('Academic Courses & Batches', 'institute-management-system'),
                'capabilities' => array(
                    'ims_manage_academic' => array(
                        'label' => __('Manage Courses & Batches', 'institute-management-system'),
                        'description' => __('Create and edit courses, batch schedules, timings, and teacher assignments.', 'institute-management-system'),
                    ),
                ),
            ),
            'attendance' => array(
                'section' => __('Attendance Management', 'institute-management-system'),
                'capabilities' => array(
                    'ims_view_attendance' => array(
                        'label' => __('View Attendance Register', 'institute-management-system'),
                        'description' => __('Sub-section: Inspect daily attendance logs and monthly batch attendance registers.', 'institute-management-system'),
                    ),
                    'ims_mark_attendance' => array(
                        'label' => __('Take / Mark Attendance', 'institute-management-system'),
                        'description' => __('Sub-section: Daily roll calls for students in batches and staff check-ins.', 'institute-management-system'),
                    ),
                ),
            ),
            'finances' => array(
                'section' => __('Finances, Invoicing & Receipts', 'institute-management-system'),
                'capabilities' => array(
                    'ims_manage_finances' => array(
                        'label' => __('Manage Finances, Invoices & Expenses', 'institute-management-system'),
                        'description' => __('Issue GST invoices, collect fee payments, print money receipts, and manage vendor expenses.', 'institute-management-system'),
                    ),
                ),
            ),
            'payroll' => array(
                'section' => __('Staff & Payroll Management', 'institute-management-system'),
                'capabilities' => array(
                    'ims_view_payroll' => array(
                        'label' => __('View Staff Directory & Payroll Runs', 'institute-management-system'),
                        'description' => __('Sub-section: Access staff directory and view monthly payroll calculations.', 'institute-management-system'),
                    ),
                    'ims_manage_payroll' => array(
                        'label' => __('Manage & Finalize Monthly Payroll', 'institute-management-system'),
                        'description' => __('Sub-section: Add bonus/deduction adjustments and finalize salary payouts.', 'institute-management-system'),
                    ),
                    'ims_view_staff_sensitive' => array(
                        'label' => __('View Staff Bank & Sensitive Details', 'institute-management-system'),
                        'description' => __('Sub-section: Access encrypted bank accounts and IFSC details (audited).', 'institute-management-system'),
                    ),
                ),
            ),
            'reports' => array(
                'section' => __('Analytics & Reports', 'institute-management-system'),
                'capabilities' => array(
                    'ims_view_reports' => array(
                        'label' => __('View Institute Reports & Exports', 'institute-management-system'),
                        'description' => __('Generate and export revenue summaries, fee collection logs, and full JSON data backup.', 'institute-management-system'),
                    ),
                ),
            ),
            'settings' => array(
                'section' => __('System Administration & Settings', 'institute-management-system'),
                'capabilities' => array(
                    'ims_manage_settings' => array(
                        'label' => __('Manage Institute Settings', 'institute-management-system'),
                        'description' => __('Configure logo, branding, GSTIN, receipt terms, and sequence prefixes.', 'institute-management-system'),
                    ),
                    'ims_manage_users' => array(
                        'label' => __('Manage Plugin Users & Permissions', 'institute-management-system'),
                        'description' => __('Create staff logins, toggle account statuses, and set section/sub-section capability overrides.', 'institute-management-system'),
                    ),
                ),
            ),
        );
    }

    public static function get_capabilities_map() {
        return array(
            'ims_super_admin' => array(
                'ims_manage_users'         => true,
                'ims_manage_settings'      => true,
                'ims_manage_academic'      => true,
                'ims_manage_students'      => true,
                'ims_mark_attendance'      => true,
                'ims_view_attendance'      => true,
                'ims_manage_finances'      => true,
                'ims_view_payroll'         => true,
                'ims_manage_payroll'       => true,
                'ims_view_reports'         => true,
                'ims_view_staff_sensitive' => true,
                'read'                     => true,
            ),
            'ims_admin' => array(
                'ims_manage_users'         => false,
                'ims_manage_settings'      => true,
                'ims_manage_academic'      => true,
                'ims_manage_students'      => true,
                'ims_mark_attendance'      => true,
                'ims_view_attendance'      => true,
                'ims_manage_finances'      => true,
                'ims_view_payroll'         => true,
                'ims_manage_payroll'       => true,
                'ims_view_reports'         => true,
                'ims_view_staff_sensitive' => false,
                'read'                     => true,
            ),
            'ims_accountant' => array(
                'ims_manage_users'         => false,
                'ims_manage_settings'      => false,
                'ims_manage_academic'      => false,
                'ims_manage_students'      => false,
                'ims_mark_attendance'      => false,
                'ims_view_attendance'      => false,
                'ims_manage_finances'      => true,
                'ims_view_payroll'         => true,
                'ims_manage_payroll'       => true,
                'ims_view_reports'         => true,
                'ims_view_staff_sensitive' => true,
                'read'                     => true,
            ),
            'ims_front_desk' => array(
                'ims_manage_users'         => false,
                'ims_manage_settings'      => false,
                'ims_manage_academic'      => false,
                'ims_manage_students'      => true,
                'ims_mark_attendance'      => true,
                'ims_view_attendance'      => true,
                'ims_manage_finances'      => false,
                'ims_view_payroll'         => false,
                'ims_manage_payroll'       => false,
                'ims_view_reports'         => false,
                'ims_view_staff_sensitive' => false,
                'read'                     => true,
            ),
            'ims_teacher' => array(
                'ims_manage_users'         => false,
                'ims_manage_settings'      => false,
                'ims_manage_academic'      => false,
                'ims_manage_students'      => false,
                'ims_mark_attendance'      => true,
                'ims_view_attendance'      => true,
                'ims_manage_finances'      => false,
                'ims_view_payroll'         => false,
                'ims_manage_payroll'       => false,
                'ims_view_reports'         => false,
                'ims_view_staff_sensitive' => false,
                'read'                     => true,
            ),
            'ims_read_only' => array(
                'ims_manage_users'         => false,
                'ims_manage_settings'      => false,
                'ims_manage_academic'      => false,
                'ims_manage_students'      => false,
                'ims_mark_attendance'      => false,
                'ims_view_attendance'      => true,
                'ims_manage_finances'      => false,
                'ims_view_payroll'         => false,
                'ims_manage_payroll'       => false,
                'ims_view_reports'         => true,
                'ims_view_staff_sensitive' => false,
                'read'                     => true,
            ),
        );
    }

    public static function register_custom_roles() {
        $map = self::get_capabilities_map();
        $names = array(
            'ims_super_admin' => __('Institute Super Admin', 'institute-management-system'),
            'ims_admin'       => __('Institute Admin / Manager', 'institute-management-system'),
            'ims_accountant'  => __('Institute Accountant', 'institute-management-system'),
            'ims_front_desk'  => __('Institute Front Desk', 'institute-management-system'),
            'ims_teacher'     => __('Institute Teacher / Faculty', 'institute-management-system'),
            'ims_read_only'   => __('Institute Read Only', 'institute-management-system'),
        );

        foreach ($map as $role_key => $caps) {
            remove_role($role_key);
            add_role($role_key, $names[$role_key], $caps);
        }

        $admin_role = get_role('administrator');
        if ($admin_role) {
            foreach ($map['ims_super_admin'] as $cap => $grant) {
                if ($grant) {
                    $admin_role->add_cap($cap);
                }
            }
        }
    }
}
