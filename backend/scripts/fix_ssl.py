# save as fix_ssl.py and run it once
import ssl
import certifi
import urllib.request

ssl._create_default_https_context = ssl.create_default_context
print("SSL context:", ssl.get_default_verify_paths())
print("Certifi path:", certifi.where())
