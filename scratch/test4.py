import urllib.request
import json

url = "http://localhost:8000/sessions/start"
data = json.dumps({"username": "test_user", "job_role": "swe", "experience_level": "Beginner"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Success:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Error Code:", e.code)
    print("Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Exception:", str(e))
