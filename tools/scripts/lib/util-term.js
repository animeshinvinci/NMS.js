/**
* States
*/

var normal = 0
  , escaped = 1
  , csi = 2
  , osc = 3
  , charset = 4
  , dcs = 5
  , ignore = 6;

var isMac = ~navigator.userAgent.indexOf('Mac');
var Terminal = function () {
    this.state = 0;
    this.x = 0;
    this.y = 0;
    this.applicationCursor = true;
    this.applicationKeypad = true;
};
Terminal.prototype.write = function (data, callback) {
    var l = data.length
    , i = 0
    , j
    , cs
    , ch;

    var dataString = '';


    for (; i < l; i++) {
        ch = data[i];
        switch (this.state) {
            case normal:
                switch (ch) {
                    // '\0'       
                    // case '\0':       
                    // case '\200':       
                    //   break;       

                    // '\a'       
                    case '\x07':
                        //this.bell();
                        break;

                    // '\n', '\v', '\f'       
                    case '\n':
                    case '\x0b':
                    case '\x0c':
                        dataString += ch;
                        break;

                    // '\r'       
                    case '\r':
                        //this.x = 0;
                        break;

                    // '\b'       
                    case '\x08':
                    /*
                        if (this.x > 0) {
                            this.x--;
                        }
                        */
                        dataString = dataString.substring(0, dataString.length - 1);
                        break;
                        
                        
                        // '\t'     
                    case '\t':
                        //this.x = this.nextStop();
                        break;

                    // shift out       
                    case '\x0e':
                        //this.setgLevel(1);
                        break;

                    // shift in       
                    case '\x0f':
                        //this.setgLevel(0);
                        break;

                    // '\e'       
                    case '\x1b':
                        this.state = escaped;
                        break;

                    default:
                        dataString += ch;
                        break;

                }
                break;
            case escaped:
                switch (ch) {
                    // ESC [ Control Sequence Introducer ( CSI is 0x9b).       
                    case '[':
                        this.params = [];
                        this.currentParam = 0;
                        this.state = csi;
                        break;

                    // ESC ] Operating System Command ( OSC is 0x9d).       
                    case ']':
                        this.params = [];
                        this.currentParam = 0;
                        this.state = osc;
                        break;

                    // ESC P Device Control String ( DCS is 0x90).       
                    case 'P':
                        this.params = [];
                        this.currentParam = 0;
                        this.state = dcs;
                        break;

                    // ESC _ Application Program Command ( APC is 0x9f).       
                    case '_':
                        this.state = ignore;
                        break;

                    // ESC ^ Privacy Message ( PM is 0x9e).       
                    case '^':
                        this.state = ignore;
                        break;

                    // ESC c Full Reset (RIS).       
                    case 'c':
                        //this.reset();
                        break;

                    // ESC E Next Line ( NEL is 0x85).       
                    // ESC D Index ( IND is 0x84).       
                    case 'E':
                        this.x = 0;
                        ;
                    case 'D':
                        this.index();
                        break;

                    // ESC M Reverse Index ( RI is 0x8d).       
                    case 'M':
                        this.reverseIndex();
                        break;

                    // ESC % Select default/utf-8 character set.       
                    // @ = default, G = utf-8       
                    case '%':
                        //this.charset = null;
                        this.setgLevel(0);
                        this.setgCharset(0, Terminal.charsets.US);
                        this.state = normal;
                        i++;
                        break;

                    // ESC (,),*,+,-,. Designate G0-G2 Character Set.       
                    case '(': // <-- this seems to get all the attention
                    case ')':
                    case '*':
                    case '+':
                    case '-':
                    case '.':
                        switch (ch) {
                            case '(':
                                this.gcharset = 0;
                                break;
                            case ')':
                                this.gcharset = 1;
                                break;
                            case '*':
                                this.gcharset = 2;
                                break;
                            case '+':
                                this.gcharset = 3;
                                break;
                            case '-':
                                this.gcharset = 1;
                                break;
                            case '.':
                                this.gcharset = 2;
                                break;
                        }
                        this.state = charset;
                        break;

                    // Designate G3 Character Set (VT300).       
                    // A = ISO Latin-1 Supplemental.       
                    // Not implemented.       
                    case '/':
                        this.gcharset = 3;
                        this.state = charset;
                        i--;
                        break;

                    // ESC N       
                    // Single Shift Select of G2 Character Set       
                    // ( SS2 is 0x8e). This affects next character only.       
                    case 'N':
                        break;
                    // ESC O       
                    // Single Shift Select of G3 Character Set       
                    // ( SS3 is 0x8f). This affects next character only.       
                    case 'O':
                        break;
                    // ESC n       
                    // Invoke the G2 Character Set as GL (LS2).       
                    case 'n':
                        this.setgLevel(2);
                        break;
                    // ESC o       
                    // Invoke the G3 Character Set as GL (LS3).       
                    case 'o':
                        this.setgLevel(3);
                        break;
                    // ESC |       
                    // Invoke the G3 Character Set as GR (LS3R).       
                    case '|':
                        this.setgLevel(3);
                        break;
                    // ESC }       
                    // Invoke the G2 Character Set as GR (LS2R).       
                    case '}':
                        this.setgLevel(2);
                        break;
                    // ESC ~       
                    // Invoke the G1 Character Set as GR (LS1R).       
                    case '~':
                        this.setgLevel(1);
                        break;

                    // ESC 7 Save Cursor (DECSC).       
                    case '7':
                        this.saveCursor();
                        this.state = normal;
                        break;

                    // ESC 8 Restore Cursor (DECRC).       
                    case '8':
                        this.restoreCursor();
                        this.state = normal;
                        break;

                    // ESC # 3 DEC line height/width       
                    case '#':
                        this.state = normal;
                        i++;
                        break;

                    // ESC H Tab Set (HTS is 0x88).       
                    case 'H':
                        this.tabSet();
                        break;

                    // ESC = Application Keypad (DECPAM).       
                    case '=':
                        this.log('Serial port requested application keypad.');
                        this.applicationKeypad = true;
                        this.state = normal;
                        break;

                    // ESC > Normal Keypad (DECPNM).       
                    case '>':
                        this.log('Switching back to normal keypad.');
                        this.applicationKeypad = false;
                        this.state = normal;
                        break;

                    default:
                        this.state = normal;
                        this.error('Unknown ESC control: %s.', ch);
                        break;
                }
                break;

            case charset:
                switch (ch) {
                    case '0': // DEC Special Character and Line Drawing Set.
                        cs = Terminal.charsets.SCLD;
                        break;
                    case 'A': // UK
                        cs = Terminal.charsets.UK;
                        break;
                    case 'B': // United States (USASCII).
                        cs = Terminal.charsets.US;
                        break;
                    case '4': // Dutch
                        cs = Terminal.charsets.Dutch;
                        break;
                    case 'C': // Finnish
                    case '5':
                        cs = Terminal.charsets.Finnish;
                        break;
                    case 'R': // French
                        cs = Terminal.charsets.French;
                        break;
                    case 'Q': // FrenchCanadian
                        cs = Terminal.charsets.FrenchCanadian;
                        break;
                    case 'K': // German
                        cs = Terminal.charsets.German;
                        break;
                    case 'Y': // Italian
                        cs = Terminal.charsets.Italian;
                        break;
                    case 'E': // NorwegianDanish
                    case '6':
                        cs = Terminal.charsets.NorwegianDanish;
                        break;
                    case 'Z': // Spanish
                        cs = Terminal.charsets.Spanish;
                        break;
                    case 'H': // Swedish
                    case '7':
                        cs = Terminal.charsets.Swedish;
                        break;
                    case '=': // Swiss
                        cs = Terminal.charsets.Swiss;
                        break;
                    case '/': // ISOLatin (actually /A)
                        cs = Terminal.charsets.ISOLatin;
                        i++;
                        break;
                    default: // Default
                        cs = Terminal.charsets.US;
                        break;
                }
                this.setgCharset(this.gcharset, cs);
                this.gcharset = null;
                this.state = normal;
                break;

            case osc:
                if (ch === '\x1b' || ch === '\x07') {
                    if (ch === '\x1b') i++;

                    this.params.push(this.currentParam);

                    switch (this.params[0]) {
                        case 0:
                        case 1:
                        case 2:
                            if (this.params[1]) {
                                this.title = this.params[1];
                                this.handleTitle(this.title);
                            }
                            break;
                        case 3:
                            // set X property
                            break;
                        case 4:
                        case 5:
                            // change dynamic colors
                            break;
                        case 10:
                        case 11:
                        case 12:
                        case 13:
                        case 14:
                        case 15:
                        case 16:
                        case 17:
                        case 18:
                        case 19:
                            // change dynamic ui colors
                            break;
                        case 46:
                            // change log file
                            break;
                        case 50:
                            // dynamic font
                            break;
                        case 51:
                            // emacs shell
                            break;
                        case 52:
                            // manipulate selection data
                            break;
                        case 104:
                        case 105:
                        case 110:
                        case 111:
                        case 112:
                        case 113:
                        case 114:
                        case 115:
                        case 116:
                        case 117:
                        case 118:
                            // reset colors
                            break;
                    }

                    this.params = [];
                    this.currentParam = 0;
                    this.state = normal;
                } else {
                    if (!this.params.length) {
                        if (ch >= '0' && ch <= '9') {
                            this.currentParam =
                this.currentParam * 10 + ch.charCodeAt(0) - 48;
                        } else if (ch === ';') {
                            this.params.push(this.currentParam);
                            this.currentParam = '';
                        }
                    } else {
                        this.currentParam += ch;
                    }
                }
                break;

            case csi:
                // '?', '>', '!'
                if (ch === '?' || ch === '>' || ch === '!') {
                    this.prefix = ch;
                    break;
                }

                // 0 - 9
                if (ch >= '0' && ch <= '9') {
                    this.currentParam = this.currentParam * 10 + ch.charCodeAt(0) - 48;
                    break;
                }

                // '$', '"', ' ', '\''
                if (ch === '$' || ch === '"' || ch === ' ' || ch === '\'') {
                    this.postfix = ch;
                    break;
                }

                this.params.push(this.currentParam);
                this.currentParam = 0;

                // ';'
                if (ch === ';') break;

                this.state = normal;

                switch (ch) {
                    // CSI Ps A       
                    // Cursor Up Ps Times (default = 1) (CUU).       
                    case 'A':
                        this.cursorUp(this.params);
                        break;

                    // CSI Ps B       
                    // Cursor Down Ps Times (default = 1) (CUD).       
                    case 'B':
                        this.cursorDown(this.params);
                        break;

                    // CSI Ps C       
                    // Cursor Forward Ps Times (default = 1) (CUF).       
                    case 'C':
                        this.cursorForward(this.params);
                        break;

                    // CSI Ps D       
                    // Cursor Backward Ps Times (default = 1) (CUB).       
                    case 'D':
                        this.cursorBackward(this.params);
                        break;

                    // CSI Ps ; Ps H       
                    // Cursor Position [row;column] (default = [1,1]) (CUP).       
                    case 'H':
                        this.cursorPos(this.params);
                        break;

                    // CSI Ps J  Erase in Display (ED).       
                    case 'J':
                        this.eraseInDisplay(this.params);
                        break;

                    // CSI Ps K  Erase in Line (EL).       
                    case 'K':
                        this.eraseInLine(this.params);
                        break;

                    // CSI Pm m  Character Attributes (SGR).       
                    case 'm':
                        this.charAttributes(this.params);
                        break;

                    // CSI Ps n  Device Status Report (DSR).       
                    case 'n':
                        this.deviceStatus(this.params);
                        break;

                    /**
                    * Additions
                    */ 

                    // CSI Ps @       
                    // Insert Ps (Blank) Character(s) (default = 1) (ICH).       
                    case '@':
                        this.insertChars(this.params);
                        break;

                    // CSI Ps E       
                    // Cursor Next Line Ps Times (default = 1) (CNL).       
                    case 'E':
                        this.cursorNextLine(this.params);
                        break;

                    // CSI Ps F       
                    // Cursor Preceding Line Ps Times (default = 1) (CNL).       
                    case 'F':
                        this.cursorPrecedingLine(this.params);
                        break;

                    // CSI Ps G       
                    // Cursor Character Absolute  [column] (default = [row,1]) (CHA).       
                    case 'G':
                        this.cursorCharAbsolute(this.params);
                        break;

                    // CSI Ps L       
                    // Insert Ps Line(s) (default = 1) (IL).       
                    case 'L':
                        this.insertLines(this.params);
                        break;

                    // CSI Ps M       
                    // Delete Ps Line(s) (default = 1) (DL).       
                    case 'M':
                        this.deleteLines(this.params);
                        break;

                    // CSI Ps P       
                    // Delete Ps Character(s) (default = 1) (DCH).       
                    case 'P':
                        this.deleteChars(this.params);
                        break;

                    // CSI Ps X       
                    // Erase Ps Character(s) (default = 1) (ECH).       
                    case 'X':
                        this.eraseChars(this.params);
                        break;

                    // CSI Pm `  Character Position Absolute       
                    //   [column] (default = [row,1]) (HPA).       
                    case '`':
                        this.charPosAbsolute(this.params);
                        break;

                    // 141 61 a * HPR -       
                    // Horizontal Position Relative       
                    case 'a':
                        this.HPositionRelative(this.params);
                        break;

                    // CSI P s c       
                    // Send Device Attributes (Primary DA).       
                    // CSI > P s c       
                    // Send Device Attributes (Secondary DA)       
                    case 'c':
                        this.sendDeviceAttributes(this.params);
                        break;

                    // CSI Pm d       
                    // Line Position Absolute  [row] (default = [1,column]) (VPA).       
                    case 'd':
                        this.linePosAbsolute(this.params);
                        break;

                    // 145 65 e * VPR - Vertical Position Relative       
                    case 'e':
                        this.VPositionRelative(this.params);
                        break;

                    // CSI Ps ; Ps f       
                    //   Horizontal and Vertical Position [row;column] (default =       
                    //   [1,1]) (HVP).       
                    case 'f':
                        this.HVPosition(this.params);
                        break;

                    // CSI Pm h  Set Mode (SM).       
                    // CSI ? Pm h - mouse escape codes, cursor escape codes       
                    case 'h':
                        this.setMode(this.params);
                        break;

                    // CSI Pm l  Reset Mode (RM).       
                    // CSI ? Pm l       
                    case 'l':
                        this.resetMode(this.params);
                        break;

                    // CSI Ps ; Ps r       
                    //   Set Scrolling Region [top;bottom] (default = full size of win-       
                    //   dow) (DECSTBM).       
                    // CSI ? Pm r       
                    case 'r':
                        this.setScrollRegion(this.params);
                        break;

                    // CSI s       
                    //   Save cursor (ANSI.SYS).       
                    case 's':
                        this.saveCursor(this.params);
                        break;

                    // CSI u       
                    //   Restore cursor (ANSI.SYS).       
                    case 'u':
                        this.restoreCursor(this.params);
                        break;

                    /**
                    * Lesser Used
                    */ 

                    // CSI Ps I       
                    // Cursor Forward Tabulation Ps tab stops (default = 1) (CHT).       
                    case 'I':
                        this.cursorForwardTab(this.params);
                        break;

                    // CSI Ps S  Scroll up Ps lines (default = 1) (SU).       
                    case 'S':
                        this.scrollUp(this.params);
                        break;

                    // CSI Ps T  Scroll down Ps lines (default = 1) (SD).       
                    // CSI Ps ; Ps ; Ps ; Ps ; Ps T       
                    // CSI > Ps; Ps T       
                    case 'T':
                        if (this.params.length < 2 && !this.prefix) {
                            this.scrollDown(this.params);
                        }
                        break;

                    // CSI Ps Z       
                    // Cursor Backward Tabulation Ps tab stops (default = 1) (CBT).       
                    case 'Z':
                        this.cursorBackwardTab(this.params);
                        break;

                    // CSI Ps b  Repeat the preceding graphic character Ps times (REP).       
                    case 'b':
                        this.repeatPrecedingCharacter(this.params);
                        break;

                    // CSI Ps g  Tab Clear (TBC).       
                    case 'g':
                        this.tabClear(this.params);
                        break;
 
                    case 'p':
                        switch (this.prefix) {
                            case '!':
                                this.softReset(this.params);
                                break;  
                        }
                        break;
                    default:
                        this.error('Unknown CSI code: %s.', ch);
                        break;
                }

                this.prefix = '';
                this.postfix = '';
                break;

            case dcs:
                if (ch === '\x1b' || ch === '\x07') {
                    if (ch === '\x1b') i++;

                    switch (this.prefix) {
                        // User-Defined Keys (DECUDK).       
                        case '':
                            break;

                        // Request Status String (DECRQSS).       
                        // test: echo -e '\eP$q"p\e\\'       
                        case '$q':
                            var pt = this.currentParam
                , valid = false;

                            switch (pt) {
                                // DECSCA       
                                case '"q':
                                    pt = '0"q';
                                    break;

                                // DECSCL       
                                case '"p':
                                    pt = '61"p';
                                    break;

                                // DECSTBM       
                                case 'r':
                                    pt = ''
                    + (this.scrollTop + 1)
                    + ';'
                    + (this.scrollBottom + 1)
                    + 'r';
                                    break;

                                // SGR       
                                case 'm':
                                    pt = '0m';
                                    break;

                                default:
                                    this.error('Unknown DCS Pt: %s.', pt);
                                    pt = '';
                                    break;
                            }

                            this.send('\x1bP' + +valid + '$r' + pt + '\x1b\\');
                            break;

                        // Set Termcap/Terminfo Data (xterm, experimental).       
                        case '+p':
                            break;

                        // Request Termcap/Terminfo String (xterm, experimental)       
                        // Regular xterm does not even respond to this sequence.       
                        // This can cause a small glitch in vim.       
                        // test: echo -ne '\eP+q6b64\e\\'       
                        case '+q':
                            var pt = this.currentParam
                , valid = false;

                            this.send('\x1bP' + +valid + '+r' + pt + '\x1b\\');
                            break;

                        default:
                            this.error('Unknown DCS prefix: %s.', this.prefix);
                            break;
                    }

                    this.currentParam = 0;
                    this.prefix = '';
                    this.state = normal;
                } else if (!this.currentParam) {
                    if (!this.prefix && ch !== '$' && ch !== '+') {
                        this.currentParam = ch;
                    } else if (this.prefix.length === 2) {
                        this.currentParam = ch;
                    } else {
                        this.prefix += ch;
                    }
                } else {
                    this.currentParam += ch;
                }
                break;

            case ignore:
                // For PM and APC.
                if (ch === '\x1b' || ch === '\x07') {
                    if (ch === '\x1b') i++;
                    this.state = normal;
                }
                break;
        }
    }


    callback(dataString);
};
Terminal.prototype.keyDown = function (ev, callback) {
    var key;

    switch (ev.keyCode) {
        // backspace 
        case 8:
            if (ev.shiftKey) {
                key = '\x08'; // ^H
                break;
            }
            key = '\x7f'; // ^?
            break;
        // tab 
        case 9:
            if (ev.shiftKey) {
                key = '\x1b[Z';
                break;
            }
            key = '\t';
            break;
        // return/enter 
        case 13:
            key = '\r';
            break;
        // escape 
        case 27:
            key = '\x1b';
            break;
        // left-arrow 
        case 37:
            if (this.applicationCursor) {
                key = '\x1bOD'; // SS3 as ^[O for 7-bit
                //key = '\x8fD'; // SS3 as 0x8f for 8-bit
                break;
            }
            key = '\x1b[D';
            break;
        // right-arrow 
        case 39:
            if (this.applicationCursor) {
                key = '\x1bOC';
                break;
            }
            key = '\x1b[C';
            break;
        // up-arrow 
        case 38:
            if (this.applicationCursor) {
                key = '\x1bOA';
                break;
            }
            if (ev.ctrlKey) {
                //this.scrollDisp(-1);
                return cancel(ev);
            } else {
                key = '\x1b[A';
            }
            break;
        // down-arrow 
        case 40:
            if (this.applicationCursor) {
                key = '\x1bOB';
                break;
            }
            if (ev.ctrlKey) {
                //this.scrollDisp(1);
                return cancel(ev);
            } else {
                key = '\x1b[B';
            }
            break;
        // delete 
        case 46:
            key = '\x1b[3~';
            break;
        // insert 
        case 45:
            key = '\x1b[2~';
            break;
        // home 
        case 36:
            if (this.applicationKeypad) {
                key = '\x1bOH';
                break;
            }
            key = '\x1bOH';
            break;
        // end 
        case 35:
            if (this.applicationKeypad) {
                key = '\x1bOF';
                break;
            }
            key = '\x1bOF';
            break;
        // page up 
        case 33:
            if (ev.shiftKey) {
                //this.scrollDisp(-(this.rows - 1));
                return cancel(ev);
            } else {
                key = '\x1b[5~';
            }
            break;
        // page down 
        case 34:
            if (ev.shiftKey) {
                //this.scrollDisp(this.rows - 1);
                return cancel(ev);
            } else {
                key = '\x1b[6~';
            }
            break;
        // F1 
        case 112:
            key = '\x1bOP';
            break;
        // F2 
        case 113:
            key = '\x1bOQ';
            break;
        // F3 
        case 114:
            key = '\x1bOR';
            break;
        // F4 
        case 115:
            key = '\x1bOS';
            break;
        // F5 
        case 116:
            key = '\x1b[15~';
            break;
        // F6 
        case 117:
            key = '\x1b[17~';
            break;
        // F7 
        case 118:
            key = '\x1b[18~';
            break;
        // F8 
        case 119:
            key = '\x1b[19~';
            break;
        // F9 
        case 120:
            key = '\x1b[20~';
            break;
        // F10 
        case 121:
            key = '\x1b[21~';
            break;
        // F11 
        case 122:
            key = '\x1b[23~';
            break;
        // F12 
        case 123:
            key = '\x1b[24~';
            break;
        default:
            // a-z and space
            if (ev.ctrlKey) {
                if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                    key = String.fromCharCode(ev.keyCode - 64);
                } else if (ev.keyCode === 32) {
                    // NUL
                    key = String.fromCharCode(0);
                } else if (ev.keyCode >= 51 && ev.keyCode <= 55) {
                    // escape, file sep, group sep, record sep, unit sep
                    key = String.fromCharCode(ev.keyCode - 51 + 27);
                } else if (ev.keyCode === 56) {
                    // delete
                    key = String.fromCharCode(127);
                } else if (ev.keyCode === 219) {
                    // ^[ - escape
                    key = String.fromCharCode(27);
                } else if (ev.keyCode === 221) {
                    // ^] - group sep
                    key = String.fromCharCode(29);
                }
            } else if ((!isMac && ev.altKey) || (isMac && ev.metaKey)) {
                if (ev.keyCode >= 65 && ev.keyCode <= 90) {
                    key = '\x1b' + String.fromCharCode(ev.keyCode + 32);
                } else if (ev.keyCode === 192) {
                    key = '\x1b`';
                } else if (ev.keyCode >= 48 && ev.keyCode <= 57) {
                    key = '\x1b' + (ev.keyCode - 48);
                }
            }
            break;
    }

    //this.emit('keydown', ev);

    if (key) {
        //this.emit('key', key, ev);

        //this.showCursor();
        //this.handler(key);
        callback(key);

        return cancel(ev);
    }

    return true;
};
Terminal.prototype.keyPress = function (ev, callback) {
    var key;

    cancel(ev);

    if (ev.charCode) {
        key = ev.charCode;
    } else if (ev.which == null) {
        key = ev.keyCode;
    } else if (ev.which !== 0 && ev.charCode !== 0) {
        key = ev.which;
    } else {
        return false;
    }

    if (!key || ev.ctrlKey || ev.altKey || ev.metaKey) return false;

    key = String.fromCharCode(key);

    //this.emit('keypress', key, ev);
    //this.emit('key', key, ev);

    //this.showCursor();
    //this.handler(key);
    callback(key);

    return false;
};

function cancel(ev) {
    if (ev.preventDefault) ev.preventDefault();
    ev.returnValue = false;
    if (ev.stopPropagation) ev.stopPropagation();
    ev.cancelBubble = true;
    return false;
}

/**
* ESC
*/

// ESC D Index (IND is 0x84).
Terminal.prototype.index = function () {
    /*
    this.y++;
    if (this.y > this.scrollBottom) {
        this.y--;
        this.scroll();
    }
    */
    this.state = normal;
};

// ESC M Reverse Index (RI is 0x8d).
Terminal.prototype.reverseIndex = function () {
    /*
    var j;
    this.y--;
    if (this.y < this.scrollTop) {
        this.y++;
        // possibly move the code below to term.reverseScroll();
        // test: echo -ne '\e[1;1H\e[44m\eM\e[0m'
        // blankLine(true) is xterm/linux behavior
        this.lines.splice(this.y + this.ybase, 0, this.blankLine(true));
        j = this.rows - 1 - this.scrollBottom;
        this.lines.splice(this.rows - 1 + this.ybase - j + 1, 1);
        // this.maxRange();
        this.updateRange(this.scrollTop);
        this.updateRange(this.scrollBottom);
    }
    */
    this.state = normal;
};

// ESC c Full Reset (RIS).
Terminal.prototype.reset = function () {
    /*
    Terminal.call(this, this.options);
    this.refresh(0, this.rows - 1);
    */
};

Terminal.prototype.charAttributes = function (params) {
    var l = params.length
    , i = 0
    , bg
    , fg
    , p;

    for (; i < l; i++) {
        p = params[i];
        if (p >= 30 && p <= 37) {
            // fg color 8
            this.curAttr = (this.curAttr & ~(0x1ff << 9)) | ((p - 30) << 9);
        } else if (p >= 40 && p <= 47) {
            // bg color 8
            this.curAttr = (this.curAttr & ~0x1ff) | (p - 40);
        } else if (p >= 90 && p <= 97) {
            // fg color 16
            p += 8;
            this.curAttr = (this.curAttr & ~(0x1ff << 9)) | ((p - 90) << 9);
        } else if (p >= 100 && p <= 107) {
            // bg color 16
            p += 8;
            this.curAttr = (this.curAttr & ~0x1ff) | (p - 100);
        } else if (p === 0) {
            // default
            this.curAttr = this.defAttr;
        } else if (p === 1) {
            // bold text
            this.curAttr = this.curAttr | (1 << 18);
        } else if (p === 4) {
            // underlined text
            this.curAttr = this.curAttr | (2 << 18);
        } else if (p === 7 || p === 27) {
            // inverse and positive
            // test with: echo -e '\e[31m\e[42mhello\e[7mworld\e[27mhi\e[m'
            if (p === 7) {
                if ((this.curAttr >> 18) & 4) continue;
                this.curAttr = this.curAttr | (4 << 18);
            } else if (p === 27) {
                if (~(this.curAttr >> 18) & 4) continue;
                this.curAttr = this.curAttr & ~(4 << 18);
            }

            bg = this.curAttr & 0x1ff;
            fg = (this.curAttr >> 9) & 0x1ff;

            this.curAttr = (this.curAttr & ~0x3ffff) | ((bg << 9) | fg);
        } else if (p === 22) {
            // not bold
            this.curAttr = this.curAttr & ~(1 << 18);
        } else if (p === 24) {
            // not underlined
            this.curAttr = this.curAttr & ~(2 << 18);
        } else if (p === 39) {
            // reset fg
            this.curAttr = this.curAttr & ~(0x1ff << 9);
            this.curAttr = this.curAttr | (((this.defAttr >> 9) & 0x1ff) << 9);
        } else if (p === 49) {
            // reset bg
            this.curAttr = this.curAttr & ~0x1ff;
            this.curAttr = this.curAttr | (this.defAttr & 0x1ff);
        } else if (p === 38) {
            // fg color 256
            if (params[i + 1] !== 5) continue;
            i += 2;
            p = params[i] & 0xff;
            // convert 88 colors to 256
            // if (this.is('rxvt-unicode') && p < 88) p = p * 2.9090 | 0;
            this.curAttr = (this.curAttr & ~(0x1ff << 9)) | (p << 9);
        } else if (p === 48) {
            // bg color 256
            if (params[i + 1] !== 5) continue;
            i += 2;
            p = params[i] & 0xff;
            // convert 88 colors to 256
            // if (this.is('rxvt-unicode') && p < 88) p = p * 2.9090 | 0;
            this.curAttr = (this.curAttr & ~0x1ff) | p;
        }
    }
};
// CSI Ps K  Erase in Line (EL).
//     Ps = 0  -> Erase to Right (default).
//     Ps = 1  -> Erase to Left.
//     Ps = 2  -> Erase All.
// CSI ? Ps K
//   Erase in Line (DECSEL).
//     Ps = 0  -> Selective Erase to Right (default).
//     Ps = 1  -> Selective Erase to Left.
//     Ps = 2  -> Selective Erase All.
Terminal.prototype.eraseInLine = function (params) {
    switch (params[0]) {
        case 0:
            this.eraseRight(this.x, this.y);
            break;
        case 1:
            this.eraseLeft(this.x, this.y);
            break;
        case 2:
            this.eraseLine(this.y);
            break;
    }
};
Terminal.prototype.eraseRight = function (x, y) {
    var line = this.lines[this.ybase + y]
    , ch = [this.curAttr, ' ']; // xterm

    for (; x < this.cols; x++) {
        line[x] = ch;
    }

    this.updateRange(y);
};
Terminal.prototype.eraseLeft = function (x, y) {
    var line = this.lines[this.ybase + y]
    , ch = [this.curAttr, ' ']; // xterm

    x++;
    while (x--) line[x] = ch;

    this.updateRange(y);
};
Terminal.prototype.eraseLine = function (y) {
    this.eraseRight(0, y);
};
//module.exports = exports = Terminal;
//exports.Terminal = Terminal;
//exports.native = undefined;
this.Terminal = Terminal;
