var MIB = new require('./lib/util-mib');
var snmp = require('snmp-native');
var IP = new require('./lib/util-ip');
var ping = require("net-ping");
var fs = require('fs');

var mib = new MIB({ import: 'auto' });
var session = new snmp.Session();



var Networks = [];
var IP_List = [];
Networks.push("192.168.1.0/32");
var ipMaskArray = [];
for (var i = 0; i < 33; i++) {
    var ipMask = new IP("0");
    ipMask.decimal = -(0xffffffff << (32 - i));
    ipMaskArray[i] = {
        ip: ipMask,
        cidr: i
    };
}
for (var i = 0; i < Networks.length; i++) {
    var mask = ipMaskArray[parseInt(Networks[i].split("/")[1])];
    var ip = new IP(Networks[i].split("/")[0]);
    console.log("Network: " + Networks[i], "\r\nHosts: " + mask.ip.decimal);
    for (var ii = parseInt(ip.decimal); ii < (ip.decimal + mask.ip.decimal); ii++) {

        IP_List.push(new IP(ii.toString()).toDottedQuad());
    }
}

var options = {
    networkProtocol: ping.NetworkProtocol.IPv4,
    retries: 4,
    timeout: 750
};
var pinger = ping.createSession(options);

pinger.on("error", function (error) {
    console.trace(error.toString());
});




var cdpInfo = ['sysName', 'ifName', 'ifDescr', 'ifAlias', 'ifOperStatus', 'ifType', 'vmVlan', 'cdpCacheDeviceId', 'cdpCacheDevicePort', 'vlanTrunkPortDynamicStatus']; 
var cbIndex = 0;
var oids = [];
var Devices = {};
for (var i in cdpInfo) {
    mib.Get_Object(cdpInfo[i], function (MIB_Object) {
        oids.push('.' + MIB_Object.OID);
    });

}

var calls = 0
var callbacks = 0

for (var index in IP_List) {

    calls++;

    pinger.pingHost(IP_List[index], function (error, Host, source) {

        callbacks++;

        if (error) {
            if (error instanceof ping.RequestTimedOutError) {
                process.stdout.write("x");
            }
            else {
                process.stdout.write('!');
            }
        } else if (Host == source) {
            console.log(source, ' responded.');
            if (!Devices[source]) {
                Devices[source] = {};
                Devices[source]['interface'] = {};
            }
            oids.forEach(function (oid) {
                session.getSubtree({ host: source, community: 'public', oid: oid, timeouts: [12000, 12000, 12000, 12000, 12000, 12000] }, function (error, varbinds, baseOid) {
                    if (error) {
                        console.log(source, 'Fail :(');
                    } else {
                        varbinds.forEach(function (vb) {

                            mib.Get_Object(baseOid.toString().replace(/,/g, '.'), function (MIB_Object) {
                                var ifIndex = vb.oid.toString().replace(/,/g, '.').split(baseOid.toString().replace(/,/g, '.'))[1].split('.')[1];
                                if (ifIndex > 0) {
                                    if (!Devices[source]['interface'][ifIndex]) {
                                        Devices[source]['interface'][ifIndex] = {};
                                    }
                                    Devices[source]['interface'][ifIndex][MIB_Object.Name] = vb.value;
                                } else {
                                    Devices[source][MIB_Object.Name] = vb.value;
                                }
                            });

                        });
                    }
                    var i = 0;
                    for (var p in session.reqs) {
                        i++;
                    }
                    console.log(i);
                    if (i == 0) {
                        session.close();
                        make_CSV(Devices);
                    }
                });
            });

        }
        if (calls == callbacks) {
            console.log('done');
        }

    });
}



var make_CSV = function (Devices) {
    var data = '';
    for (Device in Devices) {

        for (ob in Devices[Device]) {
            if (ob == 'interface') {
                for (interface in Devices[Device][ob]) {
                    var valid = false;
                    var CSV_row = [];
                    if (Devices[Device]['sysName']) {
                        CSV_row[0] = Devices[Device]['sysName'].split('.')[0];
                    } else {
                        CSV_row[0] = '';
                    }
                    CSV_row[1] = interface;
                    CSV_row[2] = 'FIBER';
                    CSV_row[3] = 'LC';
                    CSV_row[4] = 'N/A';
                    CSV_row[5] = 'N/A';
                    CSV_row[6] = 'N/A'; //ifAlias
                    CSV_row[7] = 'TO';
                    CSV_row[8] = 'SOCC';
                    CSV_row[9] = '4';
                    CSV_row[10] = '424';
                    CSV_row[11] = 'N/A';
                    CSV_row[12] = 'N/A';
                    CSV_row[13] = 'N/A'; //ifAlias
                    CSV_row[14] = '<lookup>';
                    CSV_row[15] = '<lookup>';
                    CSV_row[16] = '<lookup>';
                    CSV_row[17] = 'N/A';
                    CSV_row[18] = '<lookup>';
                    CSV_row[19] = 'N/A';
                    CSV_row[20] = 'N/A';
                    CSV_row[21] = 'FIBER';
                    CSV_row[22] = 'LC';
                    CSV_row[23] = 'N/A';
                    CSV_row[24] = 'N/A';
                    CSV_row[25] = 'N/A';
                    for (tag in Devices[Device][ob][interface]) {
                        switch (tag) {
                            case 'ifName':
                                break;
                            case 'ifDescr':
                                CSV_row[1] = Devices[Device][ob][interface][tag];
                                break;
                            case 'ifAlias':
                                CSV_row[6] = Devices[Device][ob][interface][tag];
                                CSV_row[13] = Devices[Device][ob][interface][tag];
                                break;
                            case 'ifOperStatus':
                                break;
                            case 'ifType':
                                break;
                            case 'vmVlan':
                                CSV_row[24] = Devices[Device][ob][interface][tag];
                                break;
                            case 'cdpCacheDeviceId':
                                CSV_row[17] = Devices[Device][ob][interface][tag].split('(')[0].split('.')[0]; ;
                                valid = true;
                                break;
                            case 'cdpCacheDevicePort':
                                CSV_row[20] = Devices[Device][ob][interface][tag];
                                break;
                            case 'vlanTrunkPortDynamicStatus':
                                switch (Devices[Device][ob][interface][tag]) {
                                    case 1:
                                        CSV_row[23] = 'TRUNK';
                                        break;
                                    case 2:
                                        CSV_row[23] = 'ACCESS'
                                        CSV_row[2] = 'CAT 6';
                                        CSV_row[3] = 'RJ45';
                                        CSV_row[21] = 'CAT 6';
                                        CSV_row[22] = 'RJ45';
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            default:
                                break;
                        }
                    }
                    if (valid) {
                        //console.log(CSV_row.toString());
                        //console.log(CSV_row);
                        data += CSV_row.toString() + '\r\n';
                    }
                }
            }

        }

    }

    fs.writeFile('CMD_Files//NetworkCables.csv', data, function (err) {
        if (err) throw err;
        console.log('CMD_Files//NetworkCables.csv  saved!');
    });
};

