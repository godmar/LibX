
Setup - based on experience setting LibX up on a Ubuntu 14.04 LTS.

Install apache2, then the following changes were needed:
    - enable modules userdir and headers (a2enmod)

Install php5.
    - make sure 'short_open_tag is On' in /etc/php5/apache2/php.ini
      check for duplicate occurrences
    - make sure /etc/apache2/mods-enabled/php5.conf does not disable
      PhP for user directories (check that no php_admin_flag engine Off is active)

Always restart apache after config changes (sudo service apache2 restart)

All install commands must be done as superuser with sudo

-------------

node.js and npm and uglifyjs is required.
On Ubuntu, the packages were called 'nodejs' and 'npm'.
Installing this named the node executable nodejs; we needed to put a symlink
sudo ln -s /usr/bin/nodejs /usr/bin/node

To install uglifyjs using npm, do
npm install -g uglify-js
(See http://lisperator.net/uglifyjs/)

------
We also needed to install libxml-libxml-perl to pick up the XML package for perl.

