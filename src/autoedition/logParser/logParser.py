#!/usr/bin/python

from getopt import getopt
import pickle
import pkgutil
import sys
from twisted.internet import reactor


# add directory in which script is located to python path
script_dir = "/".join(__file__.split("/")[:-1])
if script_dir == "":
    script_dir = "."
if script_dir not in sys.path:
    sys.path.append(script_dir)
print("logParser directory: " + script_dir)

from ipTree import *

import registries
registry_list = [name for _, name, _ in pkgutil.iter_modules([script_dir + '/registries'])]
print("logParser will use the following registries: " + ",".join(registry_list))

# IPs to query against WHOIS are added to the self.ips variable. When start() is called, the Twisted Reactor starts and processes the IPs in parallel.
class ipProcessor():
    def __init__(self, num_requests, tree):
        self.num_requests = num_requests
        self.tree = tree
        self.ips = []
        self.results = {}
    
    # Begin processing the IPs. If the number of IPs is less than the number of parallel requests, we knock down the number of parallel requests to accomodate that.
    def start(self):
        if len(self.ips) < self.num_requests:
            self.num_requests = len(self.ips)
        if self.num_requests is 0:
            return
        for i in range(self.num_requests):
            newIP, newEdition, newTimestamp = self.ips.pop(0)
            print("Processing IP " + newIP)
            self.results[newIP] = {'edition': newEdition, 'timestamp': newTimestamp}
            for registry in registry_list:
                getattr(registries, registry).sendRequest(newIP, self.callback)
        reactor.run()

    def callback(self, ip, result, registry):
        self.results[ip][registry] = result
        done = True
        for cur_registry in registry_list:
            if cur_registry not in self.results[ip]:
                done = False
        if done:
            print("All registries for " + ip + " have returned")
            valid = all(result != None for result in self.results[ip].values())
            if valid:
                self.refresh(ip)
            else:
                self.clear(ip)
                
    def refresh(self, ip):
        print("Adding IP " + ip + " to database")
        all_cidrs = []
        valid = True
        for registry1 in registry_list:
            for registry2 in registry_list:
                if registry1 != registry2:
                    start1 = self.results[ip][registry1]['start']
                    end1 = self.results[ip][registry1]['end']
                    start2 = self.results[ip][registry2]['start']
                    end2 = self.results[ip][registry2]['end']
                    if start1 > start2 and end1 > end2:
                        valid = False
        if valid is False:
            print("IP ranges are not disjoint")
        else:
            current_registry = ''
            current_length = 2 ** 32
            for registry in registry_list:
                temp_length = self.results[ip][registry]['end'] - self.results[ip][registry]['start']
                if temp_length < current_length:
                    current_registry = registry
                    current_length = temp_length
            for cidr_ip, cidr_value in self.results[ip][current_registry]['cidrs']:
                start, end = cidr2ip(cidr_ip, cidr_value)
                source_ip = convertIP(ip)
                if source_ip >= start and source_ip <= end:
                    self.tree.addIP(cidr_ip, cidr_value, self.results[ip]['edition'], self.results[ip]['timestamp'], source_ip)
                else:
                    self.tree.addIP(cidr_ip, cidr_value, self.results[ip]['edition'], self.results[ip]['timestamp'], -1)
        self.clear(ip)

    def clear(self, ip):
        del self.results[ip]
        if len(self.ips) > 0:
            newIP, newEdition, newTimestamp = self.ips.pop(0)
            print("Processing IP " + newIP)
            self.results[newIP] = {'edition': newEdition, 'timestamp': newTimestamp}
            for registry in registry_list:
                getattr(registries, registry).sendRequest(newIP, self.callback)
        elif len(self.results) == 0:
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
