import os
import re

dir_path = r'c:\Users\FH\Documents\fams\frontend\src\components'

for file_name in os.listdir(dir_path):
    if not file_name.endswith('.jsx'): continue
    file_path = os.path.join(dir_path, file_name)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Fix the trailing single quote issue
    # We are looking for: fetch(`${API_BASE}/api/... '
    # Replacing it with: fetch(`${API_BASE}/api/... `
    content = re.sub(r"fetch\(`\$\{API_BASE\}/api/([^']*)'", r"fetch(`${API_BASE}/api/\1`", content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Repaired {file_name}')
