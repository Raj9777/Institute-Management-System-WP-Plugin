import os
import sys

def verify_admission_agreement_feature():
    print("--- Admission Agreement / Paper Invoice Reproduction Verification ---")

    # 1. Check DB Table Schema in class-ims-activator.php
    activator_file = os.path.join("includes", "class-ims-activator.php")
    assert os.path.exists(activator_file), "class-ims-activator.php missing!"
    with open(activator_file, "r", encoding="utf-8") as f:
        act_content = f.read()
    assert "ims_admission_agreements" in act_content
    assert "agreement_no varchar(50) NOT NULL" in act_content
    assert "prev_invoice_no varchar(50)" in act_content
    assert "exam_fee decimal(12,2)" in act_content
    assert "caution_deposit decimal(12,2)" in act_content
    assert "first_receipt_no" in act_content
    assert "instalments text" in act_content
    assert "'admission_agreement'" in act_content
    assert "'admission_terms'" in act_content
    print("[OK] Check 1: ims_admission_agreements database table & sequence key registered in activator.")

    # 2. Check REST API Controller class-ims-rest-agreements.php
    agreements_api = os.path.join("includes", "api", "class-ims-rest-agreements.php")
    assert os.path.exists(agreements_api), "class-ims-rest-agreements.php missing!"
    with open(agreements_api, "r", encoding="utf-8") as f:
        api_content = f.read()
    assert "class IMS_REST_Agreements" in api_content
    assert "/admission-agreements" in api_content
    assert "/admission-agreements/(?P<id>\\d+)/print" in api_content
    assert "get_agreement_print" in api_content
    print("[OK] Check 2: REST API controller IMS_REST_Agreements verified.")

    # 3. Check Autoload & Registration in institute-management-system.php
    main_file = "institute-management-system.php"
    with open(main_file, "r", encoding="utf-8") as f:
        main_content = f.read()
    assert "class-ims-rest-agreements.php" in main_content
    assert "new IMS_REST_Agreements()" in main_content
    print("[OK] Check 3: REST API controller autoloaded and registered in main plugin class.")

    # 4. Check REST Settings for admission_terms
    settings_api = os.path.join("includes", "api", "class-ims-rest-settings.php")
    with open(settings_api, "r", encoding="utf-8") as f:
        sett_content = f.read()
    assert "'admission_terms'" in sett_content
    print("[OK] Check 4: REST Settings API supports admission_terms.")

    # 5. Check React Components & Services
    api_js = os.path.join("admin", "src", "services", "api.js")
    with open(api_js, "r", encoding="utf-8") as f:
        api_js_content = f.read()
    assert "getAgreements" in api_js_content
    assert "getAgreementPrint" in api_js_content

    modal_component = os.path.join("admin", "src", "components", "AdmissionAgreementPrintModal.jsx")
    assert os.path.exists(modal_component), "AdmissionAgreementPrintModal.jsx missing!"
    with open(modal_component, "r", encoding="utf-8") as f:
        modal_content = f.read()
    assert "INSTALMENT" in modal_content
    assert "INSTALMENT DATE" in modal_content
    assert "AMOUNT DATE" in modal_content
    assert "Exam Fee" in modal_content
    assert "Inv. Val" in modal_content
    assert "First Receipt No.:" in modal_content
    assert "Caution Deposit Rs" in modal_content
    assert "E. & O. E." in modal_content
    assert "Signature of Student" in modal_content
    assert "COUNSELLOR" in modal_content

    students_view = os.path.join("admin", "src", "views", "StudentsView.jsx")
    with open(students_view, "r", encoding="utf-8") as f:
        students_content = f.read()
    assert "AdmissionAgreementPrintModal" in students_content
    assert "openAgreementModal" in students_content
    print("[OK] Check 5: React AdmissionAgreementPrintModal component & StudentsView integration verified.")

    print("\nALL ADMISSION AGREEMENT FEATURE VERIFICATIONS PASSED CLEANLY!\n")

if __name__ == "__main__":
    verify_admission_agreement_feature()
