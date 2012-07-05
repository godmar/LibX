#!/usr/bin/python

from getopt import getopt
import pickle
import sys
from twisted.internet import reactor

from ipTree import *

import arin
import ripe

# IPs to query against WHOIS are added to the self.ips variable. When start() is called, the Twisted Reactor starts and processes the IPs in parallel.
class ipProcessor():
    def __init__(self, num_requests, tree):
        self.num_requests = num_requests
        self.tree = tree
        self.ips = []
        self.arin_slots = []
        self.ripe_slots = []
    
    # Begin processing the IPs. If the number of IPs is less than the number of parallel requests, we knock down the number of parallel requests to accomodate that.
    def start(self):
        if len(self.ips) < self.num_requests:
            self.num_requests = len(self.ips)
        if self.num_requests is 0:
            return
        for i in range(self.num_requests):
            newIP, newEdition, newTimestamp = self.ips.pop(0)
            self.arin_slots.append(None)
            arin.sendRequest(newIP, newEdition, newTimestamp, self, i)
            self.ripe_slots.append(None)
            ripe.sendRequest(newIP, newEdition, newTimestamp, self, i)
        reactor.run()

    def check_slot(self, index, source_ip, edition, timestamp):
        if self.arin_slots[index] is not None and self.ripe_slots[index] is not None:
            self.refresh(index, source_ip, edition, timestamp)

    def refresh(self, index, source_ip, edition, timestamp):
        all_cidrs = []
        for current in self.arin_slots[index]:
            all_cidrs.append(current)
        for current in self.ripe_slots[index]:
            all_cidrs.append(current)
        for cidr_ip, cidr_value in all_cidrs:
            start, end = cidr2ip(cidr_ip, cidr_value)
            if source_ip >= start and source_ip <= end:
                self.tree.addIP(cidr_ip, cidr_value, edition, timestamp, source_ip)
            else:
                self.tree.addIP(cidr_ip, cidr_value, edition, timestamp, -1)
        self.arin_slots[index] = None
        self.ripe_slots[index] = None
        if len(self.ips) > 0:
            newIP, newEdition, newTimestamp = self.ips.pop(0)
            arin.sendRequest(newIP, newEdition, newTimestamp, self, index)
            ripe.sendRequest(newIP, newEdition, newTimestamp, self, index)
        else:
            for i in range(len(self.arin_slots)):
                if self.arin_slots[i] is None or self.ripe_slots[i] is None:
                    return
            reactor.stop()
            return
    
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
    print("Opening tree.")
    print("--------Printing stats--------")
    tree.stats()
    print("------------------------------")
except IOError:
    tree = ipTree()
    print("Creating new tree.")

# Initialize the tools we will use.
processor = ipProcessor(1, tree)
logFile = open(logFile)

# Iterate over the lines of the log file. If an IP isn't in the tree, we add it to the processor.
processed_ips = set()
processed_eds = set()
new_ips = set()
for line in logFile:
    ipList = line.rstrip().split(" ")
    edition = ipList.pop(0)
    processed_eds.add(edition)
    for block in ipList:
        block_parts = block.split(";")
        ip = block_parts[0]
        timestamp = block_parts[1]
        processed_ips.add(ip)
        ips, eds, cidr = tree.inTree(convertIP(ip))
        if ips is None or convertIP(ip) not in ips:
            processor.ips.append((ip, edition, timestamp))
            new_ips.add(ip)
        elif edition not in eds or eds[edition] < timestamp or edition not in tree.stamps or tree.stamps[edition] < timestamp:
            tree.addIP(convertIP(ip), cidr, edition, timestamp, convertIP(ip))
print("Processing " + str(len(processed_ips)) + " unique IPs.")
print("Processing " + str(len(processed_eds)) + " editions.")
print("Processing " + str(len(new_ips)) + " new IPs.")

# Process the IPs.
processor.start()

# Save the tree back to the file.
pickle.dump(tree, open(treeFile, "wb"))
print("Saving tree.")
print("--------Printing stats--------")
tree.stats()
print("------------------------------")
