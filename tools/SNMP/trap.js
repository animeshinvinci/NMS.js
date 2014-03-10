var snmp = require('snmpjs');
var mib = new require('./lib/mib');
var util = require('util');
var tl = snmp.createTrapListener();


var poo = new mib();
poo.LoadMIBs();

poo.GetObject('1.3.6.1.2.1.15.3.1.14', function (Object) {
    console.log(Object);
    Object.OID
});


poo.GetObject('HistoryEventMedium', function (Object) {
    console.log(Object);
    Object.OID
});
poo.GetObject('TEXTUAL-CONVENTION', function (Object) {
    console.log(Object);
    Object.OID
});

//poo.GetSummary(function (summary) {console.log(summary);});

//console.log(JSON.stringify(poo.Modules, null, 4));


tl.on('trap', function (msg) {
    console.log(msg.src.address);
    //console.log(util.inspect(snmp.message.serializer(msg), false, null));
    //console.log(snmp.message.serializer(msg)['pdu']['agent_addr']);
    var varbinds = snmp.message.serializer(msg)['pdu']['varbinds']
    for (var i = 0; i < varbinds.length; i++) {
        //console.log(varbinds[i].oid, varbinds[i].value);
        poo.GetObject(varbinds[i].oid, function (Object) {

            var oo = varbinds[i].oid.replace(Object.OID + '.', "")
            var syntaxValue = varbinds[i].value;
            if (Object.SYNTAX) {
                switch (varbinds[i].typename) {
                    case 'Integer':
                        if (Object.SYNTAX && Object.SYNTAX.INTEGER) {
                            syntaxValue = Object.SYNTAX.INTEGER[varbinds[i].value]
                        }
                        break;
                    case 'ObjectIdentifier':
                        poo.GetObject(varbinds[i].value, function (Object1) {
                            syntaxValue = Object1.ObjectName;
                        });
                        break;
                    case 'OctetString':
                        if (Object.SYNTAX == "OCTET STRING") {
                            var buffstring = "";
                            var delimiter = "."
                            var buf = varbinds[i].value;
                            for (ii = 0; ii < buf.length; ii++) {
                                if (ii == buf.length - 1) { delimiter = ''; }
                                buffstring += buf.readUInt8(ii) + delimiter;
                            }
                            syntaxValue = buffstring;
                        } else {
                            syntaxValue = varbinds[i].string_value
                        }
                        break;
                    default:
                        break;
                }
            }
            //, varbinds[i].typename, Object.SYNTAX
            console.log('\t',Object.ObjectName, oo, syntaxValue);

        });
    }

});

tl.bind({ family: 'udp4', port: 162 });


// num example: 3232236033
function inet_ntoa(num) {
    var nbuffer = new ArrayBuffer(4);
    var ndv = new DataView(nbuffer);
    ndv.setUint32(0, num);

    var a = new Array();
    for (var i = 0; i < 4; i++) {
        a[i] = ndv.getUint8(i);
    }
    return a.join('.');
}
