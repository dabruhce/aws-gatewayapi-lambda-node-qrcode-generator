'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var qrcode = _interopDefault(require('qrcode-generator'));

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

      var qr = qrcode(typeNumber, correctLevel);
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

module.exports = qrcanvas$1;
