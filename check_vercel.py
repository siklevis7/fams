import requests
import re
import warnings
warnings.filterwarnings('ignore')

try:
    res = requests.get('https://fams-bay.vercel.app/', verify=False)
    html = res.text
    js_files = re.findall(r'src="(/assets/[^"]+\.js)"', html)
    print('JS files:', js_files)
    
    for js_file in js_files:
        js_url = 'https://fams-bay.vercel.app' + js_file
        js_content = requests.get(js_url, verify=False).text
        
        # Look for http:// or https:// URLs in the JS
        api_urls = re.findall(r'https?://[^\s"\']+', js_content)
        api_urls = set([url for url in api_urls if 'render.com' in url or 'localhost' in url or '127.0.0.1' in url])
        if api_urls:
            print('Found URLs in', js_file, ':', api_urls)
except Exception as e:
    print('Error:', e)
