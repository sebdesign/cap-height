// var WebFont = require('webfontloader');
var _ = require('lodash');
var _fvd = require('fvd');
var format = require('string-format')

module.exports = calculateCapHeight;

/**
 * Calculate the cap height.
 *
 * @param String familyName
 * @param Object fvd
 * @param String text
 */
function calculateCapHeight(familyName, fvd, text) {
  var options = mergeOptions(familyName, _fvd.parse(fvd));
  var capHeight = measureTextHeight(options, text);

  console.log(options);

  return capHeight / options["font-size"];
}
/**
 * Merge the font-family and the given options with the defaults.
 *
 * @param  String familyName
 * @param  Object options
 * @return Object
 */
function mergeOptions(familyName, options) {
  var defaults = {
    "font-style": "normal",
    "font-weight": 400,
    "font-size": 100,
    "font-family": "serif"
  };

  _.set(options, "font-family", familyName);

  return _.merge(defaults, options);
}

/**
 * Compose the font shorthand property.
 *
 * @return String
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */
function composeFontProperty(options) {
  return format("{font-style} {font-weight} {font-size}px {font-family}", options);
}

/**
 * Measure the height of the given text with the specified font properties.
 *
 * @param  Object options
 * @param  String text
 * @return Number
 */
function measureTextHeight(options, text) {
  text = text || "H";

  if (/\s/.test(text)) {
    console.warn('Cannot calculate the height of whitespace.');
    return 0;
  }

  var multiplier = 2;
  var width = multiplier * options["font-size"] * text.length;
  var height = multiplier * options["font-size"];

  var canvas = createCanvas(width, height);
  var ctx = getContext(canvas);
  ctx = drawContext(ctx, options, width, height, text);

  var pixelData = getPixelData(ctx, width, height);
  var ascent = getAscent(pixelData, width);
  var descent = getDescent(pixelData, width);

  document.body.appendChild(canvas);

  return getHeight(descent, ascent);
}

/**
 * Create a canvas with the given dimensions.
 *
 * @param Number width
 * @param Number height
 * @return HTMLCanvasElement
 */
function createCanvas(width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  return canvas;
}

/**
 * Get the canvas drawing context.
 *
 * @return CanvasRenderingContext2D
 */
function getContext(canvas) {
  return canvas.getContext("2d");
}

/**
 * Draw the text and the background in the canvas context.
 *
 * @param CanvasRenderingContext2D context
 * @param Object options
 * @param Number width
 * @param Number height
 * @param String context
 * @return CanvasRenderingContext2D
 */
function drawContext(context, options, width, height, text) {
  context.font = composeFontProperty(options);

  // Align the text horizontally and vertically
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Set all canvas pixeldata values to 255, with all the content
  // data being 0. This lets us scan for data[i] != 255.
  context.fillStyle = "white";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "black";

  // Draw the text at the center
  context.fillText(text, width / 2, height / 2);

  return context;
}

/**
 * Get the pixel data of the context.
 *
 * @param  CanvasRenderingContext2D context
 * @param  Number width
 * @param  Number height
 * @return Uint8ClampedArray
 */
function getPixelData(context, width, height) {
  return context.getImageData(0, 0, width, height).data;
}

/**
 * Calculate the height of the text with the given ascent and descent.
 *
 * @param  Number ascent
 * @param  Number descent
 * @return Number
 */
function getHeight(descent, ascent) {
  return descent + 1 - ascent;
}

/**
 * Get the ascent of the text.
 *
 * Forward scan the pixel data and get the vertical position of the first black pixel.
 *
 * @param  Uint8ClampedArray pixelData
 * @param  Number width
 * @return Number
 */
function getAscent(pixelData, width) {
  var i = _.findIndex(pixelData, isBlack);

  return getYPosition(i, width);
}

/**
 * Get the descent of the text.
 *
 * Reverse scan the pixel data and get the vertical position of the last black pixel.
 *
 * @param  Uint8ClampedArray pixelData
 * @param  Number width
 * @return Number
 */
function getDescent(pixelData, width) {
  var i = _.findLastIndex(pixelData, isBlack);

  return getYPosition(i, width);
}

/**
 * Get the y of the pixel data index, given the x width.
 *
 * @param Number i
 * @param Number width
 * @return Number
 */
function getYPosition(i, width) {
  return i / (width * 4) | 0;
}

/**
 * Check the given RGBA value is black.
 *
 * @param Number value
 * @return Boolean
 */
function isBlack(value) {
  return value === 0;
}
