import os
import re

def check_php_syntax():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    errors = []

    for root, _, files in os.walk(root_dir):
        if 'node_modules' in root or '.git' in root:
            continue
        for f in files:
            if f.endswith('.php'):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                    
                    # Check for misplaced dots after comment blocks
                    if re.search(r'\*/\s*\.', content):
                        errors.append(f"Dot after comment block in {path}")
                    
                    # Check matching braces
                    open_b = content.count('{')
                    close_b = content.count('}')
                    if open_b != close_b:
                        errors.append(f"Brace mismatch ({open_b} open vs {close_b} close) in {path}")

    if errors:
        print("Lint Errors Found:")
        for err in errors:
            print(f" - {err}")
    else:
        print("All PHP files passed basic structural lint checks cleanly!")

if __name__ == '__main__':
    check_php_syntax()
