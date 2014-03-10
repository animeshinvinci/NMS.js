var MIB = new require('./lib/util-mib');
var snmp = require('snmp-native');
var IP = new require('./lib/util-ip');
var ping = require("net-ping");
var fs = require('fs');
var $ = require('jquery');

var mib = new MIB({ import: 'auto' });
var session = new snmp.Session();

var RouteNextHop = {};
var DNS = {};

var GetTable = function (host, tableName) {
    var OID_REF = {};
    var Devices = {};
    var sysName = '';
    var tableEntryOID = '';
    //var routeOIDS = ['.1.3.6.1.2.1.4.21.1.1','.1.3.6.1.2.1.4.21.1.2];
    //ipRouteTable = 1.3.6.1.2.1.4.21;
    //ipRouteEntry  = 1.3.6.1.2.1.4.21.1;
    //ipCidrRouteTable = 1.3.6.1.2.1.4.24.4
    //ipCidrRouteEntry = 1.3.6.1.2.1.4.24.4.1

    mib.Get_Object(tableName, function (MIB_) {
        mib.Get_Object(MIB_[1].Name, function (MIB_Object) {
            tableEntryOID = '.' + MIB_Object.OID;
            for (MIB in MIB_Object) {
                if ($.type(MIB_Object[MIB]) == 'object') {
                    OID_REF[MIB_Object[MIB].OID] = {};
                    OID_REF[MIB_Object[MIB].OID].Name = MIB_Object[MIB].Name;
                }
            }
        });
    });



    session.getSubtree({ host: host, community: 'public', oid: '.1.3.6.1.2.1.1.5', timeouts: [1200, 1200, 1200] }, function (error, varbinds, baseOid) {

        if (!error) {
            sysName = varbinds[0].value;
            if (!DNS[sysName]) {
                DNS[sysName] = {};
                DNS[sysName]['ip'] = [];
                DNS[sysName]['scanned'] = false;
            }
            if (DNS[varbinds[0].value]['ip'].indexOf(host) == -1) {
                DNS[varbinds[0].value]['ip'].push(host);
            }
            console.log('scanning ' + sysName);
            //console.log(JSON.stringify(OID_REF, null, 4));
            session.getSubtree({ host: host, community: 'public', oid: tableEntryOID, timeouts: [12000, 12000, 12000] }, function (error, varbinds, baseOid) {

                if (!error && varbinds.length > 0) {
                    if (!Devices[sysName]) {
                        Devices[sysName] = {};
                        Devices[sysName][tableName] = {};
                    }
                    DNS[sysName]['scanned'] = true;
                    varbinds.forEach(function (vb) {

                        var len = baseOid.length + 1;
                        var OIDName = OID_REF[vb.oid.slice(0, len).toString().replace(/,/g, '.')].Name;
                        var tableEntry = vb.oid.slice(len).toString().replace(/,/g, '.');
                        var val = vb.value;
                        if ($.type(val) == 'array') {
                            val = val.toString().replace(/,/g, '.');
                        }
                        if (!Devices[sysName][tableName][tableEntry]) {
                            Devices[sysName][tableName][tableEntry] = {};
                        }
                        if (OIDName.indexOf('PhysAddress') > -1) {
                            val = vb.valueHex;
                        }
                        Devices[sysName][tableName][tableEntry][OIDName] = val;

                        if (OIDName.indexOf('RouteNextHop') > -1) {
                            if (!RouteNextHop[val]) {
                                RouteNextHop[val] = '';
                            }
                        }



                    });

                    if (sysName.length > 0) {
                        var data = JSON.stringify(Devices, null, 4);
                        fs.writeFile('CMD_Files//' + sysName + '_' + tableName + '.json', data, function (err) {
                            if (err) throw err;
                            console.log('CMD_Files//' + sysName + '_' + tableName + '.json  saved!');
                            console.log(new Date());
                        });
                    }

                    for (NextHop in RouteNextHop) {
                        if (RouteNextHop.hasOwnProperty(NextHop)) {
                            session.getSubtree({ host: NextHop, community: 'public', oid: '.1.3.6.1.2.1.1.5', timeouts: [1200, 1200, 1200] }, function (error, varbinds, baseOid, snmphost) {
                                if (!error) {
                                    if (!DNS[varbinds[0].value]) {
                                        DNS[varbinds[0].value] = {};
                                        DNS[varbinds[0].value]['scanned'] = false;
                                        DNS[varbinds[0].value]['ip'] = [];
                                    }

                                    if (DNS[varbinds[0].value]['ip'].indexOf(snmphost) == -1) {
                                        DNS[varbinds[0].value]['ip'].push(snmphost);
                                    }

                                    if (DNS[varbinds[0].value]['scanned'] == false) {
                                        //console.log(JSON.stringify(DNS, null, 4));
                                        DNS[varbinds[0].value]['scanned'] = true;
                                        GetTable(snmphost, 'ipCidrRouteTable');
                                    }
                                }
                            });
                        }
                    }
                }
                else {
                    console.log(error);
                    if (DNS[sysName]['scanned'] == false && tableName=='ipCidrRouteTable') {
                        DNS[sysName]['scanned'] = true;
                        GetTable(host, 'ipRouteTable');
                    }
                }


            });


        }
    });
}


console.log(new Date());
//GetTable('10.20.4.10', 'ipCidrRouteTable');//ipRouteTable//ipCidrRouteTable//ipNetToMediaTable//ipAddrTable//ifTable//ifXTable
GetTable('127.0.0.1', 'ifTable'); 
