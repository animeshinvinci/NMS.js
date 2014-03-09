
var $ = require('jquery');
var Char = require('../lib/util-character');
var CharBuffer = function () {
    var _this = {
        _builder: "",
        Append: function (current) {
            this._builder += current;
        },
        Fill: function (symbols, file, row, column) {
            if (this._builder.length == 0) {
                return;
            }
            column = (column - this._builder.length);
            var content = this._builder.toString();
            //content.replace(/\[[^m]*m/g, ' ');//term escape sequences[7m--More--[m
            this._builder = "";
            this._builder.length = 0;
            symbols.push(new Symbol(file, content, row, column));
        }
    }
    return _this;
}
/**
* Symbol.cs 
*/
function Symbol(file, text, row, column) {
    this.file = file;
    this.text = text;
    this.row = row;
    this.column = column;
};
/**
* Lexer.cs 
*/
function Lexer() {
    this._symbols = [];
    this._buffer = new CharBuffer();
    this._stringSection = new Boolean();
    this.file;
};
Lexer.prototype.Parse = function (file, string, callback) {
    var lines = string.split('\n');
    var line;
    var i = 0;
    this.file = file;
    while ((line = lines[i]) != null && i <= lines.length) {
        this.ParseLine(file, line, i);
        //console.log("line(" + i + ")\t:" + line);
        i++;
    }
    callback(this._symbols);
    this._symbols = [];
}
Lexer.prototype.ParseLine = function (file, line, row) {
    line = line + "\n";
    var TempLine = "";
    for (var i = 0; i < line.length; i++) {
        var current = line.charAt(i);
        //process backspace
        if (current == "\b") {
            TempLine = TempLine.substring(0, TempLine.length - 1)
        }
        else {
            TempLine += current
        }
    }
    line = TempLine;
    for (var i = 0; i < line.length; i++) {
        var current = line.charAt(i);
        var moveNext = this.ParseChar(file, current, row, i); //bool
        //console.log(i, current, moveNext);
        if (moveNext) {
            break;
        }
    }
}
Lexer.prototype.ParseChar = function (file, current, row, column) {
    switch (current) {
        case '\r':
            if (!this._stringSection) {
                this._buffer.Fill(this._symbols, file, row, column);
                this._stringSection = false;
                return false;
            }
            break;
        case '\n':
            if (!this._stringSection) {
                this._buffer.Fill(this._symbols, file, row, column);
                this._stringSection = false;
                return false;
            }
            break;
        case ' ':
            if (!this._stringSection) {
                this._buffer.Fill(this._symbols, file, row, column);
                this._stringSection = true;
                return false;
            }
            break;
        default:
            if (Char.IsControl(current)) {
            }
            else {
                this._buffer.Append(current);
                this._stringSection = false;
            }
            break;
    }
    return false;
}
Lexer.prototype.buildJSON = function (docName, symbols, delimiter, callback) {
    var _self = this;
    var delimiter = delimiter;

    var Rows = [];
    var RowObjects = [];
    for (var i = 0; i < symbols.length; i++) {
        if (!Rows[symbols[i].row]) {
            Rows[symbols[i].row] = [];
        }
        Rows[symbols[i].row].push(symbols[i]);
    }
    for (var r = 0; r < Rows.length; r++) {
        if (Rows[r]) {
            for (var c = 0; c < Rows[r].length; c++) {
                var space = " ";
                var this_Object = { nest: 0, parent: false, fqn: docName, name: '', value: '' };
                this_Object.nest = Rows[r][0].column;
                this_Object.name = Rows[r][0].text;
                c++;
                while (c < Rows[r].length) {
                    if (c == Rows[r].length - 1) { space = ""; }
                    this_Object.value += Rows[r][c].text + space;
                    c++;
                }
                
                var poo = _self.BannerHack(this_Object, Rows, r);
                
                this_Object = poo['this_Object']
                r = poo['r']
                //console.log(r, Rows.length);
                RowObjects.push(this_Object);
            }
        }
    }
    //console.log(r, Rows.length);
    var json = {};
    for (var i = 0; i < RowObjects.length; i++) {
        //Parent
        if (RowObjects[i + 1] && RowObjects[i].nest < RowObjects[i + 1].nest) {
            RowObjects[i].parent = true;
        }
        if (i > 0) {
            //Child
            if (RowObjects[i].nest > RowObjects[i - 1].nest) {
                RowObjects[i - 1].parent = true;
                RowObjects[i].fqn = RowObjects[i - 1].fqn + delimiter + RowObjects[i - 1].name + delimiter + RowObjects[i - 1].value;
            }
            //Sibling
            if (RowObjects[i].nest == RowObjects[i - 1].nest) {
                RowObjects[i].fqn = RowObjects[i - 1].fqn;
            }
            //Not Child
            if (RowObjects[i].nest < RowObjects[i - 1].nest) {
                RowObjects[i - 1].parent = false;
            }
        }
        var val = {};

        val = _self.rowObject(json[RowObjects[i].fqn + delimiter + RowObjects[i].name], RowObjects[i], RowObjects[i + 1])
        json[RowObjects[i].fqn + delimiter + RowObjects[i].name] = val;
    }

    //console.log(JSON.stringify(json, null, '\t'));
    _self.djson2json(json, delimiter, callback)
}
Lexer.prototype.rowObject = function (json, this_Object, next_Object) {
    var val = this_Object.value;
    if ($.type(json) == 'undefined') {
        if (this_Object.parent) {
            json = {};
            json[val] = '';
        } else {
            json = val;
        }
    }
    else if ($.type(json) == 'string') {

        var tmpString = json;
        json = [];
        json.push(tmpString);
        json.push(val);
    }
    else if ($.type(json) == 'array') {
        if (this_Object.parent) {
            var tmpArray = json;
            json = {};
            for (var v = 0; v < tmpArray.length; v++) {
                if (!json[v]) {
                    json[v] = tmpArray[v];
                }
            }
            if (!json[val]) {
                json[val] = '';
            } else {

            }

        } else {

            json.push(val);
        }
    }
    else if ($.type(json) == 'object') {
        if (this_Object.parent) {
            json = {};
            // json[val] = '';
            //fix 
        } else {
            var i = 0
            for (o in json) {
                i++;
            }
            json[i] = val;
        }
    }
    return json;
}
Lexer.prototype.ion2json = function (docName, data, delimiter, callback) {
    var _self = this;
    _self.Parse(docName, data, function (_symbols) {
        _self.buildJSON(docName, _symbols, delimiter, function (json) {
            callback(json);
        });
    });

}
Lexer.prototype.djson2json = function (json, delimiter, callback) {
    var bracket = {}, t, parts, part;
    for (var k in json) {
        t = bracket;
        parts = k.split(delimiter);

        var key = parts.pop(); //last part

        while (parts.length) {
            part = parts.shift(); //first part
            t = t[part] = t[part] || {};
        }
        t[key] = json[k];
    }
    //console.log(bracket);
    // console.log(JSON.stringify(bracket, null, '\t'));
    callback(bracket);
}
Lexer.prototype.BannerHack = function (this_Object, Rows, r) {
    //Banner HACK
    var space = " ";
    if (this_Object.value.indexOf('motd') > -1 && Rows[r + 1] && Rows[r + 1][0].text != 'banner') {
        this_Object.name += ' ' + this_Object.value;

        r++;
        var motd = Rows[r][0].text

        //console.log(Rows[r][0].text);
        motd = motd.substring(0, 20);
        //console.log(r, motd);
        this_Object.value = motd + "\r\n";
        r++;
        while (!Rows[r] && r < Rows.length) {
            r++;
        }

        // while (Rows[r][0].text.substring(0, 40).indexOf(motd) == -1 && motd.indexOf(Rows[r][0].text.substring(0, 40)) == -1) {
        while (Rows[r] && Rows[r][0].text.substring(0, 20).indexOf(motd) == -1 && r < Rows.length) {
            //console.log(Rows[r][0].text);
            var cc = 0;
            space = " ";
            while (cc < Rows[r].length) {
                if (cc == Rows[r].length - 1) { space = " "; }
                this_Object.value += Rows[r][cc].text + space;
                cc++;
            }
            r++;
            while (!Rows[r] && r < Rows.length) {
                r++;
            }
        }
        //console.log(r, Rows[r][0].text);
        if (Rows[r]) {
            this_Object.value += Rows[r][0].text;
        }

    }
    //
    return ({ 'this_Object': this_Object, 'Rows': Rows, 'r': r })
}
module.exports = exports = Lexer;
exports.Lexer = Lexer;
exports.Char = Char;
exports.native = undefined;