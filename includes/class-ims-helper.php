<?php

if (!defined('ABSPATH')) {
    exit;
}

class IMS_Helper {

    /**
     * Convert currency number into Indian Rupees words string.
     * e.g. 1000 -> "One Thousand Rupees Only"
     * e.g. 125400.50 -> "One Lakh Twenty Five Thousand Four Hundred Rupees and Fifty Paise Only"
     *
     * @param float|int|string $amount Numeric currency amount
     * @return string Amount formatted in Indian Rupees words
     */
    public static function number_to_words_inr($amount) {
        $amount = floatval($amount);
        if ($amount <= 0) {
            return __('Zero Rupees Only', 'institute-management-system');
        }

        $rupees = (int) floor($amount);
        $paise  = (int) round(($amount - $rupees) * 100);

        $words = array();

        if ($rupees > 0) {
            $r_words = self::convert_number_to_words($rupees);
            $r_label = ($rupees === 1) ? __('Rupee', 'institute-management-system') : __('Rupees', 'institute-management-system');
            $words[] = trim($r_words . ' ' . $r_label);
        }

        if ($paise > 0) {
            $p_words = self::convert_number_to_words($paise);
            $p_label = ($paise === 1) ? __('Paisa', 'institute-management-system') : __('Paise', 'institute-management-system');
            $words[] = trim($p_words . ' ' . $p_label);
        }

        if (empty($words)) {
            return __('Zero Rupees Only', 'institute-management-system');
        }

        return implode(' ' . __('and', 'institute-management-system') . ' ', $words) . ' ' . __('Only', 'institute-management-system');
    }

    private static function convert_number_to_words($num) {
        $ones = array(
            0 => '', 1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
            6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
            11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen',
            15 => 'Fifteen', 16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen', 19 => 'Nineteen'
        );
        $tens = array(
            0 => '', 2 => 'Twenty', 3 => 'Thirty', 4 => 'Forty', 5 => 'Fifty',
            6 => 'Sixty', 7 => 'Seventy', 8 => 'Eighty', 9 => 'Ninety'
        );

        $num = (int) $num;

        if ($num < 20) {
            return $ones[$num];
        }
        if ($num < 100) {
            return trim($tens[(int) floor($num / 10)] . ' ' . $ones[$num % 10]);
        }
        if ($num < 1000) {
            return trim($ones[(int) floor($num / 100)] . ' Hundred ' . self::convert_number_to_words($num % 100));
        }
        if ($num < 100000) { // Thousands (1,000 to 99,999)
            return trim(self::convert_number_to_words((int) floor($num / 1000)) . ' Thousand ' . self::convert_number_to_words($num % 1000));
        }
        if ($num < 10000000) { // Lakhs (1,00,000 to 99,99,999)
            return trim(self::convert_number_to_words((int) floor($num / 100000)) . ' Lakh ' . self::convert_number_to_words($num % 100000));
        }
        // Crores (1,00,00,000+)
        return trim(self::convert_number_to_words((int) floor($num / 10000000)) . ' Crore ' . self::convert_number_to_words($num % 10000000));
    }

    /**
     * Calculate Installment Due Date based on student admission date:
     * - Admission <= 20th of month M -> 1st installment due date is before 10th of next month (M + 1).
     * - Admission > 20th of month M (e.g. Oct 21) -> 1st installment due date is before 10th of next-next month (M + 2, e.g. Dec 10).
     * Subsequent installments (index 1, 2, ...) fall on the 10th of consecutive subsequent months.
     *
     * @param string $admission_date_str Date string of admission / created_at
     * @param int $installment_index 0-indexed installment number (0 for 1st, 1 for 2nd, etc.)
     * @return string Y-m-d formatted due date
     */
    public static function calculate_installment_due_date($admission_date_str = '', $installment_index = 0) {
        $timestamp = !empty($admission_date_str) ? strtotime($admission_date_str) : time();
        if (!$timestamp) {
            $timestamp = time();
        }

        $day   = (int) date('j', $timestamp);
        $year  = (int) date('Y', $timestamp);
        $month = (int) date('n', $timestamp);

        // Admission on or before 20th -> 1st installment due next month (offset +1)
        // Admission after 20th (e.g., Oct 21) -> 1st installment due month after next (offset +2, e.g. Dec 10)
        $base_offset = ($day <= 20) ? 1 : 2;
        $target_month = $month + $base_offset + (int) $installment_index;

        $calc_year = $year + (int) floor(($target_month - 1) / 12);
        $calc_month = (($target_month - 1) % 12) + 1;

        return sprintf('%04d-%02d-10', $calc_year, $calc_month);
    }
}
