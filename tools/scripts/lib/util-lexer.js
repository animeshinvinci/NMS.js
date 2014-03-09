var fs = require('fs');
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
    this._Table = [];
};
Lexer.prototype.Parse = function (file, string, callback) {
	var _self = this;
    var lines = string.split('\n');
    var line;
    var i = 0;
    this.file = file;
    while ((line = lines[i]) != null && i <= lines.length) {
        this.ParseLine(file, line, i);
        //console.log("line(" + i + ")\t:" + line);
        i++;
    }

    _self._Table = [];
    for (var i = 0; i < _self._symbols.length; i++) {
    	if (!_self._Table[_self._symbols[i].row]) {
    		_self._Table[_self._symbols[i].row] = [];
    	}
    	_self._Table[_self._symbols[i].row].push(_self._symbols[i]);
    }
    if (callback) {
    	callback(_self._symbols);
    }

    _self._symbols = [];
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
                this._buffer.Fill(this._symbols, file, row, column);
                return false;
            break;
        case '\n':
                this._buffer.Fill(this._symbols, file, row, column);
                return false;
            break;
    	case '[':
    			this._buffer.Fill(this._symbols, file, row, column);
    			this._buffer.Append(current);
    			this._buffer.Fill(this._symbols, file, row, column);
    			return false;
    		break;
    	case ']':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
    	case '{':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
    	case '}':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
    	case '(':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
    	case ')':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
    	case ',':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
    	case ';':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
        case ' ':
                this._buffer.Fill(this._symbols, file, row, column);
                return false;
                break;
    	case '"':
    		this._buffer.Fill(this._symbols, file, row, column);
    		this._buffer.Append(current);
    		this._buffer.Fill(this._symbols, file, row, column);
    		return false;
    		break;
        default:
            if (Char.IsControl(current)) {
            }
            else {
                this._buffer.Append(current);
                //this._stringSection = false;
            }
            break;
    }
    return false;
}
Lexer.prototype.buildJSON = function (filename, symbols, callback) {
	var _self = this;
	var delimiter = "::";

	var Rows = [];
	var RowObjects = [];
	for (var i = 0; i < symbols.length; i++) {
		if (!Rows[symbols[i].row]) {
			Rows[symbols[i].row] = [];
		}
		Rows[symbols[i].row].push(symbols[i]);
	}
	for (var r = 0; r < Rows.length; r++) {

		if (Rows[r] && Rows[r][0].text.toLowerCase().indexOf('more') == -1) {
			//if (Rows[r]) {
			for (var c = 0; c < Rows[r].length; c++) {
				var space = " ";
				var this_Object = { nest: 0, parent: false, fqn: filename, dotNotation: '', name: '', value: '' };
				this_Object.nest = Rows[r][0].column;
				this_Object.name = Rows[r][0].text;
				c++;
				while (c < Rows[r].length) {
					if (c == Rows[r].length - 1) { space = ""; }
					this_Object.value += Rows[r][c].text + space;
					c++;
				}

				//Banner HACK
				if (this_Object.value.indexOf('motd') > -1 && Rows[r + 1] && Rows[r + 1][0].text != 'banner') {
					this_Object.name += ' ' + this_Object.value;

					r++;
					var motd = Rows[r][0].text
					//console.log(Rows[r][0].text);
					this_Object.value = motd + "\r\n";
					r++;
					while (!Rows[r]) {
						r++;
					}
					while (Rows[r][0].text.indexOf(motd) == -1 && motd.indexOf(Rows[r][0].text) == -1) {
						//console.log(Rows[r][0].text);
						var cc = 0;
						space = " ";
						while (cc < Rows[r].length) {
							if (cc == Rows[r].length - 1) { space = " "; }
							this_Object.value += Rows[r][cc].text + space;
							cc++;
						}
						r++;
						while (!Rows[r]) {
							r++;
						}
					}
					this_Object.value += Rows[r][0].text;
				}
				//

				RowObjects.push(this_Object);
			}
		}
	}

	var json = {};
	for (var i = 0; i < RowObjects.length; i++) {
		//Parent
		if (RowObjects[i + 1] && RowObjects[i].nest < RowObjects[i + 1].nest) {
			RowObjects[i].parent = true;
		}
		if (i > 0) {
			//Child
			if (RowObjects[i].nest > RowObjects[i - 1].nest) {
				RowObjects[i].fqn = RowObjects[i - 1].fqn + delimiter + RowObjects[i - 1].name + delimiter + RowObjects[i - 1].value;
			}
			//Sibling
			if (RowObjects[i].nest == RowObjects[i - 1].nest) {
				RowObjects[i].fqn = RowObjects[i - 1].fqn;
			}
			//Parent 'step up'
			if (RowObjects[i].nest < RowObjects[i - 1].nest) {
			}
		}
		var val = {};
		//ip access-list extended HACK
		if (RowObjects[i].name == 'permit' || RowObjects[i].name == 'deny') {
			RowObjects[i].value = RowObjects[i].name + ' ' + RowObjects[i].value;
			val = _self.rowObject(json[RowObjects[i].fqn], RowObjects[i], RowObjects[i + 1])
			json[RowObjects[i].fqn] = val;
		} else {
			val = _self.rowObject(json[RowObjects[i].fqn + delimiter + RowObjects[i].name], RowObjects[i], RowObjects[i + 1])
			json[RowObjects[i].fqn + delimiter + RowObjects[i].name] = val;
		}


	}

	//console.log(JSON.stringify(json, null, '\t'));
	//console.log(JSON.stringify(deepen(jsondeepen), null, '\t'));
	//callback(deepen(jsondeepen))
	callback(_self.delimiter2bracket(json, delimiter));
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
			}

		} else {

			json.push(val);
		}
	}
	else if ($.type(json) == 'object') {
		if (this_Object.parent) {
			json = {};
			json[val] = '';
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
Lexer.prototype.ios2json = function (filename,callback) {
	var _self = this;
	var fs = require('fs')
	fs.readFile(filename, 'utf8', function (err, data) {
		if (err) throw err;
		//console.log('OK: ' + filename);
		_self.Parse(filename, data, function (_symbols) {
			_self.buildJSON(filename,_symbols, function (json) {
				callback(json);
			});
		});
	});

}
Lexer.prototype.delimiter2bracket = function (json, delimiter) {
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
	return bracket;
}
module.exports = exports = Lexer;
exports.Lexer = Lexer;
exports.Char = Char;
exports.native = undefined;
/*
{
	"response": {
		"@version": "1.0.1783.v1",
		"@status": "0",
		"name": "getMibObjectInfo",
		"mibName": "IF-MIB",
		"OID": "1.3.6.1.2.1.2.2.1.10",
		"objectDescription": "The total number of octets received on...",
		"objectName": "ifInOctets",
		"objectType": 0
	}
}*/