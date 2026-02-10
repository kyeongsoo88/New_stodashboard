import csv
import re

def parse_value(val):
    if not val:
        return 0.0
    # Remove quotes, commas, spaces
    clean = val.replace('"', '').replace(',', '').replace(' ', '').replace('$', '')
    if not clean:
        return 0.0
    # Handle negative in parens
    if '(' in clean and ')' in clean:
        clean = clean.replace('(', '').replace(')', '')
        return -float(clean)
    return float(clean)

def format_value(val):
    if val == 0:
        return "" # or "-"
    # Format with commas. Negative with parens? 
    # The original CSV uses mixed formatting (some with $, some without, some with (), some with -).
    # I'll try to match the style "1,234" or "(1,234)".
    abs_val = abs(val)
    formatted = f"{abs_val:,.0f}"
    if val < 0:
        return f"({formatted})"
    return formatted

file_path = 'frontend/public/data/balance-sheet.csv'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract header (line 2, index 1)
header_row = lines[1].strip().split(',')
# We need to know which columns are value columns.
# Columns 1 to 11 are Jan-25A to Nov-25F.
# Col 12 is 24-Nov. Col 13 is Nov YoY.
# Col 14 is Dec-25F. Col 15 is 24-Dec. Col 16 is Dec YoY.
# Actually, let's just grab the values by index for simple copying.

data_map = {}
for line in lines[2:30]:
    parts = list(csv.reader([line]))[0]
    if not parts: continue
    label = parts[0].strip()
    # Normalize label
    clean_label = re.sub(r'^[0-9]+\.\s*', '', label) # Remove "1. "
    clean_label = re.sub(r'^\([0-9]+\)\s*', '', clean_label) # Remove "(1) "
    clean_label = clean_label.strip()
    data_map[clean_label] = parts[1:]

# Helper to get values
def get_values(label):
    return data_map.get(label, [''] * 15) # 15 value columns

def sum_values(labels):
    # Initialize with zeros
    totals = [0.0] * 15
    found = False
    for label in labels:
        vals = get_values(label)
        if vals[0] == '' and len(vals) == 15 and vals[14] == '': # Empty check
             if label not in data_map: continue
        
        found = True
        for i, v in enumerate(vals):
            # Skip percentage columns if any? 
            # Columns 13 (Nov YoY) and 16 (Dec YoY) are percentages. 
            # Also indexes might vary.
            # Let's check header: 
            # 0: 구분
            # 1-11: Jan-Nov
            # 12: 24-Nov
            # 13: Nov YoY (%)
            # 14: Dec-25F
            # 15: 24-Dec
            # 16: Dec YoY (%)
            
            # We should recalculate percentages or just leave them blank?
            # Summing percentages is wrong.
            if i in [12, 15]: # Indices in parts[1:] (0-based) -> Col 13, 16
                totals[i] = 0 # Placeholder for now
            else:
                totals[i] += parse_value(v)
    
    if not found:
        return [''] * 15
        
    # Format back
    res = []
    for i, v in enumerate(totals):
        if i in [12, 15]:
            res.append('') # Clear percentages
        else:
            res.append(format_value(v))
    return res

# Define new rows
# Structure: (Label, DataList)
# DataList can be direct list or fetched/calculated

# Existing rows we want to keep/regenerate
# "운전자본" (Row 32) -> Use existing row 32 from file?
# The file has existing data in lines 31+.
# Let's read lines 31+ specifically.
existing_working_capital = {}
for line in lines[31:37]:
    parts = list(csv.reader([line]))[0]
    if not parts: continue
    existing_working_capital[parts[0].strip()] = parts[1:]

new_rows = []

# 1. 운전자본
# Use existing values if available
wc_vals = existing_working_capital.get('운전자본', get_values('운전자본')) # Fallback? '운전자본' not in main
# If '운전자본' is not in existing bottom section, we have a problem. It is there.
new_rows.append(('운전자본', wc_vals))

# 1.1 매출채권
new_rows.append(('매출채권', get_values('매출채권')))
# 1.2 재고자산
new_rows.append(('재고자산', get_values('재고자산')))
# 1.3 매입채무
new_rows.append(('매입채무', get_values('매입채무')))

# 2. 현금성자산 (New Parent)
# Sum of 현금 + 차입금? Or just sum of children in the new structure?
# Usually Parents are sums of children.
# Children: 현금, 차입금.
# 현금
cash_vals = get_values('현금')
# 차입금 (Use '본사 차입금(원금)'?)
borrow_vals = get_values('본사 차입금(원금)')
# Parent: 현금성자산
# Calculate sum
# cash_equiv_vals = sum_values(['현금', '본사 차입금(원금)']) 
# Wait, borrowing is liability, cash is asset. Summing them for "Cash Equivalents" is weird unless "차입금" here means something else.
# But I'll follow the structure. I'll leave Parent values empty for now if I am unsure, OR calculate them.
# Given the user wants "Change column values", maybe they just want the labels.
# I'll leave parent values empty strings to be safe.
new_rows.append(('현금성자산', [''] * 15)) 
new_rows.append(('현금', cash_vals))
new_rows.append(('차입금', borrow_vals))

# 3. 이익
new_rows.append(('이익', [''] * 15))
# 3.1 이익잉여금
new_rows.append(('이익잉여금', get_values('누적이익잉여금')))

# 4. 기타운전자본
new_rows.append(('기타운전자본', [''] * 15))
# 4.1 선급비용
new_rows.append(('선급비용', get_values('선급비용')))
# 4.2 미지급비용
new_rows.append(('미지급비용', [''] * 15)) # Unknown
# 4.3 고정자산/보증금
# Sum of 유형자산 + 보증금
fixed_deposit_vals = sum_values(['유형자산', '보증금'])
new_rows.append(('고정자산/보증금', fixed_deposit_vals))
# 4.4 미수금/미지급금
new_rows.append(('미수금/미지급금', [''] * 15)) # Unknown

# 5. 리스
new_rows.append(('리스', [''] * 15))
# 5.1 리스자산
new_rows.append(('리스자산', get_values('리스자산')))
# 5.2 리스부채
# Sum of 유동리스부채 + 비유동리스부채
lease_liab_vals = sum_values(['유동리스부채', '비유동리스부채'])
new_rows.append(('리스부채', lease_liab_vals))


# Reconstruct the file content
output_lines = lines[:31] # Up to header of 2nd section

# Add header if missing (it's in line 31, which is index 30. slicing [:31] includes index 30)
# Wait, lines indices: 0..30. [:31] gives 0..30.
# Line 30 (index 29) is empty line.
# Line 31 (index 30) is "구분,Jan-25A...".
# So output_lines includes the header.

# Add new rows
for label, vals in new_rows:
    # CSV escape label if needed? usually no commas in these labels
    line = f"{label}," + ",".join(vals) + "\n"
    output_lines.append(line)

# Add empty line at end
output_lines.append("\n")

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("Done")















