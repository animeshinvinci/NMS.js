
var Lexer = require('../lib/util-lexer');
var fs = require('fs');
var $ = require('jquery');

var MIBParser = function () {
	var _self = this;
	_self.Vendors = "";
	_self.DIR = "";
	_self.TOKEN = [
		"--",                   //  0
		"{",                    //  1
		"}",                    //  2
		"::=",                  //  3
		";",                    //  4  
		"OBJECT IDENTIFIER",    //  5
		"-TYPE",                  //  6
		"-IDENTITY",              //  7
		"-GROUP",                 //  8
		"-COMPLIANCE",            //  9
		"XXXXXXXXXXX",            //  10
		"XXXXXXXXXXX",            //  11
		"XXXXXXXXXXX",            //  12
		"BEGIN",                //13
		"IMPORTS",              //14
		"DEFINITIONS",          //15
		"SYNTAX",               //16
		"ACCESS",               //17
		"MAX-ACCESS",           //18
		"MIN-ACCESS",           //19       
		"STATUS",               //20
		"DESCRIPTION",          //21
		"REFERENCE",            //22
		"INDEX",              //23       
		"SEQUENCE",             //  9
		"FROM",
		"END",
		"INTEGER",
		"OCTET STRING",
		"TEXTUAL-CONVENTION",
		"OBJECT-GROUP",
		"DEFVAL",
		"LAST-UPDATED",
		"ORGANIZATION",
		"CONTACT-INFO",
		"REVISION",
		"ENTERPRISE"
	];

	_self.Import_MIB = function (FileName) {
		console.log(FileName);
		var SR = fs.readFileSync(FileName).toString().split('\r\n');
		var ii = 0;
		var line = null;
		var oldline = null;
		var IMPORTS = "";
		var EXPORTS = "";
		var BEGINS = "app";
		var OB = new MIB();
		line = SR[ii];
		while (line != null) {
			if (line != null) {
				line = line.toString().trim();
				/*
				REM(SR, line);//ref SR, ref line
				BEGIN(SR, line, BEGINS);//ref SR, ref line, ref BEGINS
				IMPORT(SR, line, IMPORTS);//ref SR, ref line, ref IMPORTS
				EXPORT(SR, line, EXPORTS);//ref SR, ref line, ref EXPORTS
				BUILD_OBJECT_A(SR, line, OB, oldline);//ref SR, ref line, ref OB, ref oldline
				BUILD_OBJECT_B(SR, line, OB, BEGINS, IMPORTS);//ref SR, ref line, ref OB, ref BEGINS, ref IMPORTS
				*/
			}
			oldline = line;
			ii++;
			line = SR[ii];
		}

	}
}
var MIB_OBJECT = function () {
	return {
		ObjectName: '',
		ParentName: '',
		ParentIndex: 0,
		GrandParentsName: [],
		GrandParentsIndex: [],
		DEFINITION: '',
		BODY: '',
		TYPE: '',
		SYNTAX: '',
		OPTION: '',
		ACCESS: '',
		INDEX: '',
		DESCRIPTION: '',
		IMPORTS: ''
	}
}

var MIB = function (options) {
    var _self = this;
    var dir = "";
    var Vendors = "";

    _self.asn1ber = [];
    _self.asn1ber[0x02] = 'Integer';
    _self.asn1ber[0x04] = 'OctetString';
    _self.asn1ber[0x05] = 'Null';
    _self.asn1ber[0x06] = 'ObjectIdentifier';
    _self.asn1ber[0x30] = 'Sequence';
    _self.asn1ber[0x40] = 'IpAddress';
    _self.asn1ber[0x41] = 'Counter';
    _self.asn1ber[0x42] = 'Gauge';
    _self.asn1ber[0x43] = 'TimeTicks';
    _self.asn1ber[0x44] = 'Opaque';
    _self.asn1ber[0x45] = 'NsapAddress';
    _self.asn1ber[0x46] = 'Counter64';
    _self.asn1ber[0x80] = 'NoSuchObject';
    _self.asn1ber[0x81] = 'NoSuchInstance';
    _self.asn1ber[0x82] = 'EndOfMibView';
    _self.asn1ber[0xA0] = 'PDUBase';



    _self.LookupName = {};
    _self.LookupOID = {};

    _self.OIDTree = [];
    _self.OIDTree[1] = {
        Name: 'iso',
        OID: '1',
        RCF: 'RFC1155-SMI'
    };

    _self.lexer = new Lexer();
    _self.enterprise_numbers = [];

    _self.MIBSystem = "sysName,sysDescr,sysContact,sysLocation,sysObjectID,ifNumber,";
    _self.MIBType = "ipForwarding,prtGeneralConfigChanges,dot1dBaseNumPorts,hrSystemUptime,";
    _self.MIBInterface = "ifIndex,ifDescr,ifType,ifPhysAddress,ifMtu,ifSpeed,ifAdminStatus,ifOperStatus,ifLastChange,portName,ipAdEntAddr,ipAdEntIfIndex,ipAdEntNetMask,ifName,ifAlias,";
    _self.MIBHardware = "hrDeviceEntry,";
    _self.MIBStorage = "hrStorageEntry,";
    _self.MIBDisks = "hrDiskStorageEntry,";
    _self.MIBFileSystems = "hrFSEntry,";
    _self.MIBInstalledSoftware = "hrSWInstalledEntry,";
    _self.MIBRunningApps = "hrSWRunEntry,";
    _self.MIBRunningServices = "svSvcEntry,";
    _self.MIBShares = "svShareEntry,";
    _self.MIBUserAccounts = "svUserEntry,";

    if (options.import == 'auto') {
        console.log('MIB.AutoImport()');
        _self.AutoImport();
    }

}
MIB.prototype.AutoImport = function () {
	var _self = this;
	
	_self.Import_Enterprise("RFC_BASE_MINIMUM//enterprise-numbers.txt", function (MIB) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//RFC1212.MIB", function (OIDTree) {

	});
	_self.Import_MIB("RFC_BASE_MINIMUM//RFC1155-SMI.MIB", function (OIDTree) {

	});
	_self.Import_MIB("RFC_BASE_MINIMUM//RFC-1215.MIB", function (OIDTree) {

	});
	_self.Import_MIB("RFC_BASE_MINIMUM//RFC1213-MIB-II.MIB", function (OIDTree) {

	});
	_self.Import_MIB("RFC_BASE_MINIMUM//SNMPv2-SMI.MIB", function (OIDTree) {

	});
	_self.Import_MIB("RFC_BASE_MINIMUM//SNMPv2-MIB.MIB", function (OIDTree) {

	});
	_self.Import_MIB("RFC_BASE_MINIMUM//IANAifType-MIB.MIB", function (OIDTree) {
		//mib.parseObject(OIDTree);
		//console.log(JSON.stringify(OIDTree, null, 4));
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//IF-MIB.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//IP-FORWARD-MIB.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//HOST-RESOURCES-MIB.MIB", function (OIDTree) {
		//mib.parseObject(OIDTree);
		//console.log(JSON.stringify(OIDTree, null, 4));
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//CISCO-SMI.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//CISCO-TC.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//CISCO-VTP-MIB.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//CISCO-CDP-MIB.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//CISCO-VLAN-MEMBERSHIP-MIB.MIB", function (OIDTree) {
	});
	_self.Import_MIB("RFC_BASE_MINIMUM//CISCO-METRO-PHY-MIB.MIB", function (OIDTree) {
	});
}
MIB.prototype.Import_Enterprise = function (FileName, callback) {
	var _self = this;
	_self.lexer.Parse('Vendors', fs.readFileSync(FileName).toString());

	


	var Table = _self.lexer._Table;
	for (var row = 0; row < Table.length; row++) {
		if (Table[row]) {
			if (parseInt(Table[row][0].text) > -1) {
				var Vendor = { Decimal: Table[row][0].text, Organization: '', Contact: '', Email: '' };
				var space = ' ';
				row++;
				while (Table[row] && Table[row][0].column > 0 && row < Table.length) {
					for (var col = 0; col < Table[row].length; col++) {
						if (col == Table[row].length - 1) {
							space = '';
						}
						else {
							space = ' ';
						}
						if (Table[row][0].column == 2) {
							Vendor.Organization += Table[row][col].text + space;
						}
						if (Table[row][0].column == 4) {
							Vendor.Contact += Table[row][col].text + space;
						}
						if (Table[row][0].column == 6) {
							Vendor.Email += Table[row][col].text + space;
						}
					}
					row++;
				}
				row--;
				//_self.enterprise_numbers.push(Vendor);
				_self.enterprise_numbers[Vendor.Decimal] = (Vendor);
			}
		}
	}
	//console.log(_self.enterprise_numbers);
	callback(_self);
}
MIB.prototype.child = function () {
	return { Name: '', ID: '', parentName: '' }
}
MIB.prototype.Import_MIB = function (FileName, callback) {


    var _self = this;
    //console.log(FileName.split('//')[1].split('.')[0]       );
    _self.lexer.Parse(FileName.split('//')[1].split('.')[0], fs.readFileSync(FileName).toString());

    //console.log(_self.lexer._Table);

    var Table = _self.lexer._Table;
    var child = new _self.child();
    var section = '';
    var IMPORTS = [];
    var RFC = '';
    var DESCRIPTION = [];
    var BRAKET = '';
    for (var row = 0; row < Table.length; row++) {
        if (Table[row]) {
            for (var col = 0; col < Table[row].length; col++) {
                var TOKEN = Table[row][col].text;

                switch (TOKEN) {
                    case 'DEFINITIONS':
                        RFC = Table[row][0].text;
                        break;
                    case 'IMPORTS':
                        section = 'IMPORTS';
                        break;
                    case 'DESCRIPTION':
                        section = 'DESCRIPTION';
                        break;
                    case '"':
                        if (section == 'DESCRIPTION') {
                            section = 'DESCRIPTION_text';
                        } else if (section == 'DESCRIPTION_text') {
                            child.DESCRIPTION = '';
                            for (text in DESCRIPTION) {
                                if (DESCRIPTION.hasOwnProperty(text)) {
                                    child.DESCRIPTION += DESCRIPTION[text] + ' ';
                                }
                            }
                            DESCRIPTION = [];
                            section = '';
                        }
                        break;
                    case '{':
                        if (section == '') {
                            section = 'BRAKET';
                        }
                        break;
                    case '}':
                        if (section == 'BRAKET') {
                            //console.log(BRAKET);
                            BRAKET = '';
                            section = '';
                        }
                        break;
                    case ';':
                        if (section == 'IMPORTS') {
                            IMPORTS = [];
                            section = '';
                        }
                        break;
                    case '--':
                        while (col < Table[row].length) {
                            col++;
                        }
                        break;
                    case ',':
                        break;
                    case 'OBJECT':
                        if (Table[row][col + 1] && Table[row][col + 1].text == 'IDENTIFIER' && section == '') {
                            col++; //IDENTIFIER
                            section = 'OBJECT IDENTIFIER';
                            if (child.Name.length == 0) {
                                child = new _self.child();
                                child.Name = Table[row][0].text;
                                child.RFC = RFC;
                                child.TYPE = section;
                                if (child.Name == 'internet') {
                                    _self.addChild(_self.OIDTree, { RFC: RFC, parentName: 'iso', Name: 'org', ID: 3, TYPE: section });
                                    _self.addChild(_self.OIDTree, { RFC: RFC, parentName: 'org', Name: 'dod', ID: 6, TYPE: section });
                                    _self.addChild(_self.OIDTree, { RFC: RFC, parentName: 'dod', Name: 'internet', ID: 1, TYPE: section });
                                }
                            }
                        }
                        break;
                    case 'OBJECT-TYPE':
                        var tmp = Table[row][0].text;
                        if (tmp != TOKEN && tmp != '--' && section == '') {
                            child = new _self.child();
                            child.Name = tmp;
                            child.RFC = RFC;
                            child.TYPE = TOKEN;
                            section = TOKEN;
                        }
                        break;
                    case 'MODULE-IDENTITY':
                        var tmp = Table[row][0].text;
                        if (tmp != TOKEN && tmp != '--' && section == '') {
                            child = new _self.child();
                            child.Name = tmp;
                            child.RFC = RFC;
                            child.TYPE = TOKEN;
                            section = TOKEN;
                        }
                        break;
                    case 'OBJECT-IDENTITY':
                        var tmp = Table[row][0].text;
                        if (tmp != TOKEN && tmp != '--' && section == '') {
                            child = new _self.child();
                            child.Name = tmp;
                            child.RFC = RFC;
                            child.TYPE = TOKEN;
                            section = TOKEN;
                        }
                        break;
                    case '::=':
                        if (Table[row][col + 1] && Table[row][col + 1].text == '{' && child.Name.length != 0) {
                            while (col < Table[row].length && Table[row][col + 1].text != '}') {
                                if (parseInt(Table[row][col + 1].text)) {
                                    child.ID = Table[row][col + 1].text;
                                } else {
                                    child.parentName = Table[row][col + 1].text;
                                }
                                col++;
                            }
                            if (child.parentName.length > 0) {
                                _self.addChild(_self.OIDTree, child);
                                child = new _self.child();
                                section = '';
                            }
                        } else { }
                        break;
                    default:
                        break;
                }
                switch (section) {
                    case 'IMPORTS':
                        IMPORTS.push(TOKEN);
                        break;
                    case 'DESCRIPTION_text':
                        DESCRIPTION.push(TOKEN);
                        break;
                    case 'BRAKET':
                        if (TOKEN != '{') {
                            BRAKET += TOKEN + ' ';
                        }
                        break;
                    default:
                        break;
                }

            }
        }
    }
    callback(_self.OIDTree);
}
MIB.prototype.parseObject = function (oid) {
	var _self = this;
	for (id in oid) {
		if (oid.hasOwnProperty(id) && parseInt(id)) {
		    console.log(oid[id].OID, oid[id].Name, '\t\t\t\t'+ oid[id].RFC);
			if ($.type(oid[id]) == 'object') {
				_self.parseObject(oid[id])
			}
		}

	}
}
MIB.prototype.Get_OID = function (oid, Name, callback) {
	var _self = this;

	for (id in oid) {
		if (oid.hasOwnProperty(id) && parseInt(id)) {
			//console.log(oid[ob].OID, oid[ob].Name);
			if (oid[id].Name == Name) {
				callback(oid[id]);
			}
			if ($.type(oid[id]) == 'object') {
				_self.Get_OID(oid[id], Name, callback);
			}
		}
	}
	
}
MIB.prototype.Get_Name = function (oid, OID_string, callback) {
	var _self = this;
	for (id in oid) {
		if (oid.hasOwnProperty(id) && parseInt(id)) {
			if (oid[id].OID == OID_string) {
				callback(oid[id]);
			}
			if ($.type(oid[id]) == 'object') {
				_self.Get_Name(oid[id], OID_string, callback);
			}
		}
	}
}
MIB.prototype.Get_MIB = function (oid, string, callback) {
    var _self = this;
    for (id in oid) {
        if (oid.hasOwnProperty(id) && parseInt(id)) {
            if (oid[id].OID ==string|| oid[id].Name == string) {
                callback(oid[id]);
            }
            if ($.type(oid[id]) == 'object') {
                _self.Get_MIB(oid[id], string, callback);
            }
        }
    }
}

MIB.prototype.Get_Object = function (string, callback) {
    var _self = this;
    _self.Get_MIB(_self.OIDTree, string, callback)
};
MIB.prototype.Find_Match = function (oid, callback) {
    var _self = this;
    var oidArray = [];
    if ($.type(oid) == 'string') {
        oidArray = oid.split('.');
    }
    if ($.type(oid) == 'array') {
        oidArray = oid;
    }
    
    var found = false;
    while (!found) {
        _self.Get_Object(oidArray.toString().replace(/,/g, '.'), function (MIB_Object) {
            found = true;
            callback(MIB_Object);
        });
        oidArray.pop(); //remove last element untill base OID is found.
        if (oidArray.length == 0) {
            callback(null);
            break;
        }
    }

};


MIB.prototype.addChild = function (oid, child) {
    var _self = this;
    for (id in oid) {
        if (oid.hasOwnProperty(id) && parseInt(id)) {
            //console.log( oid[ob].OID, oid[ob].Name);
            if (child.parentName == oid[id].Name) {
                if (!oid[id][child.ID]) {
                    oid[id][child.ID] = child;
                    oid[id][child.ID].OID = oid[id].OID + '.' + child.ID;
                    _self.addLookup(oid[id][child.ID]);
                }
                break;
            }
            if ($.type(oid[id]) == 'object') {
                _self.addChild(oid[id], child)
            }
        }
    }
    if (oid[id] == '1') {
        //done
    }
}


MIB.prototype.addLookup = function (mib) {
    var _self = this;
    if (!_self.LookupName[mib.Name]) {
        _self.LookupName[mib.Name] = mib;
    }
    if (!_self.LookupOID[mib.OID]) {
        _self.LookupOID[mib.OID] = mib;
    }
}
MIB.prototype.Get_Vendor = function (I) {
	var _self = this;
	return _self.enterprise_numbers[I];
}


module.exports = exports = MIB;
exports.MIB = MIB;
exports.native = undefined;
