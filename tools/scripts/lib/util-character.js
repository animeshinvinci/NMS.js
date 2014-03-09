var Char = (function () {
    var _this = {
        IsControl: function (c) {
            var cc = c.charCodeAt(0);
            if ((cc >= 00 && cc <= 0x1F) || (cc == 0x7F)) {
                return true;
            }
            return false;
        },
        IsNoWSControl: function (c) {
            var cc = c.charCodeAt(0);
            if ((cc >= 00 && cc <= 0x1F) || (cc == 0x7F)) {
                if (cc >= 0x09 && cc <= 0x0D) return false;
                return true;
            }
            return false;
        },
        IsPunctuation: function (c) {
            var cc = c.charCodeAt(0);
            if ((cc >= 20 && cc <= 0x2F) || (cc >= 0x3A && cc <= 0x40) || (cc >= 0x5B && cc <= 0x60) || (cc >= 0x7B && cc <= 0x7E)) {
                return true;
            }
            return false;
        },
        IsLetterOrDigit: function (c) {
            var cc = c.charCodeAt(0);
            if ((cc >= 0x30 && cc <= 0x39) || (cc >= 0x41 && cc <= 0x5A) || (cc >= 0x61 && cc <= 0x7A)) {
                return true;
            }
            return false;
        },
        IsDigit: function (c) {
            var cc = c.toString().charCodeAt(0);
            if (cc >= 0x30 && cc <= 0x39) {
                return true;
            }
            return false;
        },
        IsLetter: function (c) {
            var cc = c.charCodeAt(0);
            if ((cc >= 0x41 && cc <= 0x5A) || (cc >= 0x61 && cc <= 0x7A)) {
                return true;
            }
            return false;
        },
        IsWhiteSpace: function (c) {
            if (c == null) { c = ''; }
            var cc = c.charCodeAt(0);
            if ((cc >= 0x0009 && cc <= 0x000D) || (cc == 0x0020) || (cc == 0x0085) || (cc == 0x00A0) || (cc == 0x1680) || (cc == 0x180E) || (cc >= 0x2000 && cc <= 0x200A) || (cc == 0x2028) || (cc == 0x2029) || (cc == 0x202F) || (cc == 0x205F) || (cc == 0x3000)) {
                return true;
            }
            return false;
        },
        IsUnicode: function (c) {
            var cc = c.charCodeAt(0);
            if ((cc == 0x0009) || (cc == 0x000A) || (cc == 0x000D) || (cc >= 0x0020 && cc <= 0xD7FF) || (cc >= 0xE000 && cc <= 0xFFFD) || (cc >= 0x10000 && cc <= 0x10FFFF)) {
                return true;
            }
            return false;
        }
    };
    return _this;
})();
/**
* Expose
*/
module.exports = exports = Char;
exports.Char = Char;
exports.native = undefined;