#!/usr/bin/python

import copy
import imp
import MySQLdb
import os
import pickle
import time
import sys, re, json, urllib

# add directory in which script is located to python path
script_dir = "/".join(__file__.split("/")[:-1])
if script_dir == "":
    script_dir = "."
script_dir += "/logParser"
if script_dir not in sys.path:
    sys.path.append(script_dir)
import ipTree
from dbAccess import dbAccessCredentials

editionpath = "/home/www/libx.org/editions";

def isLive(editionid):
    if editionid[0] < 'a':
        editionid = "%s/%s/%s" % (editionid[:2], editionid[2:4], editionid)
        
    return os.path.lexists(editionpath + "/" + editionid)

def isoncampus(ip):
    iplist = open(os.path.dirname(__file__) + "/vtips.txt")
    for line in iplist:
        ips = line.split("-")
        start = ipTree.convertIP(ips[0].rstrip())
        end = ipTree.convertIP(ips[1].rstrip())
        if ip >= start and ip <= end:
            return True
    return False

pathinfoformat = re.compile('/([^/]*)/(.*)')

tree = None
tree_mod = 0

#
# Callable 'application' is the WSGI entry point
#
def application(env, start_response):
    global tree
    global tree_mod

    # get QUERY parameters
    params = dict([(urllib.unquote_plus(k), urllib.unquote_plus(v))
        for k, v in [kv.strip().split('=', 1) \
                     for kv in env['QUERY_STRING'].split('&') if '=' in kv]])

    m = pathinfoformat.match(env['PATH_INFO'])
    (type, urlIP) = m.groups()
    ip = env['REMOTE_ADDR']
    if 'ip' in params:
        ip = params['ip']
    if urlIP != "":
        ip = urlIP

    new_mod = os.path.getmtime(os.path.dirname(__file__) + '/logParser/treetest.bin')
    if new_mod > tree_mod:
        tree = pickle.load(open(os.path.dirname(__file__) + '/logParser/treetest.bin', "rb"))
        tree_mod = new_mod
    ips, eds, cidr = tree.inTree(ipTree.convertIP(ip))
    if isoncampus(ipTree.convertIP(ip)):
        eds = {'vt': 0}

    try:
        db = MySQLdb.connect(**dbAccessCredentials)
        cursor = db.cursor()
        editionData = []
        raw = ""
        for edition, timestamp in eds.items():
            if edition in tree.stamps:
                timestamp = tree.stamps[edition]
            raw += edition + " "
            cursor.execute("""
            SELECT editionId, shortDesc
                FROM editionInfo
                WHERE isPublic = 1 AND editionId = %s
            """, edition)
            for row in cursor:
                raw += "hit "
                editionId, shortDesc = row
                if isLive(editionId):
                    editionData.append({'id': editionId, 'description': shortDesc, 'timestamp': timestamp})

        for edition in editionData:
            cursor.execute("""
            SELECT email
                FROM editionMaintainer
                WHERE editionId = %s
            """, edition['id'])
            edition['maintainers'] = []
            for row in cursor:
                edition['maintainers'].append(row[0])
    except BaseException as ex:
        start_response("200 OK", [('Content-Type', 'text/plain;charset=latin-1'), ('Cache-Control', 'max-age=1,must-revalidate')]);
        return ['Error: ' + str(ex)]
    finally:
        db.close();

    dummyanswerobject = {
        'ip': ip,
        'tree_mod': time.strftime("%Y %m %d %H:%M:%S", time.gmtime(tree_mod)),
        'editions': editionData,
        'raw': raw,
    }
    headers = [('Content-Type', 'application/javascript;charset=latin-1'), \
               ('Cache-Control', 'max-age=1,must-revalidate')]

    body = json.dumps(dummyanswerobject, encoding="latin-1")
    if params.has_key('callback'):
        body = params.get('callback') + "(" + body + ");"
    start_response("200 OK", headers)
    return [body]

if __name__ == '__main__':
    print "you invoked me with", sys.argv
