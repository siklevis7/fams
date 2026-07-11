import os
import re

dir_path = r'c:\Users\FH\Documents\fams\frontend\src\components'

for file_name in os.listdir(dir_path):
    if not file_name.endswith('.jsx'): continue
    file_path = os.path.join(dir_path, file_name)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # 1. Fix the `Authorization' damage
    content = content.replace("`Authorization':", "'Authorization':")
    
    # 2. Fix the fetch calls that look like fetch(`${API_BASE}/api/bookings/', {
    # We want them to be fetch(`${API_BASE}/api/bookings/`, {
    content = re.sub(r"fetch\(`\$\{API_BASE\}/api/([a-zA-Z0-9_\-/]*)',\s*\{", r"fetch(`${API_BASE}/api/\1`, {", content)
    
    # 3. What if it had no trailing comma/brace?
    content = re.sub(r"fetch\(`\$\{API_BASE\}/api/([a-zA-Z0-9_\-/]*)'\)", r"fetch(`${API_BASE}/api/\1`)", content)
    
    # Let's fix anything that looks like: fetch(`${API_BASE}/api/...`...
    # Actually, the regex I ran in `repair.py` was:
    # content = re.sub(r"fetch\(`\$\{API_BASE\}/api/([^']*)'", r"fetch(`${API_BASE}/api/\1`", content)
    # This means anything from `/api/` to the first `'` was captured, and the `'` was replaced with `` ` ``.
    
    # If the first `'` was `'Authorization'`, then the string became:
    # fetch(`${API_BASE}/api/users/`, { headers: { `
    
    # I replaced `Authorization': with 'Authorization': above.
    
    # What about fetch(`${API_BASE}/api/users/me', { ?
    # It had no `'Authorization'`. It was `fetch(`${API_BASE}/api/users/me', {`
    # After repair.py, it became `fetch(`${API_BASE}/api/users/me`, {` which is PERFECT.
    
    # Let's just fix `Content-Type' if it got mangled.
    content = content.replace("`Content-Type':", "'Content-Type':")
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {file_name}')
