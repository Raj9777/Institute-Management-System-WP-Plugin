<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Activator {

    public static function activate() {
        self::create_tables();
        self::register_roles();
        self::designate_super_admin();
        self::seed_default_options();
        self::create_app_page();
        flush_rewrite_rules();
    }

    private static function create_app_page() {
        if (class_exists('IMS_Frontend')) {
            IMS_Frontend::create_app_page();
        }
    }

    private static function create_tables() {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

        $charset_collate = $wpdb->get_charset_collate();

        $sql = "
CREATE TABLE {$wpdb->prefix}ims_students (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  roll_no varchar(50) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  gender varchar(20) DEFAULT 'unspecified',
  dob date DEFAULT NULL,
  phone varchar(20) DEFAULT '',
  email varchar(100) DEFAULT '',
  address text DEFAULT NULL,
  guardian_name varchar(150) DEFAULT '',
  guardian_phone varchar(20) DEFAULT '',
  course_id bigint(20) unsigned DEFAULT NULL,
  batch_id bigint(20) unsigned DEFAULT NULL,
  course_fee decimal(12,2) DEFAULT '0.00',
  discount_type varchar(20) DEFAULT 'percentage',
  discount_value decimal(12,2) DEFAULT '0.00',
  net_fee decimal(12,2) DEFAULT '0.00',
  status varchar(20) DEFAULT 'active',
  photo_url text DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY roll_no (roll_no),
  KEY course_id (course_id),
  KEY batch_id (batch_id),
  KEY status (status)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_courses (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  code varchar(50) NOT NULL,
  name varchar(150) NOT NULL,
  description text DEFAULT NULL,
  fee_amount decimal(12,2) NOT NULL DEFAULT '0.00',
  duration_months int(11) unsigned DEFAULT '1',
  status varchar(20) DEFAULT 'active',
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY code (code)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_batches (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  course_id bigint(20) unsigned NOT NULL,
  name varchar(150) NOT NULL,
  capacity int(11) unsigned NOT NULL DEFAULT '30',
  teacher_id bigint(20) unsigned DEFAULT NULL,
  start_date date DEFAULT NULL,
  end_date date DEFAULT NULL,
  timing varchar(100) DEFAULT '',
  status varchar(20) DEFAULT 'active',
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY course_id (course_id),
  KEY teacher_id (teacher_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_staff (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  wp_user_id bigint(20) unsigned DEFAULT NULL,
  staff_code varchar(50) NOT NULL,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  role_key varchar(50) NOT NULL,
  phone varchar(20) DEFAULT '',
  email varchar(100) DEFAULT '',
  address text DEFAULT NULL,
  designation varchar(100) DEFAULT '',
  base_salary decimal(12,2) DEFAULT '0.00',
  joining_date date DEFAULT NULL,
  photo_url text DEFAULT NULL,
  status varchar(20) DEFAULT 'active',
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY staff_code (staff_code),
  KEY wp_user_id (wp_user_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_attendance (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  entity_type varchar(20) NOT NULL,
  entity_id bigint(20) unsigned NOT NULL,
  batch_id bigint(20) unsigned DEFAULT NULL,
  attendance_date date NOT NULL,
  status varchar(20) NOT NULL,
  remarks varchar(255) DEFAULT '',
  marked_by bigint(20) unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY entity_lookup (entity_type, entity_id),
  KEY attendance_date (attendance_date),
  KEY batch_id (batch_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_invoices (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  invoice_no varchar(50) NOT NULL,
  student_id bigint(20) unsigned NOT NULL,
  gstin varchar(25) DEFAULT '',
  taxable_amount decimal(12,2) NOT NULL DEFAULT '0.00',
  cgst_rate decimal(5,2) NOT NULL DEFAULT '9.00',
  cgst_amount decimal(12,2) NOT NULL DEFAULT '0.00',
  sgst_rate decimal(5,2) NOT NULL DEFAULT '9.00',
  sgst_amount decimal(12,2) NOT NULL DEFAULT '0.00',
  total_tax decimal(12,2) NOT NULL DEFAULT '0.00',
  total_amount decimal(12,2) NOT NULL DEFAULT '0.00',
  invoice_date date NOT NULL,
  status varchar(20) DEFAULT 'unpaid',
  created_by bigint(20) unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY invoice_no (invoice_no),
  KEY student_id (student_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_payments (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  receipt_no varchar(50) NOT NULL,
  invoice_id bigint(20) unsigned NOT NULL,
  student_id bigint(20) unsigned NOT NULL,
  amount decimal(12,2) NOT NULL,
  payment_mode varchar(30) NOT NULL,
  reference_no varchar(100) DEFAULT '',
  payment_date date NOT NULL,
  fee_breakdown text DEFAULT NULL,
  is_reversal tinyint(1) NOT NULL DEFAULT '0',
  original_payment_id bigint(20) unsigned DEFAULT NULL,
  reversal_reason varchar(255) DEFAULT '',
  created_by bigint(20) unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY receipt_no (receipt_no),
  KEY invoice_id (invoice_id),
  KEY student_id (student_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_expenses (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  voucher_no varchar(50) NOT NULL,
  category varchar(100) NOT NULL,
  title varchar(200) NOT NULL,
  description text DEFAULT NULL,
  amount decimal(12,2) NOT NULL DEFAULT '0.00',
  gstin varchar(25) DEFAULT '',
  vendor_name varchar(150) DEFAULT '',
  expense_date date NOT NULL,
  payment_mode varchar(30) NOT NULL DEFAULT 'cash',
  receipt_url text DEFAULT NULL,
  created_by bigint(20) unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY voucher_no (voucher_no),
  KEY expense_date (expense_date)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_payroll (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  staff_id bigint(20) unsigned NOT NULL,
  month_year varchar(10) NOT NULL,
  base_salary decimal(12,2) NOT NULL DEFAULT '0.00',
  bonus decimal(12,2) NOT NULL DEFAULT '0.00',
  deductions decimal(12,2) NOT NULL DEFAULT '0.00',
  net_salary decimal(12,2) NOT NULL DEFAULT '0.00',
  payment_date date NOT NULL,
  payment_mode varchar(30) NOT NULL DEFAULT 'bank_transfer',
  reference_no varchar(100) DEFAULT '',
  status varchar(20) DEFAULT 'paid',
  created_by bigint(20) unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY staff_id (staff_id),
  KEY month_year (month_year)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_sequences (
  sequence_key varchar(50) NOT NULL,
  current_value bigint(20) unsigned NOT NULL DEFAULT '0',
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY  (sequence_key)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_payroll_runs (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  staff_id bigint(20) unsigned NOT NULL,
  month int(2) unsigned NOT NULL,
  year int(4) unsigned NOT NULL,
  working_days_basis int(11) unsigned NOT NULL DEFAULT '26',
  per_day_rate decimal(12,2) NOT NULL DEFAULT '0.00',
  weighted_present_days decimal(6,2) NOT NULL DEFAULT '0.00',
  calculated_amount decimal(12,2) NOT NULL DEFAULT '0.00',
  manual_adjustment decimal(12,2) NOT NULL DEFAULT '0.00',
  adjustment_reason text DEFAULT NULL,
  net_payable decimal(12,2) NOT NULL DEFAULT '0.00',
  status varchar(20) NOT NULL DEFAULT 'draft',
  finalized_at datetime DEFAULT NULL,
  finalized_by_user_id bigint(20) unsigned DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY staff_month_year (staff_id, year, month),
  KEY month_year_lookup (year, month),
  KEY status (status)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_audit_logs (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  event_type varchar(50) NOT NULL,
  actor_id bigint(20) unsigned NOT NULL DEFAULT '0',
  target_id bigint(20) unsigned NOT NULL DEFAULT '0',
  details text DEFAULT NULL,
  ip_address varchar(45) DEFAULT '',
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY  (id),
  KEY event_type (event_type),
  KEY actor_id (actor_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_enquiries (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(150) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(100) DEFAULT '',
  course_id bigint(20) unsigned DEFAULT NULL,
  source varchar(50) NOT NULL DEFAULT 'Walk-in',
  status varchar(30) NOT NULL DEFAULT 'New',
  notes longtext DEFAULT NULL,
  next_follow_up_date date DEFAULT NULL,
  created_by_user_id bigint(20) unsigned NOT NULL,
  converted_student_id bigint(20) unsigned DEFAULT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY status (status),
  KEY next_follow_up_date (next_follow_up_date),
  KEY course_id (course_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_vendors (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(150) NOT NULL,
  phone varchar(20) DEFAULT '',
  email varchar(100) DEFAULT '',
  address text DEFAULT NULL,
  gstin varchar(50) DEFAULT '',
  category varchar(100) DEFAULT 'Supplies',
  status varchar(20) DEFAULT 'active',
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY status (status)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_staff_bank_details (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  staff_id bigint(20) unsigned NOT NULL,
  account_holder_name varchar(150) DEFAULT '',
  bank_name varchar(150) DEFAULT '',
  account_number varchar(100) DEFAULT '',
  ifsc_code varchar(50) DEFAULT '',
  branch varchar(150) DEFAULT '',
  upi_id varchar(100) DEFAULT '',
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY staff_id (staff_id)
) $charset_collate;

CREATE TABLE {$wpdb->prefix}ims_admission_agreements (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  agreement_no varchar(50) NOT NULL,
  student_id bigint(20) unsigned NOT NULL,
  prev_invoice_no varchar(50) DEFAULT '',
  agreement_date date NOT NULL,
  exam_fee decimal(12,2) NOT NULL DEFAULT '0.00',
  inv_val decimal(12,2) NOT NULL DEFAULT '0.00',
  caution_deposit decimal(12,2) NOT NULL DEFAULT '0.00',
  first_receipt_no varchar(50) DEFAULT '',
  first_receipt_val decimal(12,2) DEFAULT '0.00',
  first_receipt_date date DEFAULT NULL,
  second_receipt_no varchar(50) DEFAULT '',
  second_receipt_date date DEFAULT NULL,
  instalments text DEFAULT NULL,
  notes text DEFAULT NULL,
  created_by bigint(20) unsigned NOT NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY agreement_no (agreement_no),
  KEY student_id (student_id)
) $charset_collate;
";

        dbDelta($sql);

        // Explicit column migration checks for production upgrades
        $pay_table = "{$wpdb->prefix}ims_payments";
        $pay_cols = $wpdb->get_col("SHOW COLUMNS FROM {$pay_table}");
        if (is_array($pay_cols)) {
            if (!in_array('student_id', $pay_cols, true)) {
                $wpdb->query("ALTER TABLE {$pay_table} ADD COLUMN student_id bigint(20) unsigned NOT NULL DEFAULT 0 AFTER invoice_id");
            }
            if (!in_array('fee_breakdown', $pay_cols, true)) {
                $wpdb->query("ALTER TABLE {$pay_table} ADD COLUMN fee_breakdown text DEFAULT NULL AFTER payment_date");
            }
            if (!in_array('is_reversal', $pay_cols, true)) {
                $wpdb->query("ALTER TABLE {$pay_table} ADD COLUMN is_reversal tinyint(1) NOT NULL DEFAULT '0' AFTER fee_breakdown");
            }
            if (!in_array('original_payment_id', $pay_cols, true)) {
                $wpdb->query("ALTER TABLE {$pay_table} ADD COLUMN original_payment_id bigint(20) unsigned DEFAULT NULL AFTER is_reversal");
            }
            if (!in_array('reversal_reason', $pay_cols, true)) {
                $wpdb->query("ALTER TABLE {$pay_table} ADD COLUMN reversal_reason varchar(255) DEFAULT '' AFTER original_payment_id");
            }
            if (!in_array('deleted_at', $pay_cols, true)) {
                $wpdb->query("ALTER TABLE {$pay_table} ADD COLUMN deleted_at datetime DEFAULT NULL AFTER created_at");
            }
        }

        // Column upgrade for ims_expenses vendor_id
        $exp_table = "{$wpdb->prefix}ims_expenses";
        $exp_cols = $wpdb->get_col("SHOW COLUMNS FROM {$exp_table}");
        if (is_array($exp_cols)) {
            if (!in_array('vendor_id', $exp_cols, true)) {
                $wpdb->query("ALTER TABLE {$exp_table} ADD COLUMN vendor_id bigint(20) unsigned DEFAULT NULL AFTER category");
            }
            if (!in_array('deleted_at', $exp_cols, true)) {
                $wpdb->query("ALTER TABLE {$exp_table} ADD COLUMN deleted_at datetime DEFAULT NULL AFTER created_at");
            }
        }

        // Column upgrade for ims_invoices
        $inv_table = "{$wpdb->prefix}ims_invoices";
        $inv_cols = $wpdb->get_col("SHOW COLUMNS FROM {$inv_table}");
        if (is_array($inv_cols)) {
            if (!in_array('deleted_at', $inv_cols, true)) {
                $wpdb->query("ALTER TABLE {$inv_table} ADD COLUMN deleted_at datetime DEFAULT NULL AFTER created_at");
            }
        }

        // Column upgrade for ims_students
        $stud_table = "{$wpdb->prefix}ims_students";
        $stud_cols = $wpdb->get_col("SHOW COLUMNS FROM {$stud_table}");
        if (is_array($stud_cols)) {
            if (!in_array('course_fee', $stud_cols, true)) {
                $wpdb->query("ALTER TABLE {$stud_table} ADD COLUMN course_fee decimal(12,2) DEFAULT '0.00' AFTER batch_id");
            }
            if (!in_array('discount_type', $stud_cols, true)) {
                $wpdb->query("ALTER TABLE {$stud_table} ADD COLUMN discount_type varchar(20) DEFAULT 'percentage' AFTER course_fee");
            }
            if (!in_array('discount_value', $stud_cols, true)) {
                $wpdb->query("ALTER TABLE {$stud_table} ADD COLUMN discount_value decimal(12,2) DEFAULT '0.00' AFTER discount_type");
            }
            if (!in_array('net_fee', $stud_cols, true)) {
                $wpdb->query("ALTER TABLE {$stud_table} ADD COLUMN net_fee decimal(12,2) DEFAULT '0.00' AFTER discount_value");
            }
            if (!in_array('photo_url', $stud_cols, true)) {
                $wpdb->query("ALTER TABLE {$stud_table} ADD COLUMN photo_url text DEFAULT NULL AFTER status");
            }
            if (!in_array('deleted_at', $stud_cols, true)) {
                $wpdb->query("ALTER TABLE {$stud_table} ADD COLUMN deleted_at datetime DEFAULT NULL AFTER updated_at");
            }
        }

        $sequences = array('invoice', 'receipt', 'voucher', 'roll_no', 'staff_code', 'admission_agreement');
        foreach ($sequences as $seq) {
            $wpdb->query($wpdb->prepare(
                "INSERT IGNORE INTO {$wpdb->prefix}ims_sequences (sequence_key, current_value) VALUES (%s, 0)",
                $seq
            ));
        }

        if (defined('IMS_DB_VERSION')) {
            update_option('ims_db_version', IMS_DB_VERSION);
        }
    }

    private static function register_roles() {
        IMS_Roles::register_custom_roles();
    }

    /**
     * Designates the current WP user completing setup as Institute Super Admin
     */
    private static function designate_super_admin() {
        $user_id = get_current_user_id();
        if ($user_id > 0) {
            $user = new WP_User($user_id);
            if (!$user->has_cap('ims_super_admin')) {
                $user->add_role('ims_super_admin');
                require_once __DIR__ . '/class-ims-audit.php';
                IMS_Audit::log('super_admin_designated', $user_id, 'Designated initial Institute Super Admin during plugin activation.', $user_id);
            }
        }
    }

    private static function seed_default_options() {
        if (!get_option('ims_institute_settings')) {
            update_option('ims_institute_settings', array(
                'institute_name'    => 'My Institute of Technology',
                'tagline'           => 'Excellence in Education',
                'gstin'             => '27AAAAA0000A1Z5',
                'currency'          => 'INR',
                'phone'             => '+91 9876543210',
                'email'             => 'contact@institute.com',
                'address'           => '123 Academic Row, Education Hub, India',
                'website'           => 'www.institute.com',
                'logo_url'          => '',
                'signature_url'     => '',
                'invoice_prefix'    => 'INV',
                'receipt_prefix'    => 'REC',
                'voucher_prefix'    => 'VOU',
                'student_prefix'    => 'STU',
                'cgst_rate'         => 9.00,
                'sgst_rate'         => 9.00,
                'app_slug'          => 'institute-app',
                'weekly_off_day'    => 'Sunday',
                'receipt_terms'     => "* Cheques subject to realisation.\nThe receipt must be produced when demanded. Fee once paid are not refundable.",
                'admission_terms'   => "I have read and understood the code of conduct, and payment term / Installment plan mentioned above and agree to abide by them and also the terms and conditions Printed overleaf.",
                'attendance_weights' => array(
                    'present'  => 1.0,
                    'half_day' => 0.5,
                    'late'     => 1.0,
                    'leave'    => 1.0,
                    'absent'   => 0.0,
                    'holiday'  => 1.0,
                ),
            ));
        }
    }
}
