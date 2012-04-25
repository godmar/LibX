# Convert an IP string into a decimal number.
def convertIP(ip):
    return reduce(lambda x, y: 256 * x + y, map(int, ip.split(".")))

# Holds the binary tree of CIDR groups.
class ipTree():
    def __init__(self):
        self.root = {}
        self.numIPs = 0
    
    # Adds an IP to the tree as well as its corresponding edition. Parameters are the decimal IP to be added and the CIDR value and the edition string.
    def addIP(self, ip, cidr, edition):
        currentNode = self.root
        bit = 31
        currentBitValue = (ip >> bit) % 2
        while 1:
            try:
                currentNode = currentNode[currentBitValue]
            except KeyError:
                currentNode[currentBitValue] = {}
                currentNode = currentNode[currentBitValue]
            
            bit -= 1
            if bit < (32 - cidr):
                if "ip" not in currentNode:
                    currentNode["ip"] = ip
                    self.numIPs += 1
                if "editions" not in currentNode:
                    currentNode["editions"] = set()
                currentNode["editions"].add(edition)
                return
            currentBitValue = (ip >> bit) % 2
    
    # Takes a decimal IP and returns a set of editions or False depending on if the IP is in the tree.
    def inTree(self, ip):
        currentNode = self.root
        bit = 31
        currentBitValue = (ip >> bit) % 2
        while 1:
            try:
                currentNode = currentNode[currentBitValue]
            except KeyError:
                return False
            
            bit -= 1
            if "ip" in currentNode:
                return currentNode["editions"]
            if bit < 0:
                return False
            currentBitValue = (ip >> bit) % 2
    
    # Use pretty print to dump the tree.
    def printTree(self):
        pp = pprint.PrettyPrinter(indent=0)
        pp.pprint(self.root)
