//var Device = new require('./lib/util-device');
//var Lexer = require('./lib/util-lexer');
var IP = new require('./lib/util-ip');
var ping = require("net-ping");


//var fs = require('fs');
//var lex = new Lexer();






var Networks = [];
var IP_List = [];
Networks.push("10.20.10.0/24");
var ipMaskArray = [];
for (var i = 0; i < 33; i++) {
    var ipMask = new IP("0");
    ipMask.decimal = -(0xffffffff << (32 - i));
    ipMaskArray[i] = {
        ip: ipMask,
        cidr: i
    };
};
for (var i = 0; i < Networks.length; i++) {
    var mask = ipMaskArray[parseInt(Networks[i].split("/")[1])];
    var ip = new IP(Networks[i].split("/")[0]);
    console.log("Network: " + Networks[i], "\r\nHosts: " + mask.ip.decimal);
    for (var ii = parseInt(ip.decimal); ii < (ip.decimal + mask.ip.decimal); ii++) {
        IP_List.push(new IP(ii.toString()).toDottedQuad());
    }
};
var options = {
    networkProtocol: ping.NetworkProtocol.IPv4,
    packetSize: 16,
    retries: 1,
    sessionId: (process.pid % 65535),
    timeout: 2000,
    ttl: 128
};




var pinger = ping.createSession(options);
pinger.on("error", function (error) {
    console.trace(error.toString());
});
var calls = 0
var callbacks = 0
var alive = 0;
var dead = 0;

var Alive = {};
var Dead = {};

var loop = function () {
    for (var index in IP_List) {

        calls++;

        pinger.pingHost(IP_List[index], function (error, target, sent, rcvd) {
            callbacks++;
            var ms = rcvd - sent;
            var response = { data: '' };
            if (error) {
                response.data = target + ": " + error.toString();
                if (Alive[target]) {
                    console.log(Alive[target], "Host lost: " + target);
                }
                dead++;
            }
            else {
                response.data = target + ": Alive (ms=" + ms + ")";
                alive++;
                if (!Alive[target]) {
                    var myDate = new Date();
                    Alive[target] =  myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + ":" + myDate.getMilliseconds();
                    console.log(Alive[target], "New host found: " + target);
                } else {
                    Alive[target] = new Date();
                }

            }

            if (calls == callbacks) {
                var myDate = new Date();
                var ts = myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + ":" + myDate.getMilliseconds();
                console.log(ts,'Scanned ' + callbacks + " hosts. Alive: " + alive + " Dead: " + dead);
                //console.log(Alive);
                alive = 0;
                dead = 0;
                calls = 0;
                callbacks = 0;
                setTimeout(loop, 5000);
            }

        })


    }
}

setTimeout(loop, 5000);





