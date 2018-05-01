'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Canvas = _interopDefault(require('canvas'));
var qrcanvas = _interopDefault(require('./qrcanvas.common.js'));

/* eslint-disable */
/* eslint-enable */

const { QRCanvas } = qrcanvas;
QRCanvas.createCanvas = () => new Canvas();
QRCanvas.isCanvas = el => el instanceof Canvas;
QRCanvas.isDrawable = QRCanvas.isCanvas;

module.exports = qrcanvas;
