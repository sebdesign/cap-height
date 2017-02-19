/**
 * Cap height Module.
 *
 * @module cap-height
 */

// import WebFont from 'webfontloader';
import _ from 'lodash';
import _fvd from 'fvd';

/**
 * The threshold to determine non-white pixels.
 *
 * @type {number}
 */
const THRESHOLD = 0.75;

/**
 * The margin to apply between canvases.
 *
 * @type {number}
 */
const CANVAS_MARGIN = 10;

/**
 * Canvas size / font-size ratio.
 *
 * @type {Number}
 */
const MULTIPLIER = 2;

/**
 * The device pixel ratio, used to calculate the dimensions on high-DPI screens.
 *
 * @type {number}
 */
const DPR = window.devicePixelRatio;

/**
 * The element that will contain the canvases.
 *
 * @type {Node}
 */
let container;

/**
 * The default font properties.
 *
 * @type {object}
 */
const defaults = {
  'font-style': 'normal',
  'font-weight': 400,
  'font-size': '100px',
  'font-family': 'serif'
};

_.mixin({
  fillRect(context, x, y, width, height) {
    return _.tap(context, _.method('fillRect', x, y, width, height));
  },
  fillText(context, text, x, y) {
    return _.tap(context, _.method('fillText', text, x, y));
  },
  scale(context, x, y = x) {
    return _.tap(context, _.method('scale', x, y));
  },
});

/**
 * Calculate the cap height.
 *
 * @param  {object} properties The font properties
 * @param  {string} [text=H] The text to apply the properties
 * @return {object} The properties with the cap-height key value
 */
const calculate = (properties, text = 'H') => {
  return _(properties)
    .defaults(defaults)
    .thru(_.partial(measureTextHeight, text))
    .value();
};

module.exports = {
  /**
   * Calculate the cap height.
   */
  calculate,

  /**
   * Calculate the cap-height and execute the given callback with the resulted properties.
   *
   * @param  {function} callback The callback to execute when the calculation is complete.
   * @param  {string}   text The text used to calculate the cap-height.
   * @return {function} The listener for the webfontloader event.
   */
  fontActive(callback, text) {
    /**
     * Listener for the fontactive event of the Web Font Loader.
     *
     * @param {string} familyName The font-family to be added to the properties.
     * @param {object} fvd The parsed font properties.
     * @return {object} The wrapped font properties.
     * @listens module:webfont~fontactive
     */
    return (familyName, fvd) => {
      return _(fvd)
        // Parse the fvd properties returned from the Web Font Loader
        .thru(_fvd.parse)
        // Set the font-family
        .set('font-family', familyName)
        // Execute the calculation
        .thru(_.partialRight(calculate, text))
        // Execute the callback
        .thru(callback)
        .commit();
    };
  },

  /**
   * Inspect a DOM element and calculate the cap-height given its computed CSS properties.
   *
   * @param  {Node}   element The node element to inspect.
   * @param  {string} text The used to calculate the cap-height.
   * @return {object} The font properties.
   */
  inspect(element, text) {
    return _(element)
      .thru(window.getComputedStyle)
      .pick(_.keys(defaults))
      .thru(_.partialRight(calculate, text))
      .value();
  },

  /**
   * Set a container element to display the rendered canvases.
   *
   * @param {Node} element The node element to contain the canvases.
   */
  setContainer(element) {
    container = element;
  }
};

/**
 * Measure the height of the given text with the specified font properties.
 *
 * @param  {string} [text=H] The text being measured.
 * @param  {object} properties The font properties used to measure the height.
 * @return {object} The font properties with the cap-height.
 * @throws {RangeError}
 */
const measureTextHeight = (text = 'H', properties) => {
  const fontSize = getFontSize(properties);
  const base = MULTIPLIER * fontSize;

  if (/\s/.test(text)) {
    throw new RangeError('Cannot calculate the height of whitespace.');
  }

  // Set the actual pixel dimensions
  const dimensions = {
    width: base * text.length,
    height: base
  };

  // Set the physical pixel dimensions
  const physicalDimensions = _.mapValues(dimensions, toDot);

  const canvas = createCanvas(dimensions, physicalDimensions);
  let context = getContext(canvas);

  context = drawContext(context, properties, dimensions, text);

  const metrics = getMetrics(context, physicalDimensions);
  const capHeight = getHeight(metrics);

  // Draw a rectangle marking the cap height bounds
  _(context)
    .set('fillStyle', 'rgba(255, 85, 51, .1)')
    .fillRect(0, toPx(metrics.ascent), toPx(physicalDimensions.width), toPx(capHeight))
    .commit();

  // Display the canvas
  displayCanvas(canvas);

  return _.assign(properties, {
    '--cap-height': toPx(capHeight) / fontSize
  });
};

/**
 * Get the font-size as a unitless number.
 *
 * @param  {object} properties The font properties containing the font-size.
 * @return {number} The font-size as a unitless number.
 * @throws {RangeError}
 */
const getFontSize = (properties) => {
  return _
    .chain(properties)
    .get('font-size', 0)
    .replace(/\D/g, '')
    .toNumber()
    .thru((fontSize) => {
      if (isNaN(fontSize)) {
        throw new RangeError('Cannot calculate the height of the text with invalid font-size.');
      }

      if (fontSize === 0) {
        throw new RangeError('Cannot calculate the height of the text with font-size: 0.');
      }

      return fontSize;
    });
};

/**
 * Create a canvas with the given dimensions.
 *
 * @param  {object} dimensions The width and height to set as CSS styles.
 * @param  {object} physicalDimensions The physical width and height to set to the canvas element.
 * @return {HTMLCanvasElement} The canvas element.
 */
const createCanvas = (dimensions, physicalDimensions) => {
  let style = _(dimensions)
    .set('margin', CANVAS_MARGIN)
    .mapValues(value => value + 'px')
    .value();

  return _(document.createElement('canvas'))
    .assign(physicalDimensions)
    .merge({'style': style})
    .value();
};

/**
 * Append the given canvas to the container element.
 *
 * @param {HTMLCanvasElement} canvas The canvas to add to the container.
 * @return void
 */
const displayCanvas = (canvas) => {
  if (_.isElement(container)) {
    container.appendChild(canvas);
  }
};

/**
 * Get the scaled canvas drawing context.
 *
 * @param  {HTMLCanvasElement} canvas The canvas element.
 * @return {CanvasRenderingContext2D} The canvas context.
 */
const getContext = (canvas) => {
  return _(canvas.getContext('2d'))
    .scale(DPR)
    .value();
};

/**
 * Draw the text and the background in the canvas context.
 *
 * @param {CanvasRenderingContext2D} context The canvas context.
 * @param {object} properties The font properties.
 * @param {object} dimensions The dimensions of the drawing.
 * @param {number} dimensions.width The width of the drawing.
 * @param {number} dimensions.height The height of the drawing.
 * @param {string} text The text to draw.
 * @return {CanvasRenderingContext2D} The canvas context with the rendered text and background.
 */
const drawContext = (context, properties, {width, height}, text) => {
  return _(context)
    // Set all canvas pixeldata values to 255, with all the content
    // data being 0. This lets us scan for data[i] != 255.
    .set('fillStyle', 'white')
    .fillRect(0, 0, width, height)
    // Set the text properties
    .assign({
      font: composeFontProperty(properties),
      fillStyle: 'black',
      textAlign: 'center',
      textBaseline: 'middle'
    })
    // Draw the text at the center
    .fillText(text, width / 2, height / 2)
    .value();
};

/**
 * Compose the font shorthand property.
 *
 * @param  {object} properties The font properties.
 * @return {string} The shorthand font value.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font
 */
const composeFontProperty = (properties) => {
  return _(properties)
    .at('font-style', 'font-weight', 'font-size', 'font-family')
    .join(' ');
};

/**
 * Get the ascent and descent from the pixel data.
 *
 * @param  {CanvasRenderingContext2D} context The canvas context.
 * @param  {object} dimensions The physical dimensions used as bounds.
 * @param  {number} dimensions.width The physical width.
 * @param  {number} dimensions.height The physical height.
 * @return {object} The ascent and descent.
 */
const getMetrics = (context, {width, height}) => {
  let pixelData = getPixelData(context, width, height);

  return {
    ascent: getAscent(pixelData, width),
    descent: getDescent(pixelData, width),
  };
};

/**
 * Get the pixel data of the context.
 *
 * @param  {CanvasRenderingContext2D} context The canvas context.
 * @param  {number} width The width of the extracted area.
 * @param  {number} height The height of the extracted area.
 * @return {Uint8ClampedArray} One-dimensional array containing RGBA data.
 */
const getPixelData = (context, width, height) => {
  return context.getImageData(0, 0, width, height).data;
};

/**
 * Calculate the height of the text with the given ascent and descent.
 *
 * @param  {object} metrics The object metrics.
 * @param  {number} metrics.descent The position of the descent.
 * @param  {number} metrics.ascent The position of the ascent.
 * @return {number} The height.
 */
const getHeight = ({descent, ascent}) => descent - ascent + 1;

/**
 * Get the ascent of the text.
 *
 * Forward scan the pixel data and get the vertical position of the first non-white pixel.
 *
 * @param  {Uint8ClampedArray} pixelData The RGBA values of the area.
 * @param  {number} width The width of the area.
 * @return {number} The Y coordinate of the ascent.
 */
const getAscent = (pixelData, width) => {
  let index = _.findIndex(pixelData, isNotWhite);

  return getYPosition(index, width);
};

/**
 * Get the descent of the text.
 *
 * Reverse scan the pixel data and get the vertical position of the last non-white pixel.
 *
 * @param  {Uint8ClampedArray} pixelData The RGBA values of the area.
 * @param  {number} width The width of the area.
 * @return {number} The Y coordinate of the descent.
 */
const getDescent = (pixelData, width) => {
  let index = _.findLastIndex(pixelData, isNotWhite);

  return getYPosition(index, width);
};

/**
 * Get the vertical position of the pixel data index, given the width.
 *
 * @param  {number} index The index of the first non-white pixel.
 * @param  {number} width The width of the area.
 * @return {number} The Y coordinate.
 */
const getYPosition = (index, width) => _.floor((index / 4) / width);

/**
 * Check the given RGBA value is below the threshold.
 *
 * @param  {number} value The color channel value (0-255).
 * @return {boolean} True if the value is white.
 */
const isNotWhite = value => value < (255 * THRESHOLD);

/**
 * Convert a physical pixel value to a CSS pixel.
 *
 * @param {number} value The physical pixel.
 * @return {number} The CSS pixel.
 */
const toPx = value => value / DPR;

/**
 * Convert a CSS pixel to a physical pixel.
 *
 * @param {number} value The CSS pixel.
 * @return {number} The physical pixel.
 */
const toDot = value => value * DPR;
