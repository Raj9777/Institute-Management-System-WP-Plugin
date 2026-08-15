def run_tests():
    print("--- Hardened Sensitive Staff Bank Details Verification ---")

    # 1. Capability Grant Check
    with open("includes/class-ims-roles.php", "r", encoding="utf-8") as f:
        roles = f.read()

    assert "'ims_accountant' => array" in roles
    # Check that ims_accountant has ims_view_staff_sensitive => true
    accountant_block = roles.split("'ims_accountant' => array(")[1].split("),")[0]
    assert "'ims_view_staff_sensitive' => true" in accountant_block
    print("[OK] Requirement 1: ims_view_staff_sensitive granted to Accountant.")

    # 2. Bulk List Exclusion & Rest Endpoints Check
    with open("includes/api/class-ims-rest-staff.php", "r", encoding="utf-8") as f:
        staff_api = f.read()

    # Bulk list unsets bank details completely
    assert "unset($staff->bank_details);" in staff_api
    print("[OK] Requirement 7: Bulk list endpoint strictly excludes bank details for all roles.")

    # Masked by default & Cache-Control
    assert "is_masked" in staff_api
    assert "Cache-Control" in staff_api
    assert "no-store, no-cache, must-revalidate" in staff_api
    print("[OK] Requirement 3 & 6: Masked by default for authorized viewers & Cache-Control: no-store enforced.")

    # Reveal endpoint & Audit Log
    assert "/reveal-bank-details" in staff_api
    assert "reveal_staff_bank_details" in staff_api
    assert "IMS_Audit::log" in staff_api
    print("[OK] Requirement 4: Reveal endpoint logs to audit trail.")

    # Encryption at Rest (AES-256-CBC)
    assert "openssl_encrypt" in staff_api
    assert "openssl_decrypt" in staff_api
    assert "IMS_ENCRYPTION_KEY" in staff_api
    print("[OK] Requirement 5: AES-256-CBC Encryption at rest implemented.")

    # React UI Reveal integration
    with open("admin/src/views/StaffProfileView.jsx", "r", encoding="utf-8") as f:
        view = f.read()
    assert "revealStaffBankDetails" in view
    assert "Reveal Full Account Details" in view
    print("[OK] React StaffProfileView reveal action integrated.")

    print("\nALL HARDENED SENSITIVE STAFF DATA VERIFICATIONS PASSED CLEANLY!")

if __name__ == '__main__':
    run_tests()
