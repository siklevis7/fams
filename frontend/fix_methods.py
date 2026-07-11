import os

dir_path = r'c:\Users\FH\Documents\fams\frontend\src\components'

for file_name in os.listdir(dir_path):
    if not file_name.endswith('.jsx'): continue
    file_path = os.path.join(dir_path, file_name)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    content = content.replace("method: `POST',", "method: 'POST',")
    content = content.replace("method: `PUT',", "method: 'PUT',")
    content = content.replace("method: `PATCH',", "method: 'PATCH',")
    content = content.replace("method: `DELETE',", "method: 'DELETE',")
    content = content.replace("method: `GET',", "method: 'GET',")
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed method quotes in {file_name}')
