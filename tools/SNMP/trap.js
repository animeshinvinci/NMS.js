var snmp = require('snmpjs');
var MIB = new require('./lib/mib');
var util = require('util');
var tl = snmp.createTrapListener();


var mib = new MIB();
mib.LoadMIBs();

mib.WriteToFile();

tl.on('trap', function (msg) {
    console.log(msg.src.address);
    var varbinds = snmp.message.serializer(msg)['pdu']['varbinds']


    mib.DecodeVarBinds(varbinds, function (VarBinds) {
        console.log(VarBinds);
    });

});

tl.bind({ family: 'udp4', port: 162 });

