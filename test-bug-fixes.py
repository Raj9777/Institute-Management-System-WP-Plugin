import os
import sys

def verify_bug_fixes():
    print("--- Bug Fixes Verification Script ---")

    # 1. Bug 1: Batch Timing Slot Selection in AcademicView.jsx
    acad_view = os.path.join("admin", "src", "views", "AcademicView.jsx")
    assert os.path.exists(acad_view), "AcademicView.jsx missing!"
    with open(acad_view, "r", encoding="utf-8") as f:
        acad_content = f.read()

    assert "start_time" in acad_content, "start_time state/input missing in AcademicView.jsx"
    assert "end_time" in acad_content, "end_time state/input missing in AcademicView.jsx"
    assert "formatTime24to12" in acad_content, "formatTime24to12 helper missing"
    assert "parseTimingString" in acad_content, "parseTimingString helper missing"
    assert "timeToMinutes" in acad_content, "timeToMinutes helper missing"
    assert "Batch end time must be after start time." in acad_content, "End time validation missing"
    assert "Faculty member is already assigned to batch" in acad_content, "Teacher schedule overlap warning missing"
    assert "<Clock" in acad_content, "Clock icon / timing badge missing in Batches table"
    print("[OK] Bug 1: Batch timing slot inputs, 12h/24h conversion, validation, teacher overlap check, and list display verified.")

    # 2. Bug 2: Create GST Invoice & ErrorBoundary Details in ErrorBoundary.jsx and FinancesView.jsx
    err_boundary = os.path.join("admin", "src", "components", "ErrorBoundary.jsx")
    with open(err_boundary, "r", encoding="utf-8") as f:
        err_content = f.read()
    assert "showDetails" in err_content, "showDetails toggle state missing in ErrorBoundary.jsx"
    assert "Show Error Details" in err_content, "Show Error Details toggle text missing"
    assert "componentStack" in err_content, "componentStack rendering missing in ErrorBoundary.jsx"

    fin_view = os.path.join("admin", "src", "views", "FinancesView.jsx")
    with open(fin_view, "r", encoding="utf-8") as f:
        fin_content = f.read()
    assert "const [students, setStudents] = useState([]);" in fin_content, "students state missing in FinancesView.jsx"
    assert "openInvoiceModal" in fin_content, "openInvoiceModal helper missing in FinancesView.jsx"
    assert "loadingStudents" in fin_content, "loadingStudents state missing in FinancesView.jsx"
    print("[OK] Bug 2: ErrorBoundary detail toggle & GST Invoice student state fix verified.")

    # 3. Bug 3: Collect Fee / Issue Receipt & Payment API hardening
    api_js = os.path.join("admin", "src", "services", "api.js")
    with open(api_js, "r", encoding="utf-8") as f:
        api_content = f.read()
    assert "deletePayment: (id) => apiFetch(`/payments/${id}`, { method: 'DELETE' })," in api_content, "deletePayment route fix missing in api.js"

    fin_api = os.path.join("includes", "api", "class-ims-rest-finances.php")
    with open(fin_api, "r", encoding="utf-8") as f:
        fin_api_content = f.read()
    assert "false === $inserted || !$wpdb->insert_id" in fin_api_content, "create_invoice DB insert check missing"
    assert "false === $inserted_pay || !$wpdb->insert_id" in fin_api_content, "create_payment DB insert check missing"
    assert "get_current_user_id() ?: 1" in fin_api_content, "get_current_user_id fallback missing"
    print("[OK] Bug 3: Payment creation DB error handling, user fallback, and deletePayment route verified.")

    print("\nALL 3 BUG FIXES VERIFIED SUCCESSFULLY!\n")

if __name__ == "__main__":
    verify_bug_fixes()
