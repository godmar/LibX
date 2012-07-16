#!/usr/bin/python

import math
import pprint, pickle, sys

# Convert an IP string into a decimal number.
def convertIP(ip):
    return reduce(lambda x, y: 256 * x + y, map(int, ip.split(".")))

# Convert a decimal IP into a string.
def deconvertIP(ip):
    group0 = str((ip // 256 // 256 // 256) % 256)
    group1 = str((ip // 256 // 256) % 256)
    group2 = str((ip // 256) % 256)
    group3 = str(ip % 256)
    return '.'.join([group0, group1, group2, group3])

def ip2cidr(start, end):
    if start > end:
        return []
    max_value = 32
    test_end = start
    temp_start = start
    while temp_start % 2 == 0 and max_value > 0:
        max_value -= 1
        temp_start /= 2
        test_start, test_end = cidr2ip(start, max_value)
        if test_end > end:
            max_value += 1
            test_start, test_end = cidr2ip(start, max_value)
            break
    return [(start, max_value)] + ip2cidr(test_end + 1, end)

def cidr2ip(start, value):
    return start, start + (2 ** (32 - value)) - 1

# Tree structure:
#
# root
# |       \
# 0       1        bit = 31 cidr = 1
# |   \   |   \
# 0   1   0   1    bit = 30 cidr = 2
# | \ | \ | \ | \
# 0 1 0 1 0 1 0 1  bit = 29 cidr = 3
# |\|\|\|\|\|\|\|\
# 0101010101010101 bit = 28 cidr = 4

# Holds the binary tree of CIDR groups.
# The child nodes of a node are in the 0 and 1 values of the dict.
# The editions associated with the CIDR group are in "eds".
# The individual IPs used to store the editions are in "ips".
# The CIDR info of the node is in "tag".
class ipTree():
    def __init__(self):
        self.root = {"tag": "0.0.0.0/0", "ips": set(), "eds": dict()}
        self.stamps = dict()
    
    # Adds an IP to the tree as well as its corresponding edition. Parameters are the decimal IP to be added and the CIDR value and the edition string.
    def addIP(self, cidr_ip, cidr_value, edition, timestamp, source_ip):
        currentNode = self.root
        bit = 31
        currentBitValue = (cidr_ip >> bit) % 2
        currentDecimalIP = 0
        while 1:
            currentDecimalIP += (2 ** bit) * currentBitValue
            try:
                currentNode = currentNode[currentBitValue]
            except KeyError:
                currentNode[currentBitValue] = {"tag": deconvertIP(currentDecimalIP) + "/" + str(32 - bit),
                                                "ips": set(),
                                                "eds": dict()}
                currentNode = currentNode[currentBitValue]
            
            bit -= 1
            if bit < (32 - cidr_value):
                if source_ip not in currentNode["ips"] or edition not in currentNode["eds"]:
                    currentNode["ips"].add(source_ip)
                    currentNode["eds"][edition] = timestamp
                if edition not in self.stamps or self.stamps[edition] < timestamp:
                    self.stamps[edition] = timestamp
                return
            currentBitValue = (cidr_ip >> bit) % 2
    
    # Looks for the decimal IP parameter in the tree. Returns None, None if not found. Returns None, editions if regular IP. Returns cidr value, editions if source IP.
    def inTree(self, ip):
        currentNode = self.root
        bit = 31
        currentBitValue = (ip >> bit) % 2
        startDecimal = 0
        endDecimal = startDecimal + 2 ** (bit + 1)
        found_ips = None
        found_eds = None
        found_cidr = None
        while 1:
            #print("Current node: " + currentNode["tag"] + " " + ",".join(map(str, currentNode["ips"])) + " " + ",".join(currentNode["eds"]))
            #print(ip)
            if ip >= startDecimal and ip < endDecimal and len(currentNode["eds"]) > 0:
                found_ips = currentNode["ips"]
                found_eds = currentNode["eds"]
                found_cidr = 31 - bit
            try:
                currentNode = currentNode[currentBitValue]
            except KeyError:
                return found_ips, found_eds, found_cidr
            startDecimal += (2 ** bit) * currentBitValue
            endDecimal = startDecimal + 2 ** (bit + 1)
            if bit < 0:
                return found_ips, found_eds, found_cidr
            bit -= 1
            if bit >= 0:
                currentBitValue = (ip >> bit) % 2
    
    # Use pretty print to dump the tree.
    def printTree(self):
        pp = pprint.PrettyPrinter(indent=0)
        pp.pprint(self.root)

    # Trace an IP address throughout the tree.
    def trace(self, ip):
        print('Beginning trace of ' + str(ip) + ' (' + deconvertIP(ip) + ')')
        currentNode = self.root
        bit = 31
        currentBitValue = (ip >> bit) % 2
        currentIP = 0
        while 1:
            print("Current level: " + currentNode["tag"])
            if "ips" in currentNode:
                print("IPs: " + str(currentNode["ips"]))
                print("Editions: " + ", ".join(list(currentNode["eds"])))
            try:
                currentNode = currentNode[currentBitValue]
            except KeyError:
                print("End of trace")
                return
            if currentBitValue == 1:
                currentIP += 2 ** bit
            bit -= 1
            if bit >= 0:
                currentBitValue = (ip >> bit) % 2

    # all_nodes: Total number of nodes in the tree.
    # cidr_nodes: Total number of nodes with CIDR data.
    # node_levels: How many CIDR nodes are supersets of this CIDR node.
    # snode_ips: Number of source IPs in a single node.
    # snode_eds: Number of editions in a single node.
    # uni_ips: The source IPs.
    # uni_eds: The editions.
    # most_eds_cidr: The CIDR group with the most editions.
    # most_eds_count: The number of editions in that group.
    def stats(self):
        all_nodes = 0
        cidr_nodes = 0
        node_levels = {}
        snode_ips = {}
        snode_eds = {}
        uni_ips = set()
        most_eds_cidr = ""
        most_eds_count = 0
        for node, level in nodes(self.root, 0):
            all_nodes += 1
            if len(node["ips"]) > 0:
                cidr_nodes += 1
                if level not in node_levels:
                    node_levels[level] = 0
                node_levels[level] += 1
                if len(node["ips"]) not in snode_ips:
                    snode_ips[len(node["ips"])] = 0
                snode_ips[len(node["ips"])] += 1
                if len(node["eds"]) not in snode_eds:
                    snode_eds[len(node["eds"])] = 0
                snode_eds[len(node["eds"])] += 1
            uni_ips |= node["ips"]
            if len(node["eds"]) > most_eds_count:
                most_eds_cidr = node["tag"]
                most_eds_count = len(node["eds"])
        print("Total number of nodes in the tree: " + str(all_nodes))
        print("Total number of CIDR groups: " + str(cidr_nodes))
        print("Node levels: " + str(node_levels))
        #print("IPs in a single node: " + str(snode_ips))
        #print("Editions in a single node: " + str(snode_eds))
        print("Total number of unique source IPs: " + str(len(uni_ips)))
        print("CIDR group " + most_eds_cidr + " has " + str(most_eds_count) + " editions.")

# DFS search against the provided node.
def nodes(node, level):
    yield node, level
    if len(node["ips"]) > 0:
        level += 1
    if 0 in node:
        for child, clevel in nodes(node[0], level):
            yield child, clevel
    if 1 in node:
        for child, clevel in nodes(node[1], level):
            yield child, clevel

if __name__ == "__main__":
    from getopt import getopt
    options, args = getopt(sys.argv[1:], "t:q:pr:a")
    for opt, arg in options:
        if opt == '-t':
            print "Reading tree from", arg
            treefile = open(arg, "rb")
            tree = pickle.load(treefile)
            treefile.close()

        if opt == '-p':
            tree.printTree()

        if opt == '-q':
            eset = tree.inTree(convertIP(arg))
            if not eset:
                print arg, "not found in tree"
            else:
                print arg, "->", eset

        if opt == '-r':
            tree.trace(convertIP(arg))

        if opt == '-a':
            tree.stats()

