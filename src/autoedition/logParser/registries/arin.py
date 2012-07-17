import re

from twisted.internet import reactor
from twisted.web.client import getPage

from ipTree import *

def sendRequest(ip, callback):
    decimalIP = convertIP(ip)
    urlToGet = "http://whois.arin.net/rest/ip/" + ip + ".txt"
    print(urlToGet)
    request = getPage(urlToGet)
    request.addCallback(finishRequest, ip, callback)
    request.addErrback(network_error, ip, callback)

def network_error(error, ip, callback):
    print("Error getting ARIN info")
    print(str(error))
    callback(ip, None, 'arin')

def finishRequest(output, ip, callback):
    decimalIP = convertIP(ip)
    print("ARIN callback called with " + ip)

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

    rangeSplit = re.split("NetRange: *", output)
    rangeLine = rangeSplit[1].split('\n')
    ips = rangeLine[0].split(' - ')
    result = []
    result.append(convertIP(ips[0]))
    result.append(convertIP(ips[1]))

    cidrSplit = re.split("CIDR: *", output)
    cidrLine = cidrSplit[1].split('\n')
    ipList = cidrLine[0].split(', ')
    for current_ip in ipList:
        newIP, newValue = current_ip.split("/")
        newValue = int(newValue)
        newStart = convertIP(newIP)
        result.append((newStart, newValue))
    #for current_ip, current_value in result[2:]:
    #    print(deconvertIP(current_ip) + "/" + str(current_value))
    callback(ip, result, 'arin')

