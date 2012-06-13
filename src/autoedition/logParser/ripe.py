import json
import math

from twisted.internet import reactor
from twisted.web.client import getPage

from ipTree import *

def sendRequest(ip, edition, timestamp, processor, index):
    decimalIP = convertIP(ip)
    urlToGet = "http://apps.db.ripe.net/whois/search?type-filter=inetnum&source=ripe&query-string=" + ip
    print(urlToGet)
    request = getPage(urlToGet, headers={"Accept": "application/json"})
    request.addCallback(finishRequest, decimalIP, edition, timestamp, processor, index)

def finishRequest(output, decimalIP, edition, timestamp, processor, index):
    print("Callback called with " + deconvertIP(decimalIP) + " " + edition)

    json_data = json.loads(output)
    processor.ripe_slots[index] = []
    for whois_object in json_data['whois-resources']['objects']['object']:
        if whois_object['type'] == 'inetnum':
            whois_ips = whois_object['primary-key']['attribute']['value'].split(" - ")
            whois_start = convertIP(whois_ips[0])
            whois_end = convertIP(whois_ips[1])
            whois_values = ip2cidr(whois_start, whois_end)
            processor.ripe_slots[index].extend(whois_values)
    processor.check_slot(index, decimalIP, edition, timestamp)

