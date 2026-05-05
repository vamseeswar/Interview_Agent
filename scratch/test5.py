import urllib.request
try:
    print(urllib.request.urlopen("http://localhost:8000/openapi.json").read().decode('utf-8')[:100])
except Exception as e:
    print("Exception:", str(e))
