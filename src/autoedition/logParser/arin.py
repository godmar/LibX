import re

from twisted.internet import reactor
from twisted.web.client import getPage

from ipTree import *

def sendRequest(ip, edition, timestamp, processor, index):
    decimalIP = convertIP(ip)
    urlToGet = "http://whois.arin.net/rest/ip/" + ip + ".txt"
    print(urlToGet)
    request = getPage(urlToGet)
    request.addCallback(finishRequest, decimalIP, edition, timestamp, processor, index)

def finishRequest(output, decimalIP, edition, timestamp, processor, index):
    print("Callback called with " + deconvertIP(decimalIP) + " " + edition)

    # We need to figure out the CIDR group to use, not an easy task. Some queries return multiple groups, and not all cover the called IP. We find the CIDR group that covers the called IP and that covers the most IPs in total.

    # An example of a WHOIS entry returned by ARIN.
    exampleWhois = """
NetRange:       198.82.0.0 - 198.82.255.255
CIDR:           198.82.0.0/16
OriginAS:       AS1312
NetName:        VPI-BLK
NetHandle:      NET-198-82-0-0-1
Parent:         NET-198-0-0-0-0
NetType:        Direct Assignment
Comment:        DMCA and copyright complaints to DMCA@vt.edu.
RegDate:        1993-09-23
Updated:        2010-04-20
Ref:            http://whois.arin.net/rest/net/NET-198-82-0-0-1
"""

    cidrSplit = re.split("CIDR: *", output)
    cidrLine = cidrSplit[1].split('\n')
    ipList = cidrLine[0].split(', ')
    processor.arin_slots[index] = []
    for ip in ipList:
        newIP, newValue = ip.split("/")
        newValue = int(newValue)
        newStart = convertIP(newIP)
        processor.arin_slots[index].append((newStart, newValue))
    for current_ip, current_value in processor.arin_slots[index]:
        print(deconvertIP(current_ip) + "/" + str(current_value))
    processor.check_slot(index, decimalIP, edition, timestamp)

