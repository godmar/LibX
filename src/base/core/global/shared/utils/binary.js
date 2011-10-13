
/**
 * Namespace for binary file handling.
 * @namespace
 */
libx.utils.binary = (function() {

/*
 *
 *   Base64.js
 *
 *   copyright 2003, Kevin Lindsey
 *   licensing info available at: http://www.kevlindev.com/license.txt
 *
 */

/*
 *
 *   encoding table
 *
 */
Base64.encoding = [
    "A", "B", "C", "D", "E", "F", "G", "H",
    "I", "J", "K", "L", "M", "N", "O", "P",
    "Q", "R", "S", "T", "U", "V", "W", "X",
    "Y", "Z", "a", "b", "c", "d", "e", "f",
    "g", "h", "i", "j", "k", "l", "m", "n",
    "o", "p", "q", "r", "s", "t", "u", "v",
    "w", "x", "y", "z", "0", "1", "2", "3",
    "4", "5", "6", "7", "8", "9", "+", "/"
];


/*
 *
 *   constructor
 *
 */
function Base64() {}


/*
 *
 *   encode
 *
 */
Base64.encode = function(data) {
    var result = [];
    var ip57   = Math.floor(data.length / 57);
    var fp57   = data.length % 57;
    var ip3    = Math.floor(fp57 / 3);
    var fp3    = fp57 % 3;
    var index  = 0;
    var num;
    
    for ( var i = 0; i < ip57; i++ ) {
        for ( j = 0; j < 19; j++, index += 3 ) {
            num = data[index] << 16 | data[index+1] << 8 | data[index+2];
            result.push(Base64.encoding[ ( num & 0xFC0000 ) >> 18 ]);
            result.push(Base64.encoding[ ( num & 0x03F000 ) >> 12 ]);
            result.push(Base64.encoding[ ( num & 0x0FC0   ) >>  6 ]);
            result.push(Base64.encoding[ ( num & 0x3F     )       ]);
        }
    }

    for ( i = 0; i < ip3; i++, index += 3 ) {
        num = data[index] << 16 | data[index+1] << 8 | data[index+2];
        result.push(Base64.encoding[ ( num & 0xFC0000 ) >> 18 ]);
        result.push(Base64.encoding[ ( num & 0x03F000 ) >> 12 ]);
        result.push(Base64.encoding[ ( num & 0x0FC0   ) >>  6 ]);
        result.push(Base64.encoding[ ( num & 0x3F     )       ]);
    }

    if ( fp3 == 1 ) {
        num = data[index] << 16;
        result.push(Base64.encoding[ ( num & 0xFC0000 ) >> 18 ]);
        result.push(Base64.encoding[ ( num & 0x03F000 ) >> 12 ]);
        result.push("==");
    } else if ( fp3 == 2 ) {
        num = data[index] << 16 | data[index+1] << 8;
        result.push(Base64.encoding[ ( num & 0xFC0000 ) >> 18 ]);
        result.push(Base64.encoding[ ( num & 0x03F000 ) >> 12 ]);
        result.push(Base64.encoding[ ( num & 0x0FC0   ) >>  6 ]);
        result.push("=");
    }

    return result.join("");
};


/*
 * Binary Ajax 0.1.5
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 */

var BinaryFile = function(strData, iDataOffset, iDataLength) {
	var data = strData;
	var dataOffset = iDataOffset || 0;
	var dataLength = 0;

	this.getRawData = function() {
		return data;
	}

	if (typeof strData == "string") {
		dataLength = iDataLength || data.length;

		this.getByteAt = function(iOffset) {
			return data.charCodeAt(iOffset + dataOffset) & 0xFF;
		}
	}

	this.getLength = function() {
		return dataLength;
	}

	this.getSByteAt = function(iOffset) {
		var iByte = this.getByteAt(iOffset);
		if (iByte > 127)
			return iByte - 256;
		else
			return iByte;
	}

	this.getShortAt = function(iOffset, bBigEndian) {
		var iShort = bBigEndian ? 
			(this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1)
			: (this.getByteAt(iOffset + 1) << 8) + this.getByteAt(iOffset)
		if (iShort < 0) iShort += 65536;
		return iShort;
	}
	this.getSShortAt = function(iOffset, bBigEndian) {
		var iUShort = this.getShortAt(iOffset, bBigEndian);
		if (iUShort > 32767)
			return iUShort - 65536;
		else
			return iUShort;
	}
	this.getLongAt = function(iOffset, bBigEndian) {
		var iByte1 = this.getByteAt(iOffset),
			iByte2 = this.getByteAt(iOffset + 1),
			iByte3 = this.getByteAt(iOffset + 2),
			iByte4 = this.getByteAt(iOffset + 3);

		var iLong = bBigEndian ? 
			(((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4
			: (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
		if (iLong < 0) iLong += 4294967296;
		return iLong;
	}
	this.getSLongAt = function(iOffset, bBigEndian) {
		var iULong = this.getLongAt(iOffset, bBigEndian);
		if (iULong > 2147483647)
			return iULong - 4294967296;
		else
			return iULong;
	}
	this.getStringAt = function(iOffset, iLength) {
		var aStr = [];
		for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	}

	this.getCharAt = function(iOffset) {
		return String.fromCharCode(this.getByteAt(iOffset));
	}
	this.toBase64 = function() {
		return window.btoa(data);
	}
	this.fromBase64 = function(strBase64) {
		data = window.atob(strBase64);
	}
};

return {
    /**
     * Converts binary to its base 64 string representation.
     *
     * @name libx.utils.binary.binary2Base64
     * @param {Binary}  raw binary data
     * @returns {String}  base 64 encoded string of binary data
     */
    binary2Base64: function(binary) {
        var binaryResponse = new BinaryFile(binary);
        var binArr = [];
        for(var i = 0; i < binaryResponse.getLength(); i++)
            binArr[i] = binaryResponse.getByteAt(i);
        return Base64.encode(binArr);
    }
};

}) ();
