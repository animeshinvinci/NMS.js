
var shell = require('../lib/util-shell');
var term = require('../lib/term');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Device = function (shellAgrs) {
    var _self = this;
    _self.oids = {};
    _self.mode = {};
    _self.mode.privileged = false;
    _self.mode.CMD_req = false;
    _self.mode.CMD_res = false;
    _self.output = "";
    _self.ready = false;
    _self.cmdCallback;
    _self._term = new term(400, 60);
    _self._term.open();
    _self._shell = new shell();
    _self._shellAgrs = shellAgrs
    _self._shell.on('data', function (data) {
        _self._term.write(data.toString(), function (dataString) {
            _self.output += dataString;
            if (_self.output.toLowerCase().indexOf('more') > -1) {
                _self.execute(' ');
            }
            if (dataString.indexOf("#") > -1) {
                _self.mode.CMD_res = true;
                _self.mode.CMD_req = false;
                var tmp = _self.output.split('\n');
                _self.output = '';
                for (var i = 0; i < tmp.length; i++) {
                    if (tmp[i].toLowerCase().indexOf('more') == -1) {
                        _self.output += tmp[i] + '\n';
                    }
                }
                _self.emit('ready', _self.output);
                _self.output = '';
            }
        });

    });
    _self._shell.on('error', function (error) {
        console.log("error", error);
    });
    _self._shell.on('timeout', function () {
        console.log("timeout");
    });
    _self._shell.on('close', function (had_error) {
        console.log("close", had_error);
    });
    _self._shell.on('end', function () {
        console.log("end");
    });

}
util.inherits(Device, EventEmitter);


Device.prototype.connect = function () {
    _self = this;
    _self._shell.connect(_self._shellAgrs);
}
Device.prototype.execute = function (cmd) {
    _self = this;
    if (cmd.length > 1) {
        cmd += String.fromCharCode(13);
        _self.mode.CMD_req = true;
        _self.mode.CMD_res = false;
    }

    _self._shell.write(cmd);

}

module.exports = exports = Device;
exports.Device = Device;
exports.native = undefined;