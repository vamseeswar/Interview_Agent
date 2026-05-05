import urllib.request
try:
    print(urllib.request.urlopen("http://localhost:8000/sessions/1/history").read().decode('utf-8'))
except Exception as e:
    print("Exception:", str(e))
