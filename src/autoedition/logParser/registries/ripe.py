import json
import math

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

    json_data = json.loads(output)
    result = None
    for whois_object in json_data['whois-resources']['objects']['object']:
        if whois_object['type'] == 'inetnum':
            whois_ips = whois_object['primary-key']['attribute']['value'].split(" - ")
            whois_start = convertIP(whois_ips[0])
            whois_end = convertIP(whois_ips[1])
            whois_values = ip2cidr(whois_start, whois_end)
            result = []
            result.append(whois_start)
            result.append(whois_end)
            result.extend(whois_values)
    callback(ip, result, 'ripe')

