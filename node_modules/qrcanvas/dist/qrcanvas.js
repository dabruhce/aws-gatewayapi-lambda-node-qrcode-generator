(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.qrcanvas = factory());
}(this, (function () { 'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var qrcode_1 = createCommonjsModule(function (module, exports) {
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = new Array();

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error('code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')');
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw new Error(row + ',' + col);
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;
      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += ' width="' + size + 'px"';
      qrSvg += ' height="' + size + 'px"';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet">';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createImgTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createImgTag(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw new Error();
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw new Error(count + ' != ' + numChars);
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = new Array();
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw new Error('bad maskPattern:' + maskPattern);
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw new Error('mode:' + mode);
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw new Error('mode:' + mode);
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw new Error('mode:' + mode);
        }

      } else {
        throw new Error('type:' + type);
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      }

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw new Error('glog(' + n + ')');
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw new Error(num.length + '/' + shift);
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  }

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw new Error('bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel);
      }

      var length = rsBlock.length / 3;

      var list = new Array();

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = new Array();
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = new Array();

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw new Error('n:' + n);
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw new Error('unexpected end of file./' + _buflen);
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw new Error('c:' + c);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw new Error('length over');
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw new Error('dup key:' + key);
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createImgTag = function(width, height, getPixel, alt) {

    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    var img = '';
    img += '<img';
    img += '\u0020src="';
    img += 'data:image/gif;base64,';
    img += base64;
    img += '"';
    img += '\u0020width="';
    img += width;
    img += '"';
    img += '\u0020height="';
    img += height;
    img += '"';
    if (alt) {
      img += '\u0020alt="';
      img += alt;
      img += '"';
    }
    img += '/>';

    return img;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();

(function (factory) {
  if (typeof undefined === 'function' && undefined.amd) {
      undefined([], factory);
  } else {
      module.exports = factory();
  }
}(function () {
    return qrcode;
}));
});

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};



































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var EventEmitter = function () {
  function EventEmitter() {
    classCallCheck(this, EventEmitter);

    this.events = {};
  }

  createClass(EventEmitter, [{
    key: "on",
    value: function on(type, listener) {
      var _this = this;

      var listeners = this.events[type];
      if (!listeners) {
        listeners = [];
        this.events[type] = listeners;
      }
      listeners.push(listener);
      return function () {
        return _this.off(type, listener);
      };
    }
  }, {
    key: "off",
    value: function off(type, listener) {
      var listeners = this.events[type];
      if (listeners) {
        var i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      }
    }
  }, {
    key: "emit",
    value: function emit(type, data) {
      var listeners = this.events[type];
      var evt = {
        data: data,
        defaultPrevented: false,
        preventDefault: function preventDefault() {
          evt.defaultPrevented = true;
        }
      };
      if (listeners) {
        listeners.forEach(function (listener) {
          listener(evt);
        });
      }
      return evt;
    }
  }]);
  return EventEmitter;
}();

var variables = {
  colorDark: 'black',
  colorLight: 'white'
};

var effects = {};

var plugins = [];

var defaultOptions = function defaultOptions() {
  return {
    // typeNumber belongs to 1..40
    // otherwise it will be increased to the smallest valid number
    typeNumber: 0,

    // correctLevel can be 'L', 'M', 'Q' or 'H'
    correctLevel: 'L',

    // size of each cell in pixel
    cellSize: 2,

    // foreground and background may be an image or a style string
    // or an array of objects with attributes below:
    // * row | x: default 0
    // * col | y: default 0
    // * cols | width: default size
    // * rows | height: default size
    // * style: default 'black'
    foreground: variables.colorDark,
    background: null,

    // data MUST be a string
    data: '',

    // effect: an object with optional key and value
    // - {key: 'round', value: 0-1}
    // - {key: 'liquid', value: 0-1}
    // - {key: 'image', value: 0-1}
    effect: {},

    // Avoid transparent pixels
    noAlpha: true

    /**
     * an image or text can be used as a logo
     * logo: {
     *   // image
     *   image: Image,
      *   // text
     *   text: string,
     *   color: string, default 'black'
     *   fontStyle: string, e.g. 'italic bold'
     *   fontFamily: string, default 'Cursive'
      *   // common
     *   clearEdges: number 0-3, default 0
     *   margin: number, default 2 for text and 0 for image
     *   size: float, default .15 stands for 15% of the QRCode
     * }
     */
    // logo: {},
  };
};

var defaultLogoOptions = function defaultLogoOptions() {
  return {
    color: variables.colorDark,
    fontFamily: 'Cursive',
    clearEdges: 0,
    margin: -1,
    size: 0.15
  };
};

var QRCanvas$1 = function () {
  function QRCanvas(options) {
    var _this = this;

    classCallCheck(this, QRCanvas);

    this.isDark = function (i, j) {
      var _qrdata = _this.qrdata,
          count = _qrdata.count,
          qr = _qrdata.qr;

      return i >= 0 && i < count && j >= 0 && j < count && _this.shouldTransclude(i + j * count) && qr.isDark(i, j);
    };

    this.events = new EventEmitter();
    this.cache = {};
    QRCanvas.plugins.forEach(function (plugin) {
      return plugin(_this);
    });
    this.setData(options || {});
  }

  createClass(QRCanvas, [{
    key: 'setData',
    value: function setData(userOptions) {
      var options = _extends({}, defaultOptions(), userOptions, {
        effect: _extends({}, userOptions.effect)
      });
      if (userOptions.logo && (userOptions.logo.image || userOptions.logo.text)) {
        var logo = _extends({}, defaultLogoOptions(), userOptions.logo);
        if (logo.margin < 0) logo.margin = logo.image ? 0 : 2;
        options.logo = logo;
      } else {
        options.logo = {};
      }
      if (options.logo.text || options.logo.image || options.effect.key === 'image') {
        options.correctLevel = 'H';
      }
      this.options = options;
    }
  }, {
    key: 'makeAll',
    value: function makeAll() {
      this.makeQR();
      this.makeBackground();
      this.makeLogo();
      this.makeForeground();
      this.make();
    }
  }, {
    key: 'makeQR',
    value: function makeQR() {
      var _options = this.options,
          typeNumber = _options.typeNumber,
          correctLevel = _options.correctLevel,
          data = _options.data,
          cellSize = _options.cellSize;

      var qr = qrcode_1(typeNumber, correctLevel);
      qr.addData(data || '');
      qr.make();
      var count = qr.getModuleCount();
      this.qrdata = {
        cellSize: cellSize,
        count: count,
        qr: qr,
        size: count * cellSize
      };
    }
  }, {
    key: 'makeBackground',
    value: function makeBackground() {
      var _options2 = this.options,
          noAlpha = _options2.noAlpha,
          background = _options2.background;

      this.cache.background = [noAlpha && variables.colorLight, background];
    }
  }, {
    key: 'makeForeground',
    value: function makeForeground() {
      var _this2 = this;

      var _options3 = this.options,
          foreground = _options3.foreground,
          effect = _options3.effect;
      var _qrdata2 = this.qrdata,
          cellSize = _qrdata2.cellSize,
          size = _qrdata2.size;

      var effectInfo = effect && effects[effect.key] || effects.default;
      QRCanvas.cacheCanvas(this.cache.foreground);
      this.cache.foreground = (effectInfo.scenes || [{}]).map(function (scene) {
        var mask = QRCanvas.getCanvas({ width: size });
        effectInfo.draw(_extends({
          effect: effect,
          canvas: mask,
          isDark: _this2.isDark,
          qrdata: _this2.qrdata,
          context: mask.getContext('2d'),
          colorDark: 'black'
        }, applyConfig(scene.configMask, _this2.options)));
        var canvas = QRCanvas.drawCanvas(QRCanvas.getCanvas({ width: size }), _extends({
          cellSize: cellSize,
          data: foreground
        }, applyConfig(scene.configScene, _this2.options)));
        var ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(mask, 0, 0);
        QRCanvas.cacheCanvas(mask);
        _this2.events.emit('clearLogo', canvas);
        return canvas;
      });
    }

    /**
     * @desc Initialize logo data, find out the proper width and height and draw
     * it to a canvas for later use.
     */

  }, {
    key: 'makeLogo',
    value: function makeLogo() {
      var logo = this.options.logo;
      var _qrdata3 = this.qrdata,
          count = _qrdata3.count,
          cellSize = _qrdata3.cellSize,
          size = _qrdata3.size;

      var width = void 0;
      var height = void 0;
      var canvas = this.cache.logo && this.cache.logo.image;
      if (canvas) {
        QRCanvas.cacheCanvas(canvas);
        canvas = null;
      }
      var normalize = function normalize() {
        var k = width / height;
        var margin2 = 2 * logo.margin;
        var iHeight = Math.min(Math.sqrt(Math.min((width + margin2) * (height + margin2) / size / size, logo.size) / k) * count, count / k) | 0;
        var iWidth = k * iHeight | 0;
        // (count - [iWidth | iHeight]) must be even if the logo is in the middle
        if ((count - iWidth) % 2) iWidth -= 1;
        if ((count - iHeight) % 2) iHeight -= 1;

        var kl = Math.min((iHeight * cellSize - margin2) / height, (iWidth * cellSize - margin2) / width, 1);
        logo.width = kl * width | 0;
        logo.height = kl * height | 0;
        logo.x = (size - logo.width >> 1) - logo.margin;
        logo.y = (size - logo.height >> 1) - logo.margin;
        canvas = QRCanvas.getCanvas({
          width: logo.width + 2 * logo.margin,
          height: logo.height + 2 * logo.margin
        });
      };
      if (logo.image) {
        var image = logo.image;

        width = image.naturalWidth || image.width;
        height = image.naturalHeight || image.height;
        normalize();
        var ctx = canvas.getContext('2d');
        ctx.drawImage(logo.image, logo.margin, logo.margin, logo.width, logo.height);
      } else if (logo.text) {
        // get text width/height radio by assuming fontHeight=100px
        height = 100;
        var font = [logo.fontStyle, height + 'px', logo.fontFamily].filter(Boolean).join(' ');

        var _QRCanvas$measureText = QRCanvas.measureText(logo.text, font);

        width = _QRCanvas$measureText.width;

        normalize();
        var _ctx = canvas.getContext('2d');
        _ctx.font = [logo.fontStyle, logo.height + 'px', logo.fontFamily].filter(Boolean).join(' ');
        _ctx.textAlign = 'center';
        _ctx.textBaseline = 'middle';
        _ctx.fillStyle = logo.color;
        _ctx.fillText(logo.text, (logo.width >> 1) + logo.margin, (logo.height >> 1) + logo.margin);
      }
      if (canvas) {
        this.events.emit('detectEdges', canvas);
      }
      this.cache.logo = canvas && {
        image: canvas,
        x: logo.x,
        y: logo.y,
        width: logo.width + 2 * logo.margin,
        height: logo.height + 2 * logo.margin
      };
    }
  }, {
    key: 'make',
    value: function make() {
      var _qrdata4 = this.qrdata,
          cellSize = _qrdata4.cellSize,
          size = _qrdata4.size;
      var _cache = this.cache,
          background = _cache.background,
          foreground = _cache.foreground,
          logo = _cache.logo;

      QRCanvas.cacheCanvas(this.cache.result);
      var canvas = QRCanvas.drawCanvas(QRCanvas.getCanvas({ width: size }), {
        cellSize: cellSize,
        data: [background, foreground, logo]
      });
      this.cache.result = canvas;
    }
  }, {
    key: 'output',
    value: function output() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          size = _ref.size,
          canvas = _ref.canvas;

      var iSize = this.qrdata.size;

      var computedSize = size || iSize;
      var outputCanvas = QRCanvas.getCanvas({ canvas: canvas, width: computedSize });
      var ctx = outputCanvas.getContext('2d');
      ctx.drawImage(this.cache.result, 0, 0, computedSize, computedSize);
      return outputCanvas;
    }
  }, {
    key: 'shouldTransclude',


    /**
     * @desc Whether a cell should be transcluded by the foreground image.
     */
    value: function shouldTransclude(index) {
      return true;
    } // eslint-disable-line

  }]);
  return QRCanvas;
}();

function applyConfig(config, options) {
  if (typeof config === 'function') return config(options);
  return config;
}

QRCanvas$1.variables = variables;
QRCanvas$1.effects = effects;
QRCanvas$1.plugins = plugins;

effects.default = { draw: drawDefault };
effects.round = { draw: drawRound };
effects.liquid = { draw: drawLiquid };
effects.spot = {
  draw: drawSpot,
  scenes: [{
    configMask: {
      isDark: function isDark() {
        return true;
      }
    },
    configScene: {
      data: variables.colorLight
    }
  }, {}]
};

function drawDefault(contextData) {
  var context = contextData.context,
      isDark = contextData.isDark,
      colorDark = contextData.colorDark,
      cellSize = contextData.qrdata.cellSize;

  drawCells(contextData, function (_ref) {
    var i = _ref.i,
        j = _ref.j,
        x = _ref.x,
        y = _ref.y;

    if (isDark(i, j)) {
      context.fillStyle = colorDark;
      context.fillRect(x, y, cellSize, cellSize);
    }
  });
}

function drawCells(_ref2, drawEach) {
  var _ref2$qrdata = _ref2.qrdata,
      cellSize = _ref2$qrdata.cellSize,
      count = _ref2$qrdata.count;

  for (var i = 0; i < count; i += 1) {
    for (var j = 0; j < count; j += 1) {
      var x = i * cellSize;
      var y = j * cellSize;
      drawEach({
        i: i, j: j, x: x, y: y
      });
    }
  }
}

function drawCorner(context, cornerX, cornerY, x, y, r) {
  if (r) {
    context.arcTo(cornerX, cornerY, x, y, r);
  } else {
    context.lineTo(cornerX, cornerY);
    context.lineTo(x, y);
  }
}

function drawRound(contextData) {
  var context = contextData.context,
      effect = contextData.effect,
      isDark = contextData.isDark,
      colorDark = contextData.colorDark,
      cellSize = contextData.qrdata.cellSize;

  var radius = effect.value * cellSize / 2;
  drawCells(contextData, function (_ref3) {
    var i = _ref3.i,
        j = _ref3.j,
        x = _ref3.x,
        y = _ref3.y;

    if (isDark(i, j)) {
      context.fillStyle = colorDark;
      context.beginPath();
      context.moveTo(x + 0.5 * cellSize, y);
      drawCorner(context, x + cellSize, y, x + cellSize, y + 0.5 * cellSize, radius);
      drawCorner(context, x + cellSize, y + cellSize, x + 0.5 * cellSize, y + cellSize, radius);
      drawCorner(context, x, y + cellSize, x, y + 0.5 * cellSize, radius);
      drawCorner(context, x, y, x + 0.5 * cellSize, y, radius);
      // context.closePath();
      context.fill();
    }
  });
}

function fillCorner(context, startX, startY, cornerX, cornerY, destX, destY, radius) {
  context.beginPath();
  context.moveTo(startX, startY);
  drawCorner(context, cornerX, cornerY, destX, destY, radius);
  context.lineTo(cornerX, cornerY);
  context.lineTo(startX, startY);
  // context.closePath();
  context.fill();
}

function drawLiquid(contextData) {
  var context = contextData.context,
      isDark = contextData.isDark,
      colorDark = contextData.colorDark,
      effect = contextData.effect,
      cellSize = contextData.qrdata.cellSize;

  var radius = effect.value * cellSize / 2;
  drawCells(contextData, function (_ref4) {
    var i = _ref4.i,
        j = _ref4.j,
        x = _ref4.x,
        y = _ref4.y;

    var corners = [0, 0, 0, 0]; // NW, NE, SE, SW
    if (isDark(i - 1, j)) {
      corners[0] += 1;
      corners[3] += 1;
    }
    if (isDark(i + 1, j)) {
      corners[1] += 1;
      corners[2] += 1;
    }
    if (isDark(i, j - 1)) {
      corners[0] += 1;
      corners[1] += 1;
    }
    if (isDark(i, j + 1)) {
      corners[2] += 1;
      corners[3] += 1;
    }
    // draw cell
    context.fillStyle = colorDark;
    if (isDark(i, j)) {
      if (isDark(i - 1, j - 1)) corners[0] += 1;
      if (isDark(i + 1, j - 1)) corners[1] += 1;
      if (isDark(i + 1, j + 1)) corners[2] += 1;
      if (isDark(i - 1, j + 1)) corners[3] += 1;
      context.moveTo(x + 0.5 * cellSize, y);
      drawCorner(context, x + cellSize, y, x + cellSize, y + 0.5 * cellSize, corners[1] ? 0 : radius);
      drawCorner(context, x + cellSize, y + cellSize, x + 0.5 * cellSize, y + cellSize, corners[2] ? 0 : radius);
      drawCorner(context, x, y + cellSize, x, y + 0.5 * cellSize, corners[3] ? 0 : radius);
      drawCorner(context, x, y, x + 0.5 * cellSize, y, corners[0] ? 0 : radius);
      // context.closePath();
      context.fill();
    } else {
      if (corners[0] === 2) {
        fillCorner(context, x, y + 0.5 * cellSize, x, y, x + 0.5 * cellSize, y, radius);
      }
      if (corners[1] === 2) {
        fillCorner(context, x + 0.5 * cellSize, y, x + cellSize, y, x + cellSize, y + 0.5 * cellSize, radius);
      }
      if (corners[2] === 2) {
        fillCorner(context, x + cellSize, y + 0.5 * cellSize, x + cellSize, y + cellSize, x + 0.5 * cellSize, y + cellSize, radius);
      }
      if (corners[3] === 2) {
        fillCorner(context, x + 0.5 * cellSize, y + cellSize, x, y + cellSize, x, y + 0.5 * cellSize, radius);
      }
    }
  });
}

function drawSpot(contextData) {
  var context = contextData.context,
      isDark = contextData.isDark,
      colorDark = contextData.colorDark,
      effect = contextData.effect,
      _contextData$qrdata = contextData.qrdata,
      cellSize = _contextData$qrdata.cellSize,
      count = _contextData$qrdata.count;

  drawCells(contextData, function (_ref5) {
    var i = _ref5.i,
        j = _ref5.j,
        x = _ref5.x,
        y = _ref5.y;

    if (isDark(i, j)) {
      context.fillStyle = colorDark;
      var fillSize = void 0;
      if (i <= 7 && j <= 7 || i <= 7 && count - j - 1 <= 7 || count - i - 1 <= 7 && j <= 7 || i + 5 <= count && i + 9 >= count && j + 5 <= count && j + 9 >= count || i === 7 || j === 7) {
        fillSize = 1 - 0.1 * effect.value;
      } else {
        fillSize = 0.25;
      }
      var offset = (1 - fillSize) / 2;
      context.fillRect(x + offset * cellSize, y + offset * cellSize, fillSize * cellSize, fillSize * cellSize);
    }
  });
}

var cache = [];

/**
 * @desc Create a new canvas.
 * @param {Int} width Width of the canvas.
 * @param {Int} height Height of the canvas.
 * @return {Canvas}
 */
function getCanvas(_ref) {
  var width = _ref.width,
      height = _ref.height,
      canvas = _ref.canvas;

  var rCanvas = canvas || cache.pop() || QRCanvas$1.createCanvas();
  rCanvas.width = width;
  rCanvas.height = height == null ? width : height;
  return rCanvas;
}

function cacheCanvas(canvas) {
  if (Array.isArray(canvas)) cache.push.apply(cache, toConsumableArray(canvas));else if (QRCanvas$1.isCanvas(canvas)) cache.push(canvas);
}

/**
 * @desc Draw to the canvas with given image or colors.
 * @param {Canvas} canvas The canvas to initialize.
 * @param {Object} options
 *    data: {Image} or {String} or {Array}
 *    cellSize: {Int}
 */
function drawCanvas(canvas, options) {
  var data = options.data,
      cellSize = options.cellSize,
      clear = options.clear;

  var size = canvas.width;
  var queue = [data];
  var ctx = canvas.getContext('2d');
  if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
  while (queue.length) {
    var item = queue.shift();
    if (Array.isArray(item)) {
      queue = item.concat(queue);
    } else if (item) {
      var obj = void 0;
      if (QRCanvas$1.isDrawable(item)) {
        obj = { image: item };
      } else if (typeof item === 'string') {
        obj = { style: item };
      } else {
        obj = item;
      }
      var x = ('col' in obj ? obj.col * cellSize : obj.x) || 0;
      var y = ('row' in obj ? obj.row * cellSize : obj.y) || 0;
      if (x < 0) x += size;
      if (y < 0) y += size;
      var w = ('cols' in obj ? obj.cols * cellSize : obj.width) || size;
      var h = ('rows' in obj ? obj.rows * cellSize : obj.height) || size;
      if (obj.image) {
        ctx.drawImage(obj.image, x, y, w, h);
      } else {
        ctx.fillStyle = obj.style || 'black';
        ctx.fillRect(x, y, w, h);
      }
    }
  }
  return canvas;
}

var canvasText = void 0;
function measureText(text, font) {
  if (!canvasText) canvasText = getCanvas({ width: 100 });
  var ctx = canvasText.getContext('2d');
  ctx.font = font;
  return ctx.measureText(text);
}

QRCanvas$1.getCanvas = getCanvas;
QRCanvas$1.cacheCanvas = cacheCanvas;
QRCanvas$1.drawCanvas = drawCanvas;
QRCanvas$1.measureText = measureText;

// IE 9- does not support Uint8Array.
// `global` will be replaced by `window` when compiled for browsers.
var root = typeof window === 'undefined' ? global : window;
var Uint8Array = root.Uint8Array || root.Array;

/**
 * @desc Read image data from a canvas and find the edges of the image.
 */
function initBgData(_ref) {
  var canvas = _ref.canvas,
      isBackgroundColor = _ref.isBackgroundColor,
      margin = _ref.margin;

  var ctx = canvas.getContext('2d');
  var width = canvas.width,
      height = canvas.height;

  var total = width * height;
  var imageData = ctx.getImageData(0, 0, width, height);

  /**
   * Whether the pixel should be background taking margin into account.
   * 0 - not checked
   * 1 - background
   * 2 - edge of the image
   */
  var bgData = new Uint8Array(total);
  /**
   * Whether the pixel itself is a background color.
   * 0 - not checked
   * 1 - background
   * 2 - edge of the image
   */
  var pixelData = new Uint8Array(total);

  var queue = [];
  var slice = queue.slice;

  var isBgPixel = function isBgPixel(index) {
    var value = pixelData[index];
    if (!value) {
      var offset = index * 4;
      var colorArr = slice.call(imageData.data, offset, offset + 4);
      if (isBackgroundColor(colorArr)) {
        value = 1;
      } else {
        value = 2;
      }
      pixelData[index] = value;
    }
    return value === 1;
  };
  var checkSurroundings = function checkSurroundings(index) {
    if (bgData[index]) return;
    var x0 = index % width;
    var y0 = index / width | 0;
    var R = margin + 1;
    for (var x = Math.max(0, x0 - R + 1); x < x0 + R && x < width; x += 1) {
      for (var y = Math.max(0, y0 - R + 1); y < y0 + R && y < height; y += 1) {
        var dx = x - x0;
        var dy = y - y0;
        if (dx * dx + dy * dy < R * R) {
          if (!isBgPixel(x + y * width)) {
            bgData[index] = 2;
            return;
          }
        }
      }
    }
    bgData[index] = 1;
    queue.push(index);
  };
  var checkRow = function checkRow(index, excludeSelf) {
    if (index % width) checkSurroundings(index - 1);
    if (!excludeSelf) checkSurroundings(index);
    if ((index + 1) % width) checkSurroundings(index + 1);
  };

  // BFS
  for (var i = 0; i < width; i += 1) {
    checkSurroundings(i);
    checkSurroundings(total - 1 - i);
  }
  for (var _i = 0; _i < height; _i += 1) {
    checkSurroundings(_i * width);
    checkSurroundings((_i + 1) * width - 1);
  }
  var head = 0;
  while (head < queue.length) {
    var index = queue[head];
    if (index > width) checkRow(index - width);
    checkRow(index, true);
    if (index + width < total) checkRow(index + width);
    head += 1;
  }

  return bgData;
}

/**
 * @desc The callback to tell whether a pixel or an area is outside the edges.
 */
function bgChecker(bgData, width, height, level) {
  var isBackground = function isBackground() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var index = void 0;
    if (args.length === 1) {
      index = args[0];
    } else if (args.length === 2) {
      var x = args[0],
          y = args[1];

      index = x + y * width;
    } else if (args.length === 4) {
      var x0 = args[0],
          y0 = args[1],
          w = args[2],
          h = args[3];

      var x1 = Math.max(0, x0);
      var y1 = Math.max(0, y0);
      var x2 = Math.min(width, x0 + w);
      var y2 = Math.min(height, y0 + h);
      for (var _x = x1; _x < x2; _x += 1) {
        for (var _y = y1; _y < y2; _y += 1) {
          if (!isBackground(_x, _y)) return false;
        }
      }
      return true;
    } else {
      throw Error('Invalid index');
    }
    if (level === 3) return false;
    return bgData[index] === 1;
  };
  return isBackground;
}

/**
 * @desc Clear the background so that the shadow can be filled with custom styles.
 */
function bgClearer(isBackground, width, height) {
  var total = width * height;
  var clearBackground = function clearBackground(canvas) {
    if (canvas.width !== width || canvas.height !== height) return;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);
    for (var i = 0; i < total; i += 1) {
      if (isBackground(i)) {
        var offset = i * 4;
        imageData.data[offset] = 0;
        imageData.data[offset + 1] = 0;
        imageData.data[offset + 2] = 0;
        imageData.data[offset + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };
  return clearBackground;
}

/**
* @desc Detect image edge based on canvas
*/
function getEdger(_ref2) {
  var canvas = _ref2.canvas,
      margin = _ref2.margin,
      level = _ref2.level;

  /**
   * @desc The default isBackgroundColor callback to decide
   * whether a color is background by its Alpha value.
   */
  var isBackgroundColor = function isBackgroundColor(colorArr) {
    return !colorArr[3];
  }; // alpha is 0

  var bgData = void 0;
  if (level && level < 3) {
    try {
      bgData = initBgData({ canvas: canvas, margin: margin, isBackgroundColor: isBackgroundColor });
    } catch (e) {
      // The canvas has been tainted by cross-origin data.
    }
    if (!bgData) return {};
  }

  var width = canvas.width,
      height = canvas.height;

  var isBackground = bgChecker(bgData, width, height, level);
  var clearBackground = bgClearer(isBackground, width, height);
  return { enabled: true, isBackground: isBackground, clearBackground: clearBackground };
}

/**
 * clearEdges:
 * - 0: do nothing
 * - 1: clear pixels covered by logo pixels
 * - 2: clear cells covered by logo pixels
 * - 3: clear a rectangle area covered by logo image
 */
var plugin = function plugin(qrcanvas) {
  var events = qrcanvas.events;

  var transclude = {};
  var edger = void 0;
  events.on('detectEdges', function (_ref3) {
    var canvas = _ref3.data;
    var logo = qrcanvas.options.logo,
        _qrcanvas$qrdata = qrcanvas.qrdata,
        count = _qrcanvas$qrdata.count,
        cellSize = _qrcanvas$qrdata.cellSize;

    edger = getEdger({
      canvas: canvas,
      margin: logo.margin,
      level: logo.clearEdges
    });

    if (!edger.enabled) {
      console.warn('[QRCanvas] The canvas has been tainted by cross-origin data, plugin `edger` disabled.');
      return;
    }

    // Clear cells broken by the logo (incomplete cells)
    if (logo.clearEdges > 1) {
      /**
       * Whether the cell is overlapped by logo.
       * 0 - partially or completely overlapped.
       * 1 - clear.
       */
      transclude = new Uint8Array(count * count);
      for (var i = 0; i < count; i += 1) {
        for (var j = 0; j < count; j += 1) {
          transclude[i * count + j] = edger.isBackground(j * cellSize - logo.x, i * cellSize - logo.y, cellSize, cellSize);
        }
      }
    }
  });
  events.on('clearLogo', function (_ref4) {
    var canvas = _ref4.data;
    var logo = qrcanvas.options.logo;

    if (!logo.clearEdges || !edger.enabled) return;
    if ((logo.image || logo.text) && logo.clearEdges === 1) {
      var canvasLogo = QRCanvas$1.getCanvas(logo.width + 2 * logo.margin, logo.height + 2 * logo.margin);
      var ctxLogo = canvasLogo.getContext('2d');
      ctxLogo.fillStyle = 'white';
      ctxLogo.fillRect(0, 0, canvasLogo.width, canvasLogo.height);
      edger.clearBackground(canvasLogo);
      var ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(canvasLogo, logo.x, logo.y);
    }
  });
  qrcanvas.shouldTransclude = function (index) {
    var logo = qrcanvas.options.logo;

    if (edger && edger.enabled && logo.clearEdges > 1) return transclude[index];
    return true;
  };
};

QRCanvas$1.plugins.push(plugin);

function qrcanvas$1(options) {
  var canvas = new QRCanvas$1(options);
  canvas.makeAll();
  return canvas.output(options);
}

qrcanvas$1.QRCanvas = QRCanvas$1;

var QRCanvas = qrcanvas$1.QRCanvas;

QRCanvas.createCanvas = function () {
  return document.createElement('canvas');
};
QRCanvas.isCanvas = function (el) {
  return el instanceof HTMLCanvasElement;
};
QRCanvas.isDrawable = function (el) {
  return QRCanvas.isCanvas(el) || el instanceof HTMLImageElement;
};

return qrcanvas$1;

})));
