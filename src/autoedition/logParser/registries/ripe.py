import json
import math
import sys

from twisted.internet import reactor
from twisted.web.client import getPage

from ipTree import *

def sendRequest(ip, callback):
    decimalIP = convertIP(ip)
    urlToGet = "http://apps.db.ripe.net/whois/search?type-filter=inetnum&source=ripe&query-string=" + ip
    print(urlToGet)
    request = getPage(urlToGet, headers={"Accept": "application/json"})
    request.addCallback(finishRequest, ip, callback)
    request.addErrback(network_error, ip, callback)

def network_error(error, ip, callback):
    print("Error getting RIPE info")
    print(str(error))
    callback(ip, None, 'ripe')

def finishRequest(output, ip, callback):
    print("RIPE callback called with " + ip)

    result = None
    try:
        json_data = json.loads(output)
        for whois_object in json_data['whois-resources']['objects']['object']:
            if whois_object['type'] == 'inetnum':
                whois_ips = whois_object['primary-key']['attribute']['value'].split(" - ")
                whois_start = convertIP(whois_ips[0])
                whois_end = convertIP(whois_ips[1])
                whois_values = ip2cidr(whois_start, whois_end)
                result = {}
                result['start'] = whois_start
                result['end'] = whois_end
                result['cidrs'] = whois_values
    except:
        print("Error occurred in RIPE callback: " + sys.exc_info()[0])
        result = None
    finally:
        print("Calling back from RIPE")
        callback(ip, result, 'ripe')

