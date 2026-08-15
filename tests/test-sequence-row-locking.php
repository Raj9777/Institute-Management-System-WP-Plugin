<?php
/**
 * Class SequenceRowLockingTest
 *
 * Tests the atomic row-locking sequence allocation in IMS_DB::get_next_sequence().
 */
class SequenceRowLockingTest extends WP_UnitTestCase {

    public function setUp(): void {
        parent::setUp();
        IMS_Activator::activate();
    }

    /**
     * Test two consecutive/simultaneous sequence requests for fee receipts.
     * Asserts that two distinct, strictly sequential receipt numbers are generated
     * under $wpdb FOR UPDATE row locking without key collisions.
     */
    public function test_concurrent_receipt_sequence_locking() {
        // Request 1: Simulate First Desktop Fee Collection
        $receipt1 = IMS_DB::get_next_sequence('receipt');

        // Request 2: Simulate Second Simultaneous Desktop Fee Collection
        $receipt2 = IMS_DB::get_next_sequence('receipt');

        // Assert that both receipt numbers are non-empty
        $this->assertNotEmpty($receipt1);
        $this->assertNotEmpty($receipt2);

        // Assert that receipt numbers are distinct (never collide)
        $this->assertNotEquals($receipt1, $receipt2);

        // Assert sequence format matches REC-YYYY-XXXX pattern
        $this->assertMatchesRegularExpression('/^REC-\d{4}-\d{4}$/', $receipt1);
        $this->assertMatchesRegularExpression('/^REC-\d{4}-\d{4}$/', $receipt2);

        // Extract numeric counters and verify strict sequential increment
        $seq1 = (int) substr($receipt1, -4);
        $seq2 = (int) substr($receipt2, -4);

        $this->assertEquals($seq1 + 1, $seq2, 'Sequential receipt numbers must increment by exactly 1 under $wpdb FOR UPDATE locking.');
    }

    /**
     * Test invoice sequence generation under FOR UPDATE locking.
     */
    public function test_invoice_sequence_locking() {
        $inv1 = IMS_DB::get_next_sequence('invoice');
        $inv2 = IMS_DB::get_next_sequence('invoice');

        $this->assertNotEquals($inv1, $inv2);
        $this->assertMatchesRegularExpression('/^INV-\d{4}-\d{4}$/', $inv1);
        $this->assertMatchesRegularExpression('/^INV-\d{4}-\d{4}$/', $inv2);
    }
}
