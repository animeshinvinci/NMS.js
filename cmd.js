var fs = require('fs');
var express = require('express.io');
var shell = require('./server/lib/util-shell');
var MIB = require('./tools/SNMP/lib/mib');
var term = require('./term.js');
var snmp = require('snmp-native');
var util = require("util");
//<<<<<<< HEAD


var SSL_options = {
	key: fs.readFileSync('./server/ssl/ca.key'),
	cert: fs.readFileSync('./server/ssl/ca.crt'),
	passphrase: 'password'
}
var app = express().https(SSL_options).io();

//=======
var SSL_options = {
    key: fs.readFileSync('./server/ssl/ca.key'),
    cert: fs.readFileSync('./server/ssl/ca.crt'),
    passphrase: 'password'
}
var app = express().https(SSL_options).io()
//>>>>>>> 6a916e0609ccacb05a76c2af5cb9233209a2be3a
//var app = express().http().io();

app.use(function (req, res, next) {
    var setHeader = res.setHeader;
    res.setHeader = function (name) {
        switch (name) {
            case 'Cache-Control':
            case 'Last-Modified':
            case 'ETag':
                return;
        }
        return setHeader.apply(res, arguments);
    };
    next();
});
app.use(express.static(__dirname));
app.use(term.middleware());
app.use(express.cookieParser());
app.use(express.session({ secret: '9973' }));
app.listen(8443);

app.get('/', function (req, res) {

    req.session.loginDate = new Date().toString();
    req.session.shells = {};
    res.sendfile(__dirname + '/cmd.html');

})
app.io.route('data', function (req) {
    if (!req.session.shells) req.session.shells = {}; 
    if (!req.session.shells[req.data.id]) {
        req.session.shells[req.data.id] = new nms(req, mib);
    }
    req.session.shells[req.data.id].interpret(req.data.data);

});
app.io.route('create', function (req) {
    if (!req.session.shells) req.session.shells = {}; 
    if (!req.session.shells[req.data.id]) {
        req.session.shells[req.data.id] = new nms(req,mib);
        req.session.shells[req.data.id].INIT();
    }
   
});



String.prototype.splice = function (idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};
String.prototype.del = function (idx) {
    return (this.slice(0, idx-1) + this.slice(idx));
};
String.prototype.max = function (idx) {
    var str = this.replace(/  /g, '').replace(/\r/g, ' ').replace(/\n/g, '');
    if (str.length > idx + 3) str = str.substring(0, idx) + '...';
    while (str.length < idx + 3) {
        str += ' ';
    }
    return (str);
};
String.prototype.wrap = function (width, brk, cut) {
    var str = this;//.replace(/  /g, '');
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;

    if (!str) { return str; }

    var regex = '.{1,' + width + '}(\\s|$)' + (cut ? '|.{' + width + '}|.+$' : '|\\S+?(\\s|$)');

    return str.match(RegExp(regex, 'g')).join(brk);

}

var session = new snmp.Session();
var mib = new MIB('./tools/SNMP/');
    //mib.LoadMIBs();
    //mib.WriteToFile();
	mib.ReadFromFile();
    var nms = function (req, mib) {
        return ({
            id: (req.data && req.data.id) ? req.data.id : 0,
            title: 'iso.org.dod.internet.experimental.nms',
            cmd: 'iso.org.dod.internet.experimental.nms',
            root: 'iso.org.dod.internet',

            req: req,
            mib: mib,

            buffer: '',
            history: [],
            h_Index: 0,
            b_Index: 0,

            shell: new shell(),
            shellAgrs: {
                host: '', //
                //port: 21 || protocol default
                username: '',
                password: '',
                enpassword: '',
                shellname: req.data.id,
                protocol: '', //telnet||ssh
                autoauth: false,
                tryKeyboard: false,
                log: false
            },

            prompt: function () { return ('\x1b[2K\r' + this.cmd.split(".").pop() + ':') },
            INIT: function () {
                var self = this;

                var mib = self.mib.Modules;
                var Modules = Object.keys(mib);
                for (var i = 0; i < Modules.length; i++) {
                    if (mib[Modules[i]] !== null && typeof (mib[Modules[i]]) == "object") {
                        var ModuleObjects = Object.keys(mib[Modules[i]])
                        for (var ii = 0; ii < ModuleObjects.length; ii++) {
                            if (mib[Modules[i]][ModuleObjects[ii]].NameSpace) {
                                this.functions[mib[Modules[i]][ModuleObjects[ii]].ObjectName] = mib[Modules[i]][ModuleObjects[ii]];
                                //this.DATA('\x1b[2K\r loading MIB module ' + Modules[i] + ' - ' + Math.round(((ii / ModuleObjects.length) * 100)) + '% complete');
                            }
                        }
                    }
                }
                self.DATA(self.prompt());
            },
            DATA: function (data) {

                this.ECHO ? this.req.io.emit('data', { id: this.id, data: data, title: this.title }) : this.ECHO;
            },
            ERROR: function (agrs) {
                var self = this;
                var response = '"' + agrs[0] + '" is not recognized as an internal or external command,\r\n operable program or batch file.\r\n'
                self.DATA('\r\n ' + response + '\r\n' + self.prompt());
            },
            READY: true,
            ECHO: true,
            AUTH: function (self) {
                //console.log('auth', self.cmd);
                switch (self.cmd.split(".").pop()) {
                    case 'Username':
                        self.shellAgrs.username = self.buffer;
                        self.buffer = '';
                        self.b_Index = 0;
                        self.cmd = self.cmd.replace('.auth.Username', '.auth.Password')
                        self.CONNECT(self);
                        self.ECHO = false;
                        break;
                    case 'Password':
                        self.shellAgrs.password = self.buffer;
                        self.buffer = '';
                        self.b_Index = 0;
                        self.cmd = self.cmd.replace('.auth.Password', '');
                        self.ECHO = true;
                        self.CONNECT(self);

                        break;
                    default:
                        break;
                }
            },
            CONNECT: function (self) {
                //console.log('connect', self.cmd);
                var Agrs = self.shellAgrs;
                if (Agrs.username == '' && Agrs.protocol == 'ssh') {
                    self.cmd += '.auth.Username'
                    self.DATA('\r\n' + self.prompt());
                    self.READY = true;
                }
                else if (Agrs.password == '' && Agrs.protocol == 'ssh') {
                    self.DATA('\r\n' + self.prompt());
                    self.READY = true;
                } else {
                    self.READY = false;
                    self.DATA('\r\n Trying ' + Agrs.protocol + ' ' + Agrs.host + ':' + (Agrs.port || '') + ' .....');
                    self.shell = null;
                    self.shell = new shell();
                    self.shell._connected = true;
                    self.shell.connect(Agrs);
                    self.shell.on('data', function (data) {
                        self.DATA(data.toString());
                    });
                    self.shell.on('error', function (error, shellname) {
                        self.shellAgrs.username = '';
                        self.shellAgrs.password = '';
                        self.shell._connected = false;
                        self.title = self.cmd;
                        self.DATA('\r\n' + error.toString());
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    });
                    self.shell.on('close', function (had_error, shellname) {
                        self.title = self.cmd;
                        self.shellAgrs.username = '';
                        self.shellAgrs.password = '';
                        self.shell._connected = false;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    });
                    self.shell.on('end', function (shellname) {
                        self.title = self.cmd;
                        self.shellAgrs.username = '';
                        self.shellAgrs.password = '';
                        self.shell._connected = false;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    });
                }
            },

            input: {
                UP: function (self) {
                    self.buffer = self.history[self.history.length - 1 - self.h_Index];
                    self.b_Index = self.buffer ? self.buffer.length : 0;
                    if (self.h_Index < self.history.length - 1) {
                        self.h_Index++;
                    }
                    self.buffer = self.buffer ? self.buffer : '';
                    self.DATA(self.prompt() + self.buffer); //PRINT CMD FROM HISTORY
                },
                DOWN: function (self) {
                    if (self.h_Index > 0) {
                        self.h_Index--;
                        self.buffer = self.history[self.history.length - 1 - self.h_Index];
                        self.b_Index = self.buffer ? self.buffer.length : 0;
                        self.DATA(self.prompt() + self.buffer); //PRINT CMD FROM HISTORY
                    }
                },
                RIGHT: function (self, data) {
                    if (self.b_Index < self.buffer.length) {
                        self.b_Index++;
                        self.DATA(data);
                    }
                },
                LEFT: function (self, data) {
                    if (self.b_Index > 0) {
                        self.b_Index--;
                        self.DATA(data);
                    }
                },
                ENTER: function (self) {
                    if (self.buffer && self.buffer.length > 0) {
                        var agrs = self.buffer.split(' ');
                        var ns = self.cmd.split(".");
                        ns.pop();
                        if (self.functions[agrs[0]]) {
                            self.READY = false;
                            self.title += ' - ' + self.buffer;
                            if (typeof (self.functions[agrs[0]].MACRO) === 'function') {
                                if (self.functions[agrs[0]].NameSpace.indexOf('inventory') > -1) {
                                    //self.cmd = self.functions[agrs[0]].NameSpace;
                                }

                                self.functions[agrs[0]].MACRO(self, agrs[1]);
                            } else {
                                if (self.functions[agrs[0]].NameSpace.length <= self.root.length) {
                                    self.cmd = self.root;
                                } else {
                                    self.cmd = self.functions[agrs[0]].NameSpace;
                                }
                                self.title = self.cmd;
                                self.DATA('\r\n' + self.prompt());
                                self.READY = true;
                            }
                        } else if (ns.pop() == 'auth') {
                            self.AUTH(self);
                        } else {
                            self.ERROR(agrs);
                        }

                    } else {
                        self.DATA('\r\n' + self.prompt());
                    }
                    if (self.buffer.length > 0) {
                        var pos = self.history.indexOf(self.buffer);
                        pos > -1 && self.history.splice(pos, 1); //remove command if it exists in history
                        self.history.push(self.buffer); //last command always at the top

                    }
                    self.buffer = '';
                    self.b_Index = 0;
                    self.h_Index = 0;
                },
                DELETE: function (self) {
                    if (self.buffer.length > 0 && self.b_Index > 0) {
                        self.buffer = self.buffer.del(self.b_Index + 1);
                        var count = self.buffer.length - self.b_Index;
                        var cursor_left = (count > 0) ? '\x1b[' + count + 'D' : '';
                        self.DATA(self.prompt() + self.buffer + cursor_left);
                    }
                },
                BACKSPACE: function (self) {
                    if (self.buffer.length > 0 && self.b_Index > 0) {
                        self.buffer = self.buffer.del(self.b_Index);
                        self.b_Index--;
                        var steps = self.buffer.length - self.b_Index;
                        var cursor_left = (steps > 0) ? '\x1b[' + steps + 'D' : '';
                        self.DATA(self.prompt() + self.buffer + cursor_left);
                    }
                },
                QUESTION: function (self) {
                    var obj = self.functions;
                    var keys = Object.keys(obj), len = keys.length;
                    var DATA = '';
                    if (self.buffer.length == 0) {// at prompt

                        for (var i = 0; i < len; i++) {
                            if (obj[keys[i]] !== null && typeof (obj[keys[i]]) == "object") {

                                var ns = obj[keys[i]]['NameSpace'].split("."); ;
                                var ix = ns.length - self.cmd.split(".").length;

                                if (obj[keys[i]]['NameSpace'].indexOf(self.cmd) == 0 && ix <= 1) {
                                    var desc = obj[keys[i]].DESCRIPTION ? obj[keys[i]].DESCRIPTION.replace(/  /g, '').replace(/\r/g, ' ').replace(/\n/g, '').wrap(70, '\r\n\t\t\t\t') : 'No description avaiable';
                                    DATA += '\r\n   ' + keys[i].max(25) + '\t' + desc;
                                }
                            }
                        }
                    } else {
                        for (var i = 0; i < len; i++) {
                            if (keys[i].indexOf(self.buffer.split(":").pop()) == 0
                            && obj[keys[i]] !== null
                            && typeof (obj[keys[i]]) == "object") {
                                var desc = obj[keys[i]].DESCRIPTION ? obj[keys[i]].DESCRIPTION.replace(/  /g, '').replace(/\r/g, ' ').replace(/\n/g, '').wrap(70, '\r\n\t\t\t\t') : 'No description avaiable';
                                DATA += '\r\n   ' + keys[i].max(25) + '\t' + desc;
                            }
                        }
                    }
                    self.DATA(DATA);
                    self.DATA('\r\n' + self.prompt() + self.buffer);
                },
                
                TAB: function (self) {

                    var mib = self.functions;
                    var module = Object.keys(mib), len = module.length;
                    var tmp = self.buffer.split(":");
                    var input = tmp.pop();
                    var temp = (tmp.length > 0) ? ":" : '';


                    var DATA = '';
                    var is_match = false;
                    var is_object = false;
                    var is_sibling = false;
                    var siblings = [];
                    var cousins = [];
                    var family = [];


                    function longestInCommon(candidates, index) {
                        var i, ch, memo
                        do {
                            memo = null
                            for (i = 0; i < candidates.length; i++) {
                                ch = candidates[i].charAt(index)
                                if (!ch) break
                                if (!memo) memo = ch
                                else if (ch != memo) break
                            }
                        } while (i == candidates.length && ++index)

                        return candidates[0].slice(0, index)
                    }

                    if (self.buffer.length != 0) {
                        for (var i = 0; i < len; i++) {
                            is_match = module[i].indexOf(input) == 0;
                            is_object = typeof (mib[module[i]]) == "object";
                            is_sibling = mib[module[i]].NameSpace.replace('.' + module[i], '') == self.cmd;

                            if (is_match && is_object) {
                                is_sibling ? siblings.push(module[i]) : cousins.push(module[i]);
                                family.push(module[i]);
                            }
                        }
                        if (siblings.length == 1) {
                            self.buffer = tmp.join(":") + temp + siblings[0];
                        }
                        else if (siblings.length == 0 && cousins.length == 1) {
                            self.buffer = tmp.join(":") + temp + cousins[0];
                        } 
                        else if (family.length > 0)  {
                            self.buffer = tmp.join(":") + temp + longestInCommon(family, input.length);
                            DATA = "\r\n" + family.join("\r\n") + "\r\n"
                        }
                        self.b_Index = self.buffer.length;
                        self.DATA(DATA + self.prompt() + self.buffer);
                    }

                },
                KEY: function (self, data) {
                    self.buffer = self.buffer.splice(self.b_Index, 0, data);
                    self.b_Index += data.length;
                    if (self.b_Index < self.buffer.length - 1) {
                        var steps = self.buffer.length - self.b_Index;
                        var cursor_left = (steps > 0) ? '\x1b[' + steps + 'D' : '';
                        self.DATA(self.prompt() + self.buffer + cursor_left);
                    } else {
                        self.b_Index = self.buffer.length;
                        self.DATA(self.prompt() + self.buffer);
                    }
                },
                BREAK: function (self) {
                    self.shell.end();
                    self.READY = true;
                    self.title = self.cmd;
                    self.DATA('\r\n' + self.prompt());
                }
            },

            functions: {
                nms: {
                    DESCRIPTION: 'Network Management System Commands.',
                    MARCO: function (self, endpoint) { self.DATA('\r\n' + self.prompt()); },
                    OID: '1.3.6.1.3.17',
                    "OBJECT IDENTIFIER": "experimental 17",
                    "NameSpace": "iso.org.dod.internet.experimental.nms"

                },
                exit: {
                    DESCRIPTION: 'exit from the current command mode to the next highest\r\n            command mode in the CLI mode hierarchy.',
                    MACRO: function (self, endpoint) {
                        if (self.cmd == self.root) {
                            self.title = self.cmd;
                            self.DATA('\r\n' + self.prompt());
                        } else {
                            self.cmd.split(".").pop();
                            self.cmd = self.cmd.replace('.' + self.cmd.split('.').pop(), '');
                            self.title = self.cmd;
                            self.DATA('\r\n' + self.prompt());
                            self.READY = true;
                        }
                    },
                    OID: '1.3.6.1.3.17.1',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.exit"
                },
                ping: {
                    DESCRIPTION: 'ping a host.',
                    MACRO: function (self, endpoint) {
                        if (!endpoint) { endpoint = '' };
                        self.shell = null;
                        self.shell = new shell();
                        self.shell.PING(
					                    endpoint.split(':')[0], //IP:PORT
					                    function (response) {//feed
					                        self.READY ? self.READY : self.DATA('\r\n - ' + response);
					                    },
					                    function (response) {//done
					                        self.title = self.cmd;
					                        self.READY ? self.READY : self.DATA('\r\n - ' + response + '\r\n\r\n' + self.prompt());
					                        self.READY = true;
					                    }
					                    );
                    },
                    OID: '1.3.6.1.3.17.1',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.ping"
                },
                tracert: {
                    DESCRIPTION: 'trace route to a host.',
                    MACRO: function (self, endpoint) {
                        if (!endpoint) { endpoint = '' };
                        self.shell = null;
                        self.shell = new shell();
                        self.shell.TRACERT(
					                        endpoint.split(':')[0], //IP:PORT
					                        function (response) {//feed
					                            self.READY ? self.READY : self.DATA('\r\n - ' + response);
					                        },
					                        function (response) {//done
					                            self.title = self.cmd;
					                            self.READY ? self.READY : self.DATA('\r\n - ' + response + '\r\n\r\n' + self.prompt());
					                            self.READY = true;
					                        }
					                        );
                    },
                    OID: '1.3.6.1.3.17.2',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.tracert"
                },
                telnet: {
                    DESCRIPTION: 'telnet to a host.',
                    MACRO: function (self, endpoint) {
                        if (!endpoint) { endpoint = '' };
                        self.shellAgrs.host = endpoint.split(':')[0];
                        if (endpoint.split(':')[1]) { self.shellAgrs.port = endpoint.split(':')[1]; }
                        self.shellAgrs.protocol = 'telnet';
                        self.CONNECT(self);
                    },
                    OID: '1.3.6.1.3.17.3',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.telnet"
                },
                ssh: {
                    DESCRIPTION: 'ssh to a host.',
                    MACRO: function (self, endpoint) {
                        if (!endpoint) { endpoint = '' };
                        self.shellAgrs.host = endpoint.split(':')[0];
                        if (endpoint.split(':')[1]) { self.shellAgrs.port = endpoint.split(':')[1]; }
                        self.shellAgrs.protocol = 'ssh';
                        self.CONNECT(self);
                    },
                    OID: '1.3.6.1.3.17.4',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.ssh"
                },
                get: {
                    DESCRIPTION: 'Simple Network Management Protocol. Example: Get 127.0.0.1:public:sysName OR Get 127.0.0.1:public (snmp table walk from the current MIB)',
                    MACRO: function (self, endpoint) {
                        if (!endpoint) { endpoint = '' };
                        //self.title = self.cmd;
                        self.DATA('\r\n getting ' + endpoint + ' .....');
                        var data = endpoint.split(':')[2] ? endpoint.split(':')[2] : self.cmd;
                        var oidArray = data.split(".");
                        var oid = '';
                        var snmpCMD = 'getSubtree';
                        if (isNaN(data.split(".")[0]) && data.split(".").length > 1 && parseInt(data.split(".")[1]) > -1) {
                            oid = '.' + data.split(".").splice(1, 1).toString().replace(',', '.');
                            data = data.split(".").shift();
                            snmpCMD = 'get';
                        }
                        self.mib.GetObject(data, function (MIB) {
                            var options = {
                                host: endpoint.split(':')[0],
                                community: endpoint.split(':')[1] ? endpoint.split(':')[1] : '',
                                oid: '.' + (MIB.OID ? MIB.OID + oid : '1.3.1.1.1.1'),
                                timeouts: [5000, 5000, 5000, 5000]
                            };
                            session[snmpCMD](options, function (error, varbinds, baseOid) {
                                self.mib.DecodeVarBinds(varbinds, function (VarBinds) {
                                    var DATA = '';
                                    VarBinds.forEach(function (vb) {
                                        var ns = vb.NameSpace.split(".").pop();
                                        DATA += '\r\n' + (options.host + ' - ' + ns + '.' + vb.oid) + '\t:' + vb.Value;
                                    });

                                    self.DATA(DATA);
                                    self.title = self.cmd;
                                    self.DATA('\r\n' + self.prompt());
                                    self.READY = true;
                                });
                            });

                        });
                    },
                    OID: '1.3.6.1.3.17.5',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.get"
                },
                show: {
                    DESCRIPTION: 'Management information base. Example: show sysDescr OR show 1.3.6.1.2.1.1.1 OR show (Retrieve details for the current MIB)',
                    MACRO: function (self, args) {
                        if (!args) { args = self.cmd.split(".").pop() };

                        self.DATA('\r\n showing ' + args + ' .....');
                        self.mib.GetObject(args, function (MIB) {
                            var DATA = ''
                            var keys = Object.keys(MIB), len = keys.length;
                            for (var i = 0; i < len; i++) {
                                var info = (MIB[keys[i]] && (typeof (MIB[keys[i]]) === 'string' | true)) ? MIB[keys[i]].toString().replace(/  /g, '').replace(/\r/g, ' ').replace(/\n/g, '').wrap(70, '\r\n\t\t\t\t', true) : '';
                                DATA += '\r\n   ' + keys[i].max(25) + '\t' + info;
                            }
                            //DATA = JSON.stringify(MIB, null, 4).replace(/\n/g, '\r\n');
                            self.DATA('\r\n' + DATA)
                            self.title = self.cmd;
                            self.DATA('\r\n' + self.prompt());
                            self.READY = true;
                        });
                    },
                    OID: '1.3.6.1.3.17.6',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.show"

                },
                monitor: {
                    DESCRIPTION: 'Monitor information based on snmp events or polling.',
                    MACRO: function (self, args) {
                        self.title = self.cmd;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    },
                    OID: '1.3.6.1.3.17.7',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.monitor"
                },
                script: {
                    DESCRIPTION: 'Trigger scripts based on treshholds set for active snmp monitors.',
                    MACRO: function (self, args) {
                        self.title = self.cmd;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    },
                    OID: '1.3.6.1.3.17.8',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.script"
                },
                syslog: {
                    DESCRIPTION: 'Monitor real time syslog information.',
                    MACRO: function (self, args) {
                        self.title = self.cmd;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    },
                    OID: '1.3.6.1.3.17.8',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.syslog"
                },
                inventory: {
                    DESCRIPTION: 'Inventory Management System',
                    MACRO: function (self, args) {
                        self.title = self.cmd;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    },
                    OID: '1.3.6.1.3.17.9',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.inventory"
                },
                add: {
                    DESCRIPTION: 'Inventory Management System',
                    MACRO: function (self, args) {
                        self.title = self.cmd;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    },
                    OID: '1.3.6.1.3.17.9.1',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.inventory.add"
                },
                rma: {
                    DESCRIPTION: 'Return merchandise authorization',
                    MACRO: function (self, args) {
                        self.title = self.cmd;
                        self.DATA('\r\n' + self.prompt());
                        self.READY = true;
                    },
                    OID: '1.3.6.1.3.17.9.2',
                    "NameSpace": "iso.org.dod.internet.experimental.nms.inventory.rma"
                }
            },

            interpret: function (data) {
                var self = this;
                if (self.shell._connected) {
                    self.shell.write(data);
                } else if (self.READY) {
                    if (!self.buffer) { self.buffer = ''; }
                    switch (data) {
                        case '\x1b[A': //up arrow : scroll cmd history
                            self.input.UP(self);
                            return;
                            break;
                        case '\x1b[B': //down arrow : scroll cmd history
                            self.input.DOWN(self);
                            return;
                            break;
                        case '\x1b[C': //right arrow : cursor/buffer index++
                            self.input.RIGHT(self, data);
                            return;
                            break;
                        case '\x1b[D': //left arrow : cursor/buffer index--
                            self.input.LEFT(self, data);
                            return;
                            break;
                        default:
                            break;
                    }
                    switch (data.charCodeAt(0)) {
                        case 13: //ENTER
                            self.input.ENTER(self);
                            break;
                        case 27: //DELETE - delete current character
                            self.input.DELETE(self);
                            break;
                        case 127: //BACKSPACE - delete previous character
                            self.input.BACKSPACE(self);
                            break;
                        case 63: //? - list commands
                            self.input.QUESTION(self);
                            break;
                        case 9: //TAB - tab complete
                            self.input.TAB(self);
                            break;
                        default:
                            self.input.KEY(self, data);
                            break;
                    }
                } else {
                    switch (data.charCodeAt(0)) {
                        case 3: //CTRL+C
                            self.input.BREAK(self);
                        default:
                            break;
                    }
                }

            }
        });
    };
