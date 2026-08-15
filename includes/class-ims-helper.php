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
}
