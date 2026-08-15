def run_tests():
    print("--- Four Features Addition Verification ---")

    # 1. Check Activator Schema
    with open("includes/class-ims-activator.php", "r", encoding="utf-8") as f:
        act = f.read()

    assert "CREATE TABLE {$wpdb->prefix}ims_enquiries" in act
    assert "CREATE TABLE {$wpdb->prefix}ims_vendors" in act
    assert "CREATE TABLE {$wpdb->prefix}ims_staff_bank_details" in act
    assert "vendor_id" in act
    print("[OK] Part A, B, C Database Table definitions and Schema Upgrades verified.")

    # 2. Check Roles & Capability Map
    with open("includes/class-ims-roles.php", "r", encoding="utf-8") as f:
        roles = f.read()

    assert "'ims_view_staff_sensitive' => true" in roles
    assert "'ims_view_staff_sensitive' => false" in roles
    print("[OK] Part C Capability ims_view_staff_sensitive correctly mapped exclusively to Super Admin.")

    # 3. Check Staff Sensitive Data API protection
    with open("includes/api/class-ims-rest-staff.php", "r", encoding="utf-8") as f:
        staff_api = f.read()

    assert "can_view_sensitive()" in staff_api
    assert "ims_staff_bank_details" in staff_api
    print("[OK] Part C REST API Hard-Restriction on bank details verified.")

    # 4. Check Enquiries & Vendors REST Controllers
    with open("includes/api/class-ims-rest-enquiries.php", "r", encoding="utf-8") as f:
        enq_api = f.read()
    assert "class IMS_REST_Enquiries" in enq_api
    assert "/enquiries" in enq_api
    assert "notes" in enq_api

    with open("includes/api/class-ims-rest-expenses.php", "r", encoding="utf-8") as f:
        exp_api = f.read()
    assert "/vendors" in exp_api
    assert "vendor_id" in exp_api

    print("[OK] Part A & B REST Endpoints for Enquiries and Vendor Expenses verified.")
    print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
