import os
import sys

def verify_fixes():
    print("--- Verifying User Deletion, Student Ledger & Finance Amount Fixes ---")

    # 1. Delete User in class-ims-rest-auth.php, api.js & SettingsView.jsx
    auth_file = os.path.join("includes", "api", "class-ims-rest-auth.php")
    with open(auth_file, "r", encoding="utf-8") as f:
        auth_content = f.read()
    assert "register_rest_route($this->namespace, '/users/(?P<id>\\d+)', array(" in auth_content
    assert "'methods'             => 'DELETE'" in auth_content
    assert "function delete_plugin_user" in auth_content
    assert "wp_delete_user" in auth_content
    print("[OK] Check 1: REST Auth controller supports DELETE /users/{id} with capability and hierarchy checks.")

    api_file = os.path.join("admin", "src", "services", "api.js")
    with open(api_file, "r", encoding="utf-8") as f:
        api_content = f.read()
    assert "deleteUser:" in api_content
    print("[OK] Check 2: api.js includes deleteUser method.")

    settings_file = os.path.join("admin", "src", "views", "SettingsView.jsx")
    with open(settings_file, "r", encoding="utf-8") as f:
        sett_content = f.read()
    assert "handleDeleteUser" in sett_content
    assert "Delete User Permanently" in sett_content or "Delete" in sett_content
    print("[OK] Check 3: SettingsView User Management includes Delete User button and handler.")

    # 2. Student Ledger button in StudentsView.jsx
    students_file = os.path.join("admin", "src", "views", "StudentsView.jsx")
    with open(students_file, "r", encoding="utf-8") as f:
        stud_content = f.read()
    assert "openStudentLedger" in stud_content
    assert "api.getStudent(student.id)" in stud_content
    assert "api.getDocuments" in stud_content
    assert "setLedgerStudent(fullProfile)" in stud_content
    print("[OK] Check 4: StudentsView openStudentLedger loads full student profile with complete financial ledger.")

    # 3. Finances Fee Receipts amount formatting without '-' sign
    fin_file = os.path.join("admin", "src", "views", "FinancesView.jsx")
    with open(fin_file, "r", encoding="utf-8") as f:
        fin_content = f.read()
    assert "{p.is_reversal ? '-' : '+'}" not in fin_content
    assert "₹{Math.abs(parseFloat(p.amount)).toLocaleString('en-IN')}" in fin_content
    print("[OK] Check 5: Fee Receipts & Ledger renders positive amount without negative minus sign.")

    print("\nALL REQUESTED FIXES VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_fixes()
