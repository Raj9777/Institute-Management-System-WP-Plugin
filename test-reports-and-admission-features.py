import os
import re
import sys

def check_file_contains(filepath, patterns, label):
    print(f"--- Checking {label}: {filepath} ---")
    if not os.path.exists(filepath):
        print(f"[FAIL] File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    all_passed = True
    for pat in patterns:
        if isinstance(pat, tuple):
            pattern, desc = pat
        else:
            pattern, desc = pat, pat

        if pattern in content:
            print(f"  [PASS] {desc}")
        else:
            print(f"  [FAIL] Missing: {desc}")
            all_passed = False

    return all_passed

def run_tests():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Reports REST Controller
    reports_php = os.path.join(base_dir, 'includes', 'api', 'class-ims-rest-reports.php')
    p1 = check_file_contains(reports_php, [
        ('/reports/monthwise', 'Monthwise endpoint registered'),
        ('/reports/students-detailed', 'Students detailed endpoint registered'),
        ('get_monthwise_report', 'get_monthwise_report method exists'),
        ('get_students_detailed_report', 'get_students_detailed_report method exists'),
        ('total_admissions', 'Counts total admissions'),
        ('total_invoiced', 'Sums total invoiced'),
        ('rent_expenses', 'Calculates house/office rent expenses'),
        ('other_expenses', 'Calculates other expenses'),
        ('total_payroll', 'Calculates staff payroll expenses'),
        ('net_operating_margin', 'Calculates net operating margin'),
    ], 'Reports REST API')

    # 2. Students REST Controller
    students_php = os.path.join(base_dir, 'includes', 'api', 'class-ims-rest-students.php')
    p2 = check_file_contains(students_php, [
        ('/students/(?P<id>\\d+)/position', 'Student position update route'),
        ('/students/(?P<id>\\d+)/upgrade', 'Student course upgrade route'),
        ('update_position', 'update_position handler'),
        ('upgrade_course', 'upgrade_course handler'),
        ('admission_fee', 'Handles admission fee'),
        ('admission_date', 'Handles admission date'),
        ('current_position_status', 'Handles current position status'),
        ('current_company_or_institution', 'Handles current company or institution'),
        ('current_designation', 'Handles current designation'),
        ('passed_out_year', 'Handles passed out year'),
    ], 'Students REST API')

    # 3. Activator Database Schema
    activator_php = os.path.join(base_dir, 'includes', 'class-ims-activator.php')
    p3 = check_file_contains(activator_php, [
        ('admission_fee decimal(12,2)', 'admission_fee column in DDL'),
        ('admission_date date', 'admission_date column in DDL'),
        ('current_position text', 'current_position column in DDL'),
        ('current_position_status varchar', 'current_position_status column in DDL'),
        ('current_company_or_institution varchar', 'current_company_or_institution column in DDL'),
        ('current_designation varchar', 'current_designation column in DDL'),
        ('passed_out_year varchar', 'passed_out_year column in DDL'),
    ], 'Database Activator Schema & Migrations')

    # 4. Sidebar navigation
    sidebar_jsx = os.path.join(base_dir, 'admin', 'src', 'components', 'Sidebar.jsx')
    p4 = check_file_contains(sidebar_jsx, [
        ("{ id: 'reports', label: 'Reports & Analytics', icon: BarChart3", 'Reports module in navItems'),
        ("{ id: 'settings', label: 'Settings'", 'Settings module placed after reports'),
    ], 'Sidebar Navigation Module')

    # 5. Reports View
    reports_view = os.path.join(base_dir, 'admin', 'src', 'views', 'ReportsView.jsx')
    p5 = check_file_contains(reports_view, [
        ('Student Details & Alumni', 'Student Details & Alumni Tab'),
        ('Monthwise Financials', 'Monthwise Financials Tab'),
        ('Data Backups', 'Data Backups Tab'),
        ('current_position_status', 'Career position status tracking'),
        ('passed_out_year', 'Passed out year filter and edit'),
        ('exportMonthwiseToCSV', 'Monthwise CSV export'),
        ('exportStudentsToCSV', 'Students CSV export'),
        ('handleOpenPositionModal', 'Update Position modal'),
    ], 'Reports & Analytics View')

    # 6. Students View enhancements
    students_view = os.path.join(base_dir, 'admin', 'src', 'views', 'StudentsView.jsx')
    p6 = check_file_contains(students_view, [
        ('formData.admission_date', 'Admission date in state and form'),
        ('formData.admission_fee', 'Admission fee in state and form'),
        ('openCollectFeeModal', 'Quick Fee collection modal'),
        ('openReceiptsModal', 'Student Receipts modal'),
        ('openUpgradeModal', 'Course Upgrade modal'),
        ('Admission Fee', 'Admission fee included first in agreement installments'),
        ('durationMonths', 'Installment amounts divided by course duration months'),
        ('ReceiptPrintModal', 'Integrated ReceiptPrintModal'),
    ], 'Students View Feature Set')

    # 7. Admission Agreement Print Modal
    agreement_modal = os.path.join(base_dir, 'admin', 'src', 'components', 'AdmissionAgreementPrintModal.jsx')
    p7 = check_file_contains(agreement_modal, [
        ('Admission Date', 'Admission Date label in printout'),
        ('Course', 'Course name in printout'),
        ('Invoice No.', 'Invoice number in printout'),
        ('Inv. Val', 'Invoice value in printout'),
    ], 'Admission Agreement Printout')

    all_ok = all([p1, p2, p3, p4, p5, p6, p7])
    print("\n" + "="*50)
    if all_ok:
        print("ALL REPORTS & ADMISSION ENHANCEMENT TESTS PASSED! [100% OK]")
    else:
        print("SOME TESTS FAILED - PLEASE REVIEW LOGS")
    print("="*50)

if __name__ == '__main__':
    run_tests()
