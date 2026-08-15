import math

def calculate_payroll(base_salary, days_in_month, sunday_count, weights, attendance_counts, manual_adjustment=0):
    # Basis (b): Calendar days minus weekly-off days (Sundays)
    working_days_basis = days_in_month - sunday_count
    
    # Per day rate
    per_day_rate = base_salary / working_days_basis
    
    # Weighted present days
    weighted_present_days = 0.0
    for status, count in attendance_counts.items():
        weight = weights.get(status, 0.0)
        weighted_present_days += count * weight
        
    # Calculated amount
    calculated_amount = round(per_day_rate * weighted_present_days, 2)
    net_payable = round(calculated_amount + manual_adjustment, 2)
    
    return {
        'working_days_basis': working_days_basis,
        'per_day_rate': round(per_day_rate, 2),
        'weighted_present_days': weighted_present_days,
        'calculated_amount': calculated_amount,
        'net_payable': net_payable
    }

def run_test():
    base_salary = 30000.00
    days_in_month = 30
    sunday_count = 4 # 26 working days basis
    
    weights = {
        'present': 1.0,
        'half_day': 0.5,
        'leave': 1.0,
        'absent': 0.0,
        'late': 1.0
    }
    
    attendance_counts = {
        'present': 20,
        'half_day': 2,
        'leave': 3,
        'absent': 5
    }
    
    res = calculate_payroll(base_salary, days_in_month, sunday_count, weights, attendance_counts)
    
    print("--- Test Run Results ---")
    print(f"Base Salary: Rs. {base_salary}")
    print(f"Working Days Basis: {res['working_days_basis']} days")
    print(f"Per Day Rate: Rs. {res['per_day_rate']}")
    print(f"Weighted Present Days: {res['weighted_present_days']} days")
    print(f"Calculated Amount: Rs. {res['calculated_amount']}")
    print(f"Net Payable: Rs. {res['net_payable']}")
    
    # Assertions
    assert res['working_days_basis'] == 26
    assert res['weighted_present_days'] == 24.0
    # 30000 / 26 * 24 = 27692.30769 -> 27692.31
    assert res['calculated_amount'] == 27692.31
    assert res['net_payable'] == 27692.31
    
    print("\nPASSED: Automated payroll calculation matches hand-calculated expectation (Rs. 27,692.31) exactly!")

if __name__ == '__main__':
    run_test()
