var fs = require('fs');
var Char = require('../lib/util-character');
var MIBParser = {
    CurrentModule: '',
    CurrentPath: '',
    CurrentObject: {},
    CurrentSymbol: '',
    CurrentType: '',
    Modules: {},
    CharBuffer: {
        builder: "",
        Table: {},
        RowIndex: 0,
        ColumnIndex: 0,
        PreviousRow: 0,
        Append: function (char) {
            this.builder += char;
        },
        Fill: function (FileName, row, column) {
            if (this.builder.length == 0) {
                return;
            }
            column = (column - this.builder.length);
            var symbol = this.builder.toString();
            this.builder = "";
            this.builder.length = 0;
            if (!this.Table[FileName]) {
                this.Table[FileName] = [];
            }
            if (row == 0) {
                this.RowIndex = 0;
                this.PreviousRow = 0;
            }
            if (this.PreviousRow < row) {
                this.PreviousRow = row;
                this.RowIndex++;
                this.ColumnIndex = 0;
            }
            if (!this.Table[FileName][this.RowIndex]) {
                this.Table[FileName][this.RowIndex] = [];
            }
            if (symbol == 'IDENTIFIER' &&
            this.Table[FileName][this.RowIndex][this.ColumnIndex - 1] == 'OBJECT') {
                this.Table[FileName][this.RowIndex][this.ColumnIndex - 1] = 'OBJECT IDENTIFIER';
            } else {
                this.Table[FileName][this.RowIndex][this.ColumnIndex] = symbol;
                this.ColumnIndex++;
            }
        }
    },
    ImportModule: function (FileName) {
        this.ParseFile(FileName.split('//')[1].split('.')[0], fs.readFileSync(FileName).toString());
        this.CharBuffer.RowIndex = 0;
        this.CharBuffer.ColumnIndex = 0;
    },
    ParseFile: function (FileName, Contents) {
        var lines = Contents.split('\n');
        var line = '';
        var i = 0;
        while ((line = lines[i]) != null && i <= lines.length) {
            this.ParseLine(FileName, line, i);
            i++;
        }
    },
    ParseLine: function (FileName, line, row) {
        line = line + "\n";
        for (var i = 0; i < line.length; i++) {
            var char = line.charAt(i);
            var moveNext = this.ParseChar(FileName, char, row, i);
            if (moveNext) {
                break;
            }
        }
    },
    ParseChar: function (FileName, char, row, column) {
        switch (char) {
            case '\r':
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case '\n':
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case '[':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case ']':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case '{':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case '}':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case '(':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case ')':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case ',':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case ';':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case ' ':
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            case '"':
                this.CharBuffer.Fill(FileName, row, column);
                this.CharBuffer.Append(char);
                this.CharBuffer.Fill(FileName, row, column);
                return false;
                break;
            default:
                if (Char.IsControl(char)) {
                }
                else {
                    this.CharBuffer.Append(char);
                }
                break;
        }
        return false;
    },
    CompileModules: function () {
        var obj = this.CharBuffer.Table
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                this.CurrentModule = obj[prop][0][0]; //Module Name
                //console.log(obj[prop][obj[prop].length - 1][obj[prop][obj[prop].length - 1].length - 1]); //END
                for (var r = 0; r < obj[prop].length; r++) {
                    for (var c = 0; c < obj[prop][r].length; c++) {

                        if (obj[prop][r][c].toUpperCase() === obj[prop][r][c] && obj[prop][r][c].replace(/[^a-z]/gi, '').length > 1) {
                            //console.log(obj[prop][r][c]);
                        } else {

                        }


                        switch (obj[prop][r][c]) {
                            case 'DEFINITIONS':
                                if (!this.Modules[this.CurrentModule]) {
                                    this.Modules[this.CurrentModule] = {};
                                    this.Modules[this.CurrentModule]['DEFINITIONS'] = {};
                                    this.CurrentPath = this.CurrentModule + '.DEFINITIONS';
                                    this.CurrentType = '';
                                }
                                break;
                            case 'EXPORTS':
                                this.CurrentPath = this.CurrentModule + '.DEFINITIONS.' + obj[prop][r][c]
                                this.Modules[this.CurrentModule]['DEFINITIONS'][obj[prop][r][c]] = [];
                                this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'][obj[prop][r][c]];
                                this.CurrentType = 'array';
                                break;
                            case 'IMPORTS':
                                this.CurrentPath = this.CurrentModule + '.DEFINITIONS.' + obj[prop][r][c]
                                this.Modules[this.CurrentModule]['DEFINITIONS'][obj[prop][r][c]] = [];
                                this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'][obj[prop][r][c]];
                                this.CurrentType = 'array';
                                break;
                            case 'OBJECT IDENTIFIER':
                                //this.CurrentObject['ObjectType'] == obj[prop][r][c];
                                if (this.CurrentSymbol == '::=') {
                                    this.CurrentPath = this.CurrentModule + '.DEFINITIONS'
                                    this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'];
                                    this.CurrentType = '';
                                }
                                this.CurrentSymbol = '';
                                break;
                            case 'CHOICE':
                                this.CurrentSymbol == obj[prop][r][c];
                                break;
                            case '::=':
                                console.log(this.CurrentPath, this.CurrentSymbol);
                                this.CurrentSymbol = '::=';
                                break;
                            case ';':
                                this.CurrentPath = this.CurrentModule + '.DEFINITIONS'
                                this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'];
                                this.CurrentType = '';
                            case '{':
                                if (obj[prop][r][c + 3] && obj[prop][r][c + 3] == '}') {
                                    var parent = obj[prop][r][c + 1];
                                    var oid = obj[prop][r][c + 2];
                                    console.log(parent, oid);
                                    this.CurrentObject['parent'] = parent;
                                    this.CurrentObject['oid'] = oid;
                                    c++;
                                    c++;
                                } else if (obj[prop][r][c + 1] && obj[prop][r][c + 1] == 'iso') {
                                    var parent = '';
                                    var i = 1;
                                    while (i <= 9) {
                                        parent += obj[prop][r][c + i] + ' ';
                                        i++;
                                    }
                                    var oid = obj[prop][r][c + 10];
                                    console.log(parent, oid);
                                    this.CurrentObject['parent'] = parent;
                                    this.CurrentObject['oid'] = oid;
                                    c = c + 10;
                                }
                                this.CurrentType = 'object';
                                break;
                            case '}':
                                this.CurrentPath = this.CurrentModule + '.DEFINITIONS'
                                this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'];
                                this.CurrentSymbol = '';
                                this.CurrentType = '';
                                break;
                            case '(':
                                break;
                            case ')':
                                break;
                            case 'BEGIN':
                                break;
                            case 'END':
                                this.CurrentPath = this.CurrentModule + '.DEFINITIONS'
                                this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'];
                                this.CurrentType = '';
                                break;
                            case '--':
                                //skip comment
                                c = obj[prop][r].length;
                                break;
                            default:
                                if (this.CurrentPath == this.CurrentModule + '.DEFINITIONS') {
                                    this.Modules[this.CurrentModule]['DEFINITIONS'][obj[prop][r][c]] = {};
                                    this.CurrentPath = this.CurrentModule + '.DEFINITIONS.' + obj[prop][r][c];
                                    this.CurrentObject = this.Modules[this.CurrentModule]['DEFINITIONS'][obj[prop][r][c]];
                                    this.CurrentSymbol = '';
                                } else {
                                    if (!this.CurrentObject[obj[prop][r][c]]) {
                                        //this.CurrentObject[obj[prop][r][c]] = '';
                                        //this.CurrentObject = this.CurrentObject[obj[prop][r][c]];
                                    }
                                    if (Array.isArray(this.CurrentObject)) {
                                        if (obj[prop][r][c] != ",") {
                                            this.CurrentObject.push(obj[prop][r][c]);
                                        }
                                    }
                                }
                        }






                        if (obj[prop][r][c]) {
                            //console.log(obj[prop][r][c]);
                        }
                    }
                }
            }
        }
    }
};


MIBParser.ImportModule("../RFC_BASE_MINIMUM//RFC1155-SMI.MIB");
//MIBParser.ImportModule("../RFC_BASE_MINIMUM//SNMPv2-SMI.mib");
//MIBParser.ImportModule("../RFC_BASE_MINIMUM//SNMPv2-MIB.MIB");
//MIBParser.CompileModules();
console.log(JSON.stringify(MIBParser.Modules,null,4));
