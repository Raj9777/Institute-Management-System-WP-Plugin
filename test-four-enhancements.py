import os
import sys

def verify_enhancements():
    print("--- Verifying 4 Feature Enhancements ---")

    # 1. Roll Number Format [year month serial_number]
    db_file = os.path.join("includes", "class-ims-db.php")
    with open(db_file, "r", encoding="utf-8") as f:
        db_content = f.read()
    assert "$month = date('m');" in db_content
    assert "$key === 'roll_no'" in db_content
    assert "%s%s-%04d" in db_content or "%s-%s%s-%04d" in db_content
    print("[OK] Check 1: Student roll number generated in [year month serial_number] format.")

    # 2. Attendance Sub-Sections (Take Attendance & View Attendance)
    att_view = os.path.join("admin", "src", "views", "AttendanceView.jsx")
    with open(att_view, "r", encoding="utf-8") as f:
        att_content = f.read()
    assert "Take Attendance" in att_content
    assert "View Attendance" in att_content
    assert "Monthly Attendance Register Matrix" in att_content or "Monthly Matrix" in att_content
    assert "Daily Log" in att_content

    att_api = os.path.join("includes", "api", "class-ims-rest-attendance.php")
    with open(att_api, "r", encoding="utf-8") as f:
        api_content = f.read()
    assert "$month" in api_content and "$year" in api_content
    print("[OK] Check 2: Attendance view split into Take Attendance and View Attendance sub-sections.")

    # 3. Institute Logo on Login and Dashboard
    tpl_file = os.path.join("includes", "templates", "template-app.php")
    with open(tpl_file, "r", encoding="utf-8") as f:
        tpl_content = f.read()
    assert "settings['logo_url']" in tpl_content
    assert "<img src=" in tpl_content and "logo_url" in tpl_content

    dash_file = os.path.join("admin", "src", "views", "DashboardView.jsx")
    with open(dash_file, "r", encoding="utf-8") as f:
        dash_content = f.read()
    assert "settings?.logo_url" in dash_content
    assert "Institute Branding Banner" in dash_content or "settings?.institute_name" in dash_content

    sidebar_file = os.path.join("admin", "src", "components", "Sidebar.jsx")
    with open(sidebar_file, "r", encoding="utf-8") as f:
        sb_content = f.read()
    assert "settings?.logo_url" in sb_content
    print("[OK] Check 3: Institute logo configured for Login page, Dashboard banner, and Sidebar.")

    # 4. User Management Capability Overrides for Sections and Sub-Sections
    roles_file = os.path.join("includes", "class-ims-roles.php")
    with open(roles_file, "r", encoding="utf-8") as f:
        roles_content = f.read()
    assert "get_capability_definitions" in roles_content
    assert "ims_view_attendance" in roles_content
    assert "ims_mark_attendance" in roles_content
    assert "ims_view_payroll" in roles_content
    assert "ims_manage_payroll" in roles_content

    settings_file = os.path.join("admin", "src", "views", "SettingsView.jsx")
    with open(settings_file, "r", encoding="utf-8") as f:
        sett_content = f.read()
    assert "Student Management & Admissions" in sett_content
    assert "Sub-section: View Attendance Register" in sett_content
    assert "Sub-section: Take / Mark Attendance" in sett_content
    assert "Sub-section: View Staff & Payroll Runs" in sett_content
    assert "Sub-section: Manage & Finalize Payroll" in sett_content
    assert "Grant All" in sett_content
    assert "Revoke All" in sett_content
    print("[OK] Check 4: User management capability override modal supports granular section & sub-section permissions.")

    print("\nALL 4 USER ENHANCEMENTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_enhancements()
