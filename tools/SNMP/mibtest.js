var MIB = require('./lib/mib');
var snmp = require('snmp-native');
var mib = new MIB();
var session = new snmp.Session();

mib.LoadMIBs();
mib.WriteToFile();
mib.MakeMibTree();

/*
 *  Get system info:
 *  system = sysDescr, sysName ...
 *
 *  Get Interface information:
 *  ifTable = ifIndex,ifDescr,ifType,ifMtu,ifSpeed,ifPhysAddress,ifAdminStatus,ifOperStatus
 *  ifXtable = ifName,ifHighSpeed,ifAlias
 *
 *  Get All vlan IDs:
 *  vtpVlanTable = oid(1.10 = vlan 10),vtpVlanName
 *
 *  Get MAC and Bridge Port per vlan with snmp community indexing example: public@10 = vlan 10
 *  dot1dTpFdbTable = dot1dTpFdbAddress, dot1dTpFdbPort
 *
 *  Get Bridge port to ifIndex per vlan with snmp community indexing example: public@10 = vlan 10
 *  dot1dBasePortTable: dot1dBasePort,dot1dBasePortIfIndex
 *
 *  Get IP to MAC association:
 *  ipNetToMediaTable = ipNetToMediaIfIndex, ipNetToMediaPhysAddress, ipNetToMediaNetAddress
 * 
 */

var oids = [
            //system info
            'sysName', 'sysDescr',
            //interface info   //vmVlan,ipAdEntAddr,ipAdEntNetMask
            'ifIndex', 'ifDescr', 'ifType', 'ifMtu', 'ifSpeed', 'ifPhysAddress', 'ifAdminStatus', 'ifOperStatus', 'ifName', 'ifHighSpeed', 'ifAlias', 'vmVlan', 'ipAdEntAddr', 'ipAdEntNetMask', 'ipAdEntIfIndex',
            //IP-MAC info
            'ipNetToMediaIfIndex', 'ipNetToMediaNetAddress', 'ipNetToMediaPhysAddress',
            //Vlan info
            'vtpVlanName',
            //cdp info
            'cdpCacheDeviceId', 'cdpCachePlatform', 'cdpCachePlatform', 'cdpCacheDevicePort'
            ]




var host = '10.19.170.3'
var community = 'barney';
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
                            vmVlan: (ifTables['vmVlan'][ifIndex]) ? ifTables['vmVlan'][ifIndex] : '',
                            vtpVlanName: (ifTables['vtpVlanName']['1.' + ifTables['vmVlan'][ifIndex]]) ? ifTables['vtpVlanName']['1.' + ifTables['vmVlan'][ifIndex]] : '',
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
                            ifAdminStatus:[],ifOperStatus:[],
                            vtpVlanName: [], vmVlan: [], 
                            ifAdminStatus: [], ifOperStatus: [],
                            
                            cdpCacheDeviceId: [], cdpCachePlatform: [], cdpCacheDevicePort: [],

                            ipAdEntAddr: [], ipAdEntNetMask: [], 
                            ipNetToMediaNetAddress: [], ipNetToMediaPhysAddress: [],
                            dot1dTpFdbAddress:[]
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
                            
                                   


                                if(ob > 0){
                                var ifObject = Object.keys(ifObjects[ob]), ifOb_len = ifObject.length;
                                for (var ifob = 0; ifob < ifOb_len; ifob++) {
                                    DevifInfo[ ifObject[ifob] ] [DevRow] = ifObjects[ob][ifObject[ifob]]
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









SNMP_Walk(oids[oids_[o]], community, function (Table) {
    console.log(JSON.stringify(Table, null, 4)); 
});

o++;