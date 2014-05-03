NMS.js
======

Open source network management sytem single-page application (SPA).


Solution Stack Requirements:
* [jquery](http://jquery.com/)
* [node.js](http://nodejs.org/) -- v0.8.7 or newer
* [ssh2](https://github.com/mscdex/ssh2)
* [socket.io](https://github.com/LearnBoost/socket.io)
* [socket.io-client](https://github.com/LearnBoost/socket.io-client)
* [express.io](https://github.com/techpines/express.io)
* [bone.io](https://github.com/techpines/bone.io)
* [term.js](https://github.com/chjj/term.js)
* [net-ping](https://npmjs.org/package/net-ping/)
* [snmp-native](https://github.com/calmh/node-snmp-native)
* [node-tftp](https://github.com/PrimeEuler/NMS.js/tree/master/tools/tftp/node-tftp-master)
* [syslog.js](https://github.com/PrimeEuler/NMS.js/tree/master/tools/syslog)
* [ShellServer](https://github.com/PrimeEuler/NMS.js/tree/master/tools/shellserver)
* [mib.js](https://github.com/PrimeEuler/NMS.js/tree/master/tools/SNMP)

Tools:
```bash
MIB: parser/browser/compiler.
SNMP: walk/trap.
SYSLOG: winston plugin/ daily file rotation.
TFTP: configuration backups tiggered from SNMP trap.
SHELL SERVER: ping/trace/ssh/telnet.
```
ToDo:
```bash
much....
```
Demo:
*[nms](http://nms.hopto.org:8080/) -- runing on a BeagleBone Black

