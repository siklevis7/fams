import json
with open(r'C:\Users\FH\.gemini\antigravity\brain\63e8173b-214d-4934-852a-543307055ce9\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' and 'syllabus' in data.get('content', '').lower():
                print(data['content'])
        except: pass
