// var WebFont = require("webfontloader");
var _ = require("lodash");
var _fvd = require("fvd");
var format = require("string-format");

var container;

module.exports = {
  calculate: calculate,

  /**
   * Event listener for the fontactive event of the Web Font Loader.
   *
   * Calculate the cap-height and execute the given callback with the resulted properties.
   *
   * @param  Function callback
   * @param  String   text
   * @return Function
   */
  fontActive: function(callback, text) {
    return function(familyName, fvd) {
      // Parse the fvd properties returned from the Web Font Loader
      var parsed = _fvd.parse(fvd);

      // Add the font-family
      _.set(parsed, "font-family", familyName);

      // Calculate the cap-height
      var properties = calculate(parsed, text);

      // Execute the callback
      return callback(properties);
    };
  },

  /**
   * Set a container element to display the rendered canvas.
   *
   * @param  Node element
   * @return Node
   */
  setContainer: function(element) {
    return container = element;
  }
};

/**
 * Calculate the cap height.
 *
 * @param Object properties
 * @param String text
 * @return Object
 */
function calculate(properties, text) {
  // Merge with the default properties
  properties = mergeWithDefaults(properties);

  // Measure the actual size of the text
  var height = measureTextHeight(properties, text);

  // Calculate the ratio between the height and the font-size
  var capHeight = height / getFontSize(properties);

  // Add the cap-height to the properties
  _.set(properties, "cap-height", capHeight);

  return properties;
}

/**
 * Merge the given properties with the defaults.
 *
 * @param  Object properties
 * @return Object
 */
function mergeWithDefaults(properties) {
  var defaults = {
    "font-style": "normal",
    "font-weight": 400,
    "font-size": "100px",
    "font-family": "serif"
  };

  return _.merge(defaults, properties);
}

/**
 * Measure the height of the given text with the specified font properties.
 *
 * @param  Object properties
 * @param  String text
 * @return Number
 *
 * @throws RangeError
 */
function measureTextHeight(properties, text) {
  var fontSize = getFontSize(properties);

  text = text || "H";

  if (/\s/.test(text)) {
    throw new RangeError("Cannot calculate the height of whitespace.");
  }

  var multiplier = 2;
  var width = multiplier * fontSize * text.length;
  var height = multiplier * fontSize;

  var canvas = createCanvas(width, height);
  var ctx = getContext(canvas);
  ctx = drawContext(ctx, properties, width, height, text);

  var pixelData = getPixelData(ctx, width, height);
  var ascent = getAscent(pixelData, width);
  var descent = getDescent(pixelData, width);

  // Display the canvas
  displayCanvas(canvas);

  return getHeight(descent, ascent);
}

/**
 * Get the font-size as a number.
 *
 * @param Object properties
 * @return Number
 */
function getFontSize(properties) {
  var fontSize = parseFloat(_.replace(_.get(properties, "font-size", 0), /\D/g, ''));

  if (isNaN(fontSize)) {
    throw new RangeError("Cannot calculate the height of the text with invalid font-size.");
  }

  if (fontSize === 0) {
    throw new RangeError("Cannot calculate the height of the text with font-size: 0.");
  }

  return fontSize;
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
 * Append the given canvas to the container element.
 *
 * @param HTMLCanvasElement canvas
 * @return void
 */
function displayCanvas(canvas) {
  if (container && container.nodeType) {
    container.appendChild(canvas);
  }
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
 * @param Object properties
 * @param Number width
 * @param Number height
 * @param String context
 * @return CanvasRenderingContext2D
 */
function drawContext(context, properties, width, height, text) {
  context.font = composeFontProperty(properties);

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
 * Compose the font shorthand property.
 *
 * @param Object properties
 * @return String
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */
function composeFontProperty(properties) {
  return format("{font-style} {font-weight} {font-size} {font-family}", properties);
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
  return _.floor(i / (width * 4));
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
