var snmp = require('snmp-native');
var MIB = require('./lib/mib');
var util = require('util');
var fs = require('fs');
var express = require('express.io');
var bone = require('bone.io');
var SSL_options = {
    key: fs.readFileSync('./ssl/ca.key'),
    cert: fs.readFileSync('./ssl/ca.crt'),
    passphrase: 'password'
}
var app = express().https(SSL_options).io()

app.io.configure(function () {
    app.io.set('authorization', function (handshakeData, callback) {
        callback(null, true); // error first callback style 
    });
});

bone.set('io.options', { server: app.io })
app.use(bone.static());
app.use(express.cookieParser());
app.use(express.session({ secret: 'snmpwalk161' }));
app.use(express.static(__dirname));
app.listen(8161);


app.get('/', function (req, res) {

    req.session.loginDate = new Date().toString();
     console.log('login');
})

app.io.route('join', function (req) {
    //req.io.join('snmpwalk');
    //console.log('joined');
    //app.io.room('snmpwalk').broadcast('message', NameSpaceTable)
});
app.io.route('SNMPget', function (req) {

    var args = req.data.split(":");

    console.log(args);

    if (args[0] == 'MIBTree') {
        req.io.respond(mib.NameSpaceTable);
        return;
    }

    if (args[2] == 'ifInfo') {

        GetIfInfo(args[0], args[1], function (table) {
            req.io.respond(table);
        });
        return;
    } else {
        if (args.length < 2) {
            req.io.respond({});
        } else {
            var oids = args[2].split(",")
            oids.forEach(function (oid) {
                mib.GetObject(oid, function (Object) {
                    if (Object.OID) {

                        var options = {
                            host: args[0],
                            community: args[1],
                            oid: '.' + Object.OID,
                            timeouts: [5000]
                        };
                        console.log(options);
                        GetSubTree(options, function (Table) {
                            console.log(Table)
                            req.io.respond(Table);
                        });
                    } else {
                        req.io.respond({});
                    }
                });
            });


        }
    }

});







var session = new snmp.Session();


var mib = new MIB();
mib.LoadMIBs();
mib.WriteToFile();
mib.MakeMibTree();

var oid = 'ifTable'; // 'ipRouteNextHop','ipCidrRouteTable','ipRoutingTable';



//http://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference
//function index(obj, i) { return obj[i] }


var delimiter2bracket = function (json, delimiter) {
    var bracket = {}, t, parts, part;
    for (var k in json) {
        t = bracket;
        parts = k.split(delimiter);

        var key = parts.pop(); //last part

        while (parts.length) {
            part = parts.shift(); //first part
            t = t[part] = t[part] || {};
        }
        t[key] = json[k];//set value
    }
    return bracket;
}

var NameSpaceTable = {};
function GetSubTree(options, callback) {
    var step_1 = new Date();

    session.getSubtree(options, function (error, varbinds, baseOid) {
        var step_2 = new Date();
        console.log('Subtree scan: ' + (step_2 - step_1));
        //var VarBinds = varbinds;
         mib.DecodeVarBinds(varbinds, function (VarBinds) {

        console.log('DecodeVarBinds: ' + (new Date() - step_2));
        var NameSpace = {};
        VarBinds.forEach(function (vb) {
            if (!NameSpace[vb.NameSpace]) {
                NameSpace[vb.NameSpace] = {};
            }
            NameSpace[vb.NameSpace][vb.oid] = vb.Value;
        });
        NameSpaceTable = delimiter2bracket(NameSpace, '.');
        console.log('NameSpace: ' + (new Date() - step_2));
        callback(NameSpaceTable);

        });


    });
}



function GetIfInfo(host, community,cb) {
    var oids = [
            'sysName', 'sysDescr',
            'ifIndex', 'ifDescr', 'ifType', 'ifMtu', 'ifSpeed', 'ifPhysAddress', 'ifAdminStatus', 'ifOperStatus', 'ifName', 'ifHighSpeed', 'ifAlias', 'vmVlan', 'ipAdEntAddr', 'ipAdEntNetMask', 'ipAdEntIfIndex',
            'ipNetToMediaIfIndex', 'ipNetToMediaNetAddress', 'ipNetToMediaPhysAddress',
            'vtpVlanName',
            'cdpCacheDeviceId', 'cdpCachePlatform', 'cdpCachePlatform', 'cdpCacheDevicePort'
            ]
    var NameSpaceTable = {};
    var NameSpace = {};
    var oids_ = Object.keys(oids), _len = oids_.length;
    var pending = 0;
    var o = 0;

    var SNMP_Walk = function (oid, cs, cb) {

        pending++;

        mib.GetObject(oid, function (MIB) {

            var options = {
                host: host,
                community: cs,
                oid: '.' + MIB.OID,
                timeouts: [5000, 5000, 5000, 5000]
            };

            session.getSubtree(options, function (error, varbinds, baseOid) {
                //console.log(error, varbinds, baseOid);
                VarBinds = varbinds;
                mib.DecodeVarBinds(varbinds, function (VarBinds) {

                    VarBinds.forEach(function (vb) {
                        if (!NameSpace[vb.NameSpace]) {
                            NameSpace[vb.NameSpace] = {};
                        }
                        NameSpace[vb.NameSpace][vb.oid] = vb.Value;
                        if (vb.ObjectName == 'vtpVlanName') {
                            var vlan = vb.oid.split(".")[1];
                            SNMP_Walk('dot1dTpFdbAddress', community + '@' + vlan, cb);
                            SNMP_Walk('dot1dTpFdbPort', community + '@' + vlan, cb);
                            SNMP_Walk('dot1dBasePortIfIndex', community + '@' + vlan, cb);
                        } else {

                        }

                    });

                    for (var chunk = 0; chunk < 5; chunk++) {
                        if (o < _len) {
                            console.log(oids[oids_[o]]);
                            SNMP_Walk(oids[oids_[o]], community, cb);
                            o++;
                        }
                    }


                    var ifTables = {};
                    var ifTable = {};
                    function CreateifIndex(ifIndex) {
                        if (typeof (ifIndex) != "object") {
                            var DeviceId = '';
                            var Platform = '';
                            var DevicePort = '';

                            if (typeof (ifTables['cdpCacheDevicePort']) == "object") {
                                var cdpCacheDevicePort = Object.keys(ifTables['cdpCacheDevicePort']), cdp_len = cdpCacheDevicePort.length;
                                for (var i = 0; i < cdp_len; i++) {
                                    if (ifIndex == cdpCacheDevicePort[i].split('.')[0]) {
                                        DeviceId = ifTables['cdpCacheDeviceId'][cdpCacheDevicePort[i]];
                                        Platform = ifTables['cdpCachePlatform'][cdpCacheDevicePort[i]];
                                        DevicePort = ifTables['cdpCacheDevicePort'][cdpCacheDevicePort[i]];
                                        break;
                                    }
                                }
                            }
                            ifTable[ifIndex] = [];
                            ifTable[ifIndex].push({
                                sysName: ifTables['sysName'][0] ? ifTables['sysName'][0] : '',
                                ifName: ifTables['ifName'][ifIndex] ? ifTables['ifName'][ifIndex] : '',
                                ifAlias: ifTables['ifAlias'][ifIndex] ? ifTables['ifAlias'][ifIndex] : '',
                                ifType: ifTables['ifType'][ifIndex] ? ifTables['ifType'][ifIndex] : '',
                                ifMtu: ifTables['ifMtu'][ifIndex] ? ifTables['ifMtu'][ifIndex] : '',
                                ifSpeed: ifTables['ifSpeed'][ifIndex] ? ifTables['ifSpeed'][ifIndex] : '',
                                ifHighSpeed: ifTables['ifHighSpeed'][ifIndex] ? ifTables['ifHighSpeed'][ifIndex] : '',
                                ifPhysAddress: ifTables['ifPhysAddress'][ifIndex] ? ifTables['ifPhysAddress'][ifIndex] : '',
                                ifAdminStatus: ifTables['ifAdminStatus'][ifIndex] ? ifTables['ifAdminStatus'][ifIndex] : '',
                                ifOperStatus: ifTables['ifOperStatus'][ifIndex] ? ifTables['ifOperStatus'][ifIndex] : '',
                                vmVlan: (ifTables['vmVlan'] && ifTables['vmVlan'][ifIndex]) ? ifTables['vmVlan'][ifIndex] : '',
                                vtpVlanName: (ifTables['vtpVlanName'] && ifTables['vtpVlanName']['1.' + ifTables['vmVlan'][ifIndex]]) ? ifTables['vtpVlanName']['1.' + ifTables['vmVlan'][ifIndex]] : '',
                                cdpCacheDeviceId: DeviceId,
                                cdpCachePlatform: Platform,
                                cdpCacheDevicePort: DevicePort
                            });
                        }

                    }



                    function delimiter2bracket(json, delimiter) {
                        var bracket = {}, t, parts, part;
                        for (var k in json) {
                            t = bracket;
                            parts = k.split(delimiter);

                            var key = parts.pop(); //last part

                            while (parts.length) {
                                part = parts.shift(); //first part
                                t = t[part] = t[part] || {};
                            }
                            t[key] = json[k]; //set value
                        }
                        return bracket;
                    };
                    var obCache = {};
                    var obTable = {};
                    function convert(lev, o, callback, oo, ooo) {
                        var keys = Object.keys(o), len = keys.length;
                        for (var i = 0; i < len; i++) {
                            if (o[keys[i]] !== null && typeof (o[keys[i]]) == "object") {
                                convert(lev + 1, o[keys[i]], callback, o, oo);
                            } else if (o[keys[i]] !== null && obCache != oo) {
                                obCache = oo;

                                var TableNames = Object.keys(oo); t_len = TableNames.length;
                                for (var t = 0; t < t_len; t++) {
                                    obTable[TableNames[t]] = oo[TableNames[t]];
                                }
                            }
                        }
                        if (lev == 0) {
                            callback(obTable);
                        }
                    }





                    NameSpaceTable = delimiter2bracket(NameSpace, '.');
                    pending--;
                    console.log(pending, o, _len);
                    if (pending == 0 && o == _len) {
                        convert(0, NameSpaceTable, function (tables) {
                            var tableNames = Object.keys(tables), t_len = tableNames.length;
                            ifTables = tables;
                            ifTable = {};
                            if (typeof (tables['ifIndex']) == "object") {
                                var ifIndex = Object.keys(tables['ifIndex']), if_len = ifIndex.length;
                                for (var i = 0; i < if_len; i++) {
                                    if (!ifTable[ifIndex[i]]) { CreateifIndex(ifIndex[i]) }
                                }
                            }
                            if (typeof (tables['dot1dTpFdbAddress']) == "object") {
                                var portIndex = Object.keys(tables['dot1dTpFdbAddress']), m_len = portIndex.length;
                                for (var m = 0; m < m_len; m++) {
                                    //cross reference dot1dTpFdbPort to ifIndex
                                    var ifIndex = tables['dot1dBasePortIfIndex'][tables['dot1dTpFdbPort'][portIndex[m]]];
                                    if (!ifTable[ifIndex]) { CreateifIndex(ifIndex) }
                                    ifTable[ifIndex].push({ dot1dTpFdbAddress: tables['dot1dTpFdbAddress'][portIndex[m]] });
                                }
                            }
                            if (typeof (tables['ipAdEntIfIndex']) == "object") {
                                var ipAdEntIfIndex = Object.keys(tables['ipAdEntIfIndex']), ip_len = ipAdEntIfIndex.length;
                                for (var i = 0; i < ip_len; i++) {
                                    var ifIndex = tables['ipAdEntIfIndex'][ipAdEntIfIndex[i]];
                                    if (!ifTable[ifIndex]) { CreateifIndex(ifIndex) }
                                    ifTable[ifIndex].push({
                                        ipAdEntAddr: tables['ipAdEntAddr'][ipAdEntIfIndex[i]],
                                        ipAdEntNetMask: tables['ipAdEntNetMask'][ipAdEntIfIndex[i]]
                                    });
                                }
                            }
                            if (typeof (tables['ipNetToMediaIfIndex']) == "object") {
                                var ipNetToMediaIfIndex = Object.keys(tables['ipNetToMediaIfIndex']), ip_len = ipNetToMediaIfIndex.length;
                                for (var i = 0; i < ip_len; i++) {
                                    var ifIndex = tables['ipNetToMediaIfIndex'][ipNetToMediaIfIndex[i]];
                                    if (!ifTable[ifIndex]) { CreateifIndex(ifIndex) }
                                    ifTable[ifIndex].push({
                                        ipNetToMediaNetAddress: tables['ipNetToMediaNetAddress'][ipNetToMediaIfIndex[i]],
                                        ipNetToMediaPhysAddress: tables['ipNetToMediaPhysAddress'][ipNetToMediaIfIndex[i]]
                                    });
                                }
                            }

                            var DevifInfo = {
                                ID: [], sysName: [], ifIndex: [], ifName: [], ifAlias: [],
                                ifType: [], ifMtu: [], ifSpeed: [], ifHighSpeed: [], ifPhysAddress: [],
                                ifAdminStatus: [], ifOperStatus: [],
                                vtpVlanName: [], vmVlan: [],
                                ifAdminStatus: [], ifOperStatus: [],

                                cdpCacheDeviceId: [], cdpCachePlatform: [], cdpCacheDevicePort: [],

                                ipAdEntAddr: [], ipAdEntNetMask: [],
                                ipNetToMediaNetAddress: [], ipNetToMediaPhysAddress: [],
                                dot1dTpFdbAddress: []
                            }
                            var DevRow = 0;


                            var ifIndex = Object.keys(ifTable), if_len = ifIndex.length;
                            for (var i = 0; i < if_len; i++) {
                                var ifObjects = ifTable[ifIndex[i]];

                                for (var ob = 0; ob < ifObjects.length; ob++) {

                                    DevifInfo.ID[DevRow] = host;
                                    DevifInfo.sysName[DevRow] = ifObjects[0].sysName;
                                    DevifInfo.ifIndex[DevRow] = ifIndex[i];
                                    DevifInfo.ifName[DevRow] = ifObjects[0].ifName;
                                    DevifInfo.ifAlias[DevRow] = ifObjects[0].ifAlias;

                                    DevifInfo.ifType[DevRow] = ifObjects[0].ifType;
                                    DevifInfo.ifMtu[DevRow] = ifObjects[0].ifMtu;
                                    DevifInfo.ifSpeed[DevRow] = ifObjects[0].ifSpeed;
                                    DevifInfo.ifHighSpeed[DevRow] = ifObjects[0].ifHighSpeed;
                                    DevifInfo.ifPhysAddress[DevRow] = ifObjects[0].ifPhysAddress;

                                    DevifInfo.ifAdminStatus[DevRow] = ifObjects[0].ifOperStatus;
                                    DevifInfo.ifOperStatus[DevRow] = ifObjects[0].ifOperStatus;

                                    DevifInfo.vtpVlanName[DevRow] = ifObjects[0].vtpVlanName;
                                    DevifInfo.vmVlan[DevRow] = ifObjects[0].vmVlan;

                                    DevifInfo.cdpCacheDeviceId[DevRow] = ifObjects[0].cdpCacheDeviceId;
                                    DevifInfo.cdpCachePlatform[DevRow] = ifObjects[0].cdpCachePlatform;
                                    DevifInfo.cdpCacheDevicePort[DevRow] = ifObjects[0].cdpCacheDevicePort;




                                    if (ob > 0) {
                                        var ifObject = Object.keys(ifObjects[ob]), ifOb_len = ifObject.length;
                                        for (var ifob = 0; ifob < ifOb_len; ifob++) {
                                            DevifInfo[ifObject[ifob]][DevRow] = ifObjects[ob][ifObject[ifob]]
                                        }
                                    }

                                    DevRow++;
                                }
                            }
                            //FINISHED
                            cb(DevifInfo);

                        });
                    };

                });

            });

        });

    }



    SNMP_Walk(oids[oids_[o]], community, cb);
    o++;

}