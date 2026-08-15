import os
import re
import sys

def run_tests():
    print("--- Date Restriction Business Rule Verification ---")
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Verify class-ims-validation.php
    val_path = os.path.join(base_dir, 'includes', 'class-ims-validation.php')
    if not os.path.exists(val_path):
        print(f"[FAIL] Missing file: {val_path}")
        sys.exit(1)
    
    with open(val_path, 'r', encoding='utf-8') as f:
        val_content = f.read()

    if 'class IMS_Validation' not in val_content or 'assert_date_allowed' not in val_content:
        print("[FAIL] IMS_Validation or assert_date_allowed missing in class-ims-validation.php")
        sys.exit(1)
    print("[OK] IMS_Validation class and assert_date_allowed method verified.")

    # 2. Check Autoload in institute-management-system.php
    main_php = os.path.join(base_dir, 'institute-management-system.php')
    with open(main_php, 'r', encoding='utf-8') as f:
        main_content = f.read()

    if "require_once IMS_PLUGIN_DIR . 'includes/class-ims-validation.php';" not in main_content:
        print("[FAIL] class-ims-validation.php not autoloaded in institute-management-system.php")
        sys.exit(1)
    if "'is_super_admin'" not in main_content:
        print("[FAIL] is_super_admin property missing in institute-management-system.php")
        sys.exit(1)
    print("[OK] Autoload and is_super_admin flag verified in plugin header.")

    # 3. Check REST Finance Endpoints (create_invoice, create_payment, record_payment_reversal)
    fin_path = os.path.join(base_dir, 'includes', 'api', 'class-ims-rest-finances.php')
    with open(fin_path, 'r', encoding='utf-8') as f:
        fin_content = f.read()

    if "IMS_Validation::assert_date_allowed($invoice_date, 'Invoice Date')" not in fin_content:
        print("[FAIL] Invoice Date validation missing in class-ims-rest-finances.php")
        sys.exit(1)
    if "IMS_Validation::assert_date_allowed($payment_date, 'Payment Date')" not in fin_content:
        print("[FAIL] Payment Date validation missing in class-ims-rest-finances.php")
        sys.exit(1)
    if "IMS_Validation::assert_date_allowed($reversal_date, 'Reversal Date')" not in fin_content:
        print("[FAIL] Reversal Date validation missing in class-ims-rest-finances.php")
        sys.exit(1)
    print("[OK] REST Finances endpoints date validations verified.")

    # 4. Check REST Expense Endpoints (create_expense, update_expense)
    exp_path = os.path.join(base_dir, 'includes', 'api', 'class-ims-rest-expenses.php')
    with open(exp_path, 'r', encoding='utf-8') as f:
        exp_content = f.read()

    if "IMS_Validation::assert_date_allowed($expense_date, 'Expense Date')" not in exp_content:
        print("[FAIL] Expense Date validation missing in class-ims-rest-expenses.php")
        sys.exit(1)
    print("[OK] REST Expenses endpoints date validations verified.")

    # 5. Check REST Payroll Endpoints (create_payroll_record, update_payroll_record)
    pay_path = os.path.join(base_dir, 'includes', 'api', 'class-ims-rest-payroll.php')
    with open(pay_path, 'r', encoding='utf-8') as f:
        pay_content = f.read()

    if "IMS_Validation::assert_date_allowed($payment_date, 'Disbursement Date')" not in pay_content:
        print("[FAIL] Payroll Disbursement Date validation missing in class-ims-rest-payroll.php")
        sys.exit(1)
    print("[OK] REST Payroll endpoints date validations verified.")

    # 6. Check React Frontend UI
    fin_view = os.path.join(base_dir, 'admin', 'src', 'views', 'FinancesView.jsx')
    with open(fin_view, 'r', encoding='utf-8') as f:
        fin_view_content = f.read()

    if "canBackdate" not in fin_view_content or "todayStr" not in fin_view_content:
        print("[FAIL] Frontend min/max date logic missing in FinancesView.jsx")
        sys.exit(1)
    print("[OK] React Frontend UI date constraints verified.")

    print("ALL DATE RESTRICTION VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
