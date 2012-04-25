#!/usr/bin/python
import MySQLdb, sys

# connect
# ALERT - please don't expose!
db = MySQLdb.connect(host="localhost", user="root", passwd="sqlroot", db="libxeb")

cursor = db.cursor()

# execute SQL select statement
cursor.execute("""
    SELECT editionInfo.editionId, editionInfo.shortDesc, GROUP_CONCAT(editionMaintainer.email separator ', ')
       FROM editionInfo INNER JOIN editionMaintainer
         ON editionInfo.editionId = editionMaintainer.editionId
       WHERE editionInfo.isPublic = 1 AND editionInfo.editionId = %s
""", sys.argv[1])

# get the number of rows in the resultset
numrows = int(cursor.rowcount)

print "got", numrows

# get and display one row at a time
#for x in range(0, numrows):
#    row = cursor.fetchone()
#    print row

for row in cursor:
    print row

