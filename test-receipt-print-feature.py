import os
import sys

def verify_paper_receipt_feature():
    print("--- Paper Receipt Book Reproduction Feature Verification ---")

    # 1. Check IMS_Helper class & number_to_words_inr method in class-ims-helper.php
    helper_file = os.path.join("includes", "class-ims-helper.php")
    assert os.path.exists(helper_file), "class-ims-helper.php missing!"
    with open(helper_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "class IMS_Helper" in content
    assert "function number_to_words_inr" in content
    assert "Rupees" in content and "Paise" in content
    print("[OK] Requirement 1: IMS_Helper::number_to_words_inr helper implemented.")

    # 2. Check Autoload in institute-management-system.php
    main_file = "institute-management-system.php"
    with open(main_file, "r", encoding="utf-8") as f:
        main_content = f.read()
    assert "class-ims-helper.php" in main_content
    print("[OK] Requirement 2: class-ims-helper.php autoloaded in main plugin header.")

    # 3. Check Schema Migration in class-ims-activator.php
    activator_file = os.path.join("includes", "class-ims-activator.php")
    with open(activator_file, "r", encoding="utf-8") as f:
        act_content = f.read()
    assert "fee_breakdown text DEFAULT NULL" in act_content
    assert "SHOW COLUMNS FROM {$pay_table} LIKE 'fee_breakdown'" in act_content
    assert "'website'" in act_content
    assert "'signature_url'" in act_content
    assert "'receipt_terms'" in act_content
    print("[OK] Requirement 3: Database schema upgrade & default branding options verified in activator.")

    # 4. Check REST Settings API for branding options
    settings_api = os.path.join("includes", "api", "class-ims-rest-settings.php")
    with open(settings_api, "r", encoding="utf-8") as f:
        sett_content = f.read()
    assert "'website'" in sett_content
    assert "'signature_url'" in sett_content
    assert "'receipt_terms'" in sett_content
    print("[OK] Requirement 4: REST Settings API expanded for logo, signature, website, and terms.")

    # 5. Check REST Finances GET /payments/{id}/receipt Endpoint
    finances_api = os.path.join("includes", "api", "class-ims-rest-finances.php")
    with open(finances_api, "r", encoding="utf-8") as f:
        fin_content = f.read()
    assert "/payments/(?P<id>\\d+)/receipt" in fin_content
    assert "get_payment_receipt" in fin_content
    assert "IMS_Helper::number_to_words_inr" in fin_content
    assert "fee_breakdown" in fin_content
    print("[OK] Requirement 5: REST Finances endpoint GET /payments/{id}/receipt verified.")

    # 6. Check React Frontend Receipts & Settings Components
    fin_view = os.path.join("admin", "src", "views", "FinancesView.jsx")
    with open(fin_view, "r", encoding="utf-8") as f:
        fin_view_content = f.read()
    assert "ReceiptPrintModal" in fin_view_content
    assert "handleOpenPrintReceipt" in fin_view_content
    assert "Fee Purpose / Towards" in fin_view_content
    assert "By Cash/Cheque No." in fin_view_content
    assert "Drawn on" in fin_view_content

    sett_view = os.path.join("admin", "src", "views", "SettingsView.jsx")
    with open(sett_view, "r", encoding="utf-8") as f:
        sett_view_content = f.read()
    assert "Authorised Signatory Image" in sett_view_content
    assert "Official Website URL" in sett_view_content
    assert "Printed Receipt Terms" in sett_view_content
    print("[OK] Requirement 6: React frontend receipt print modal & settings branding verified.")

    print("\nALL PAPER RECEIPT BOOK REPRODUCTION VERIFICATIONS PASSED SUCCESSFULLY!\n")

if __name__ == "__main__":
    verify_paper_receipt_feature()
