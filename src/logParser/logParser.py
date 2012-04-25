#!/usr/bin/python

from getopt import getopt
import pickle
import re
import sys
from time import sleep
from twisted.internet import reactor
from twisted.web.client import getPage

from ipTree import *

# Creates the ARIN WHOIS request.
def sendRequest(ip, edition, processor):
    decimalIP = convertIP(ip)
    urlToGet = "http://whois.arin.net/rest/ip/" + ip + ".txt"
    print(urlToGet)
    request = getPage(urlToGet)
    request.addCallback(finishRequest, decimalIP, edition, processor)

# Callback from the WHOIS request.
def finishRequest(output, decimalIP, edition, processor):
    processor.refresh(output, decimalIP, edition)

# IPs to query against WHOIS are added to the self.ips variable. When start() is called, the Twisted Reactor starts and processes the IPs in parallel.
class ipProcessor():
    def __init__(self, numRequests, tree, delay):
        self.numRequests = numRequests
        self.tree = tree
        self.delay = delay
        self.numRequestsIdle = numRequests
        self.ips = []
    
    # Begin processing the IPs. If the number of IPs is less than the number of parallel requests, we knock down the number of parallel requests to accomodate that.
    def start(self):
        if len(self.ips) < self.numRequests:
            self.numRequests = len(self.ips)
            self.numRequestsIdle = self.numRequests
        if self.numRequests is 0:
            return
        for i in range(self.numRequests):
            newIP, newEdition = self.ips.pop(0)
            sendRequest(newIP, newEdition, self)
            self.numRequestsIdle -= 1
        reactor.run()
    
    # Called every time a callback function runs. Processes the finished request, adds a new one, and stops the reactor if we are finished.
    def refresh(self, requestOutput, decimalIP, edition):
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

        cidrSplit = re.split("CIDR: *", requestOutput)
        cidrLine = cidrSplit[1].split('\n')
        ipList = cidrLine[0].split(', ')
        finalIP = ''
        finalValue = 64
        for ip in ipList:
            newIP, newValue = ip.split("/")
            newValue = int(newValue)
            newStart = convertIP(newIP)
            newEnd = newStart + 2 ** (32 - newValue)
            if newValue < finalValue and decimalIP >= newStart and decimalIP < newEnd:
                finalIP = newIP
                finalValue = newValue
        print(finalIP + "/" + str(finalValue))
        self.tree.addIP(convertIP(finalIP), finalValue, edition)
        self.numRequestsIdle += 1
        
        # Now we process a new request.
        while len(self.ips) > 0 and self.numRequestsIdle > 0:
            newIP, newEdition = self.ips.pop(0)
            editionList = tree.inTree(convertIP(newIP))
            if editionList is False or newEdition not in editionList:
                sendRequest(newIP, newEdition, self)
                self.numRequestsIdle -= 1
        
        # If we are out of requests, we stop the reactor and clean up. The main function will then resume.
        if self.numRequestsIdle is self.numRequests and len(self.ips) is 0:
            reactor.stop()
            return
        
        # Delay the program to prevent hitting ARIN servers too hard.
        sleep(self.delay)

optlist, args = getopt(sys.argv[1:], 'l:t:')
treeFile = ''
logFile = ''
for option in optlist:
    flag, arg = option
    if flag == '-t':
        treeFile = arg
    if flag == '-l':
        logFile = arg
if treeFile == '':
    print("Tree file not set.")
    quit()
if logFile == '':
    print("log file not set.")
    quit()

# Open the tree file from tree.bin, and failing that, create a new one.
try:
    tree = pickle.load(open(treeFile, "rb"))
    print("Opening tree with " + str(tree.numIPs) + " IP addresses stored.")
except IOError:
    tree = ipTree()
    print("Creating new tree.")

# Initialize the tools we will use.
processor = ipProcessor(40, tree, 1)
logFile = open(logFile)

# Iterate over the lines of the log file. If an IP isn't in the tree, we add it to the processor.
for line in logFile:
    ipList = line.rstrip().split(" ")
    edition = ipList.pop(0)
    for ip in ipList:
        editionList = tree.inTree(convertIP(ip))
        if editionList is False:
            processor.ips.append((ip, edition))
        elif edition not in editionList:
            startIP, cidrLength = tree.getCIDR(convertIP(ip))
            tree.addIP(convertIP(ip), cidrLength, edition)

# Process the IPs.
processor.start()

# Save the tree back to the file.
pickle.dump(tree, open(treeFile, "wb"))
print("Saving tree with " + str(tree.numIPs) + " IP addresses stored.")
