#!/usr/bin/python

from getopt import getopt
import pickle
import pprint
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
        secondLine = requestOutput.partition("\n")[2].partition("\n")[0]
        cidrLine = secondLine[16:]
        cidrIP = ""
        cidrValue = 64
        cidrPartition = ['', '', cidrLine]
        while cidrPartition[2] is not "":
            cidrPartition = cidrPartition[2].partition("/")
            newIP = cidrPartition[0]
            cidrPartition = cidrPartition[2].partition(", ")
            newValue = int(cidrPartition[0])
            newStart = convertIP(newIP)
            newEnd = newStart + 2 ** (32 - newValue)
            if newValue < cidrValue and decimalIP >= newStart and decimalIP < newEnd:
                cidrIP = newIP
                cidrValue = newValue
        print(cidrIP + "/" + str(cidrValue))
        self.tree.addIP(convertIP(cidrIP), cidrValue, edition)
        self.numRequestsIdle += 1
        
        # Now we process a new request.
        if len(self.ips) > 0:
            newIP, newEdition = self.ips.pop(0)
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
for currentLine in logFile:
    currentLineEdition = currentLine[:currentLine.index(" ")]
    currentLineIPs = currentLine[currentLine.index(" ") + 1:]
    currentLineSplit = currentLineIPs.partition(" ")
    firstIP = currentLineSplit[0]
    while "\n" not in firstIP:
        if tree.inTree(convertIP(firstIP)) is False:
            processor.ips.append((firstIP, currentLineEdition))
        currentLineSplit = currentLineSplit[2].partition(" ")
        firstIP = currentLineSplit[0]
    if tree.inTree(convertIP(firstIP)) is False:
        processor.ips.append((firstIP[:-1], currentLineEdition))

# Process the IPs.
processor.start()

# Save the tree back to the file.
pickle.dump(tree, open(treeFile, "wb"))
print("Saving tree with " + str(tree.numIPs) + " IP addresses stored.")
