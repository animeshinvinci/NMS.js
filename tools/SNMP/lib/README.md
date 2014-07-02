mib.js
======
What is mib.js?:
======
mib.js is an open-source SNMP MIB parser (or SMI parser) written in JavaScript. 
It can be used to read SNMP MIB files as well as simple ASN.1 files. mib.js is 
distributed as a JavaScript library to make it possible to include it in your 
applications. You can think of it as a Javascript version of [Mibble](http://www.mibble.org/).
What does mib.js contain?
=======
The mib.js library contains classes for easy access to all the information in 
the MIB file, including OIDs, type data and descriptions. It stores the JSON 
formatted data in  in memory to allow quick access and lookup.
A couple of useful applications are also bundled with mib, among them a MIB 
browser. The browser provides MIB validation and also includes a simple SNMP 
manager.
A note on SNMP
========
Please note that mib.js is not an SNMP stack. You can use mib.js together with
[snmp-native](https://github.com/calmh/node-snmp-native). Other libraries have
been used such as [snmpjs](https://github.com/joyent/node-snmpjs).
MIB files
========
A default set of MIB files are loaded by the LoadMIBs() function. The files are stored in the  [RFC_BASE_MINIMUM](https://github.com/PrimeEuler/NMS.js/tree/master/tools/SNMP/RFC_BASE_MINIMUM) directory.
