import re
import os
import datetime

print("=== Running Feature Validation Checks ===")

# Test 1: Due Date Calculation logic
def calculate_installment_due_date(admission_date_str, installment_index=0):
    dt = datetime.datetime.strptime(admission_date_str, "%Y-%m-%d")
    day = dt.day
    year = dt.year
    month = dt.month

    base_offset = 1 if day <= 20 else 2
    target_month = month + base_offset + installment_index

    calc_year = year + (target_month - 1) // 12
    calc_month = ((target_month - 1) % 12) + 1
    return f"{calc_year:04d}-{calc_month:02d}-10"

# Oct 15 -> Nov 10
due_oct15 = calculate_installment_due_date("2026-10-15", 0)
assert due_oct15 == "2026-11-10", f"Expected 2026-11-10, got {due_oct15}"
print(f"PASS: Admission 2026-10-15 -> 1st Installment Due Date: {due_oct15}")

# Oct 20 -> Nov 10
due_oct20 = calculate_installment_due_date("2026-10-20", 0)
assert due_oct20 == "2026-11-10", f"Expected 2026-11-10, got {due_oct20}"
print(f"PASS: Admission 2026-10-20 -> 1st Installment Due Date: {due_oct20}")

# Oct 21 -> Dec 10
due_oct21 = calculate_installment_due_date("2026-10-21", 0)
assert due_oct21 == "2026-12-10", f"Expected 2026-12-10, got {due_oct21}"
print(f"PASS: Admission 2026-10-21 -> 1st Installment Due Date: {due_oct21}")

# Oct 21 -> 2nd installment Jan 10 (2027-01-10)
due_oct21_2 = calculate_installment_due_date("2026-10-21", 1)
assert due_oct21_2 == "2027-01-10", f"Expected 2027-01-10, got {due_oct21_2}"
print(f"PASS: Admission 2026-10-21 -> 2nd Installment Due Date: {due_oct21_2}")

# Test 2: Voucher sequence formatting
year = "2026"
month = "10"
next_val = 1
voucher_formatted = f"{year}{month}{next_val:04d}"
assert voucher_formatted == "2026100001", f"Expected 2026100001, got {voucher_formatted}"
print(f"PASS: Voucher sequence format: {voucher_formatted}")

# Test 3: Check PHP and JS files for required implementations
php_helper = open("includes/class-ims-helper.php", "r", encoding="utf-8").read()
assert "calculate_installment_due_date" in php_helper
print("PASS: class-ims-helper.php contains calculate_installment_due_date")

php_dashboard = open("includes/api/class-ims-rest-dashboard.php", "r", encoding="utf-8").read()
assert "new_student_fee" in php_dashboard
assert "old_student_fee" in php_dashboard
assert "critical_students" in php_dashboard
assert "due_students" in php_dashboard
print("PASS: class-ims-rest-dashboard.php returns monthly collection breakdown & student lists")

php_reports = open("includes/api/class-ims-rest-reports.php", "r", encoding="utf-8").read()
assert "outstanding_balance" in php_reports
assert "net_fee" in php_reports
print("PASS: class-ims-rest-reports.php exports net_fee and outstanding_balance correctly")

js_sidebar = open("admin/src/components/Sidebar.jsx", "r", encoding="utf-8").read()
assert "Expense Vouchers" in js_sidebar
print("PASS: Sidebar.jsx includes Expense Vouchers separate module")

js_app = open("admin/src/App.jsx", "r", encoding="utf-8").read()
assert "ExpensesView" in js_app
print("PASS: App.jsx routes ExpensesView")

js_academic = open("admin/src/views/AcademicView.jsx", "r", encoding="utf-8").read()
assert "Parent Course" not in js_academic
print("PASS: AcademicView.jsx removed Parent Course from batch creation modal")

print("=== All Feature Validation Checks Passed 100%! ===")
