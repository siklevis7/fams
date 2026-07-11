import urllib.request
import json
import urllib.parse
import ssl

icao = "KATL"

# Fetch METAR
try:
    metar_url = f"https://aviationweather.gov/api/data/metar?ids={icao}&format=json"
    req_metar = urllib.request.Request(metar_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req_metar) as response:
        metar_data = json.loads(response.read().decode())
    print("METAR success:", len(metar_data))
except Exception as e:
    print("METAR error:", e)

# Fetch TAF
try:
    taf_url = f"https://aviationweather.gov/api/data/taf?ids={icao}&format=json"
    req_taf = urllib.request.Request(taf_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req_taf) as response:
        taf_data = json.loads(response.read().decode())
    print("TAF success:", len(taf_data))
except Exception as e:
    print("TAF error:", e)

# Fetch Airport
try:
    airport_url = f"https://aviationweather.gov/api/data/airport?ids={icao}&format=json"
    req_airport = urllib.request.Request(airport_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req_airport) as response:
        airport_data = json.loads(response.read().decode())
    print("Airport success:", len(airport_data))
except Exception as e:
    print("Airport error:", e)

# Fetch NOTAMs
try:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    notam_payload = urllib.parse.urlencode({'searchType': 0, 'designatorsForLocation': icao}).encode()
    req_notam = urllib.request.Request('https://notams.aim.faa.gov/notamSearch/search', data=notam_payload, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req_notam, context=ctx) as response:
        notams_res = json.loads(response.read().decode())
        if 'notamList' in notams_res:
            print("NOTAM success:", len(notams_res['notamList']))
        else:
            print("NOTAM success but no notamList")
except Exception as e:
    print("NOTAM error:", e)
