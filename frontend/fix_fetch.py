import os
import re

dir_path = r'c:\Users\FH\Documents\fams\frontend\src\components'

for file_name in os.listdir(dir_path):
    if not file_name.endswith('.jsx'): continue
    file_path = os.path.join(dir_path, file_name)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Replace fetch('/api/...') with fetch(`${API_BASE}/api/...`)
    content = re.sub(r"fetch\('/api/", r"fetch(`${API_BASE}/api/", content)
    
    # Also handle string interpolations if any like fetch(`/api/${id}`)
    content = re.sub(r"fetch\(`/api/", r"fetch(`${API_BASE}/api/", content)
    
    if content != original:
        # Check if API_BASE is imported
        if 'API_BASE' not in content:
            # Insert import after the last import statement
            imports_end = [m.end() for m in re.finditer(r'^import .*?;?\n', content, re.MULTILINE)]
            if imports_end:
                idx = max(imports_end)
                content = content[:idx] + "import { API_BASE } from '../config';\n" + content[idx:]
            else:
                content = "import { API_BASE } from '../config';\n" + content
                
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file_name}')
