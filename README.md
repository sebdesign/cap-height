# Cap height

Calculate the **cap height** of any font loaded with [Web Font Loader](https://github.com/typekit/webfontloader). See the demo on [CodePen](http://codepen.io/sebdesign/pen/EKmbGL?editors=0011).

**What is the cap height?**

The cap height is the height of a capital letter measured from the baseline.

> Read more on [Typography Deconstructed](http://www.typographydeconstructed.com/cap-height) and on [Wikipedia](https://en.wikipedia.org/wiki/Cap_height).

**How is this useful?**

The web lacks *exquisite* typography. Of course, its state is very good with the wide use of `@font-face` and the quality web font distribution services and foundries. However, setting type on the web still challenging. [Several](https://github.com/StudioThick/megatype) [attempts](http://compass-style.org/reference/compass/typography/vertical_rhythm) [and](https://gist.github.com/razwan/10662500) [tools](https://sassline.com) have risen in order to define a proper vertical rhythm and a baseline grid.

But most of them depend on a *cap height* ratio, which varies for every typeface and cannot be calculated with CSS. You have to rely on design software or font metrics from the foundries to find this out. This package addresses this issue by rendering loaded fonts on a canvas to measure the actual height of the glyphs, and thus calculating the cap-height/font-size ratio. Then you could easily apply this value to any tool you like.

**Read more about the subject**

- [Web typography is broken. Here’s how we can fix it](http://www.studiothick.com/essays/web-typography-is-broken)

- [Aligning type to baseline the right way using SASS](https://medium.com/written-in-code/aligning-type-to-baseline-the-right-way-using-sass-e258fce47a9b)

## Demo

See the demo on [CodePen](http://codepen.io/sebdesign/pen/EKmbGL?editors=0011). Open the CodePen console to see the output.

Or run `dist/index.html` in your browser and open the developer tools. In the output of the console you should see a JSON object for each loaded font, with its properties. An additional `cap-height` property contains the **holy grail** of the web typography.

In the browser window a canvas will be displayed for each loaded font with the letter *H*.

This example loads *Roboto Mono* through *Google Fonts*; but you can use any module available in the *Web Font Loader*, like *Typekit*, *Fondeck*, *Fonts.com* or your own web fonts.

> Check all the available modules: https://github.com/typekit/webfontloader#modules

A more complete demo will be available soon. For real.

## How it works

When a `@font-face` font is loaded with the *Web Font Loader*, it creates a HTML canvas and draws the letter *H* with the appropriate CSS properties extracted from the [Font Variation Description](http://typekit.github.io/fvd). Then it measures the actual pixel height of the drawn letter, and calculates the ratio between the height and the `font-size`.

## WIP

This project is a work in progress. I’m planning to add more methods to calculate loaded fonts beyond the *Web Font Loader*, like the [Font Face API](https://developer.mozilla.org/el/docs/Web/API/FontFace), or simply by selecting a DOM element along with its CSS properties.

## Installation

### In a browser:

Include the `dist/bundle.js` script in your document, then call the methods on the `capHeight` instance. **Don’t forget to include the Web Font Loader**.

```html
<script src="bundle.js"></script>

<script>
  capHeight.calculate({});
</script>
```

### As a module:

```shell
$ npm install cap-height
```

```js
var capHeight = require("cap-height");

capHeight.calculate({});
```

## API

### calculate(properties, text)

This is the main method which calculates the `cap-height`. The first argument is an object containing the `font-style`, `font-weight`, `font-size`, and `font-family` properties. If you omit any of these, the defaults in the example below will be used.

**Warning**: The font-size **MUST** be in pixels. If any other unit of unit-less number is passed, it will be evaluated in pixels. E.g. `2em` or `2` will be computed to `2px`.

The second argument is optional. It defines the text that will be used to measure the cap-height. The default is *H*.

The method returns the passed object along with a `cap-height` property, and any other omitted property.

```js
capHeight.calculate({
  "font-style": "normal",
  "font-weight": "400",
  "font-size": "100px",
  "font-family": "serif"
}, "HI");

// Output
{
  font-style: "normal",
  font-weight: 400,
  font-size: "100px",
  font-family: "serif",
  cap-height: 0.66
}
```

### fontActive(callback, text)

Event handler for the `fontactive` or `active` events of the *Web Font Loader*.

This method accepts a `callback` function, in which the calculated properties will be passed. The callback is executed after the Web Font Loader has fired the appropriate events and the calculations are completed.

> Read about the Web Font Loader events: https://github.com/typekit/webfontloader#events

You can pass a string as an optional second argument after your callback, to define the text that will be used to calculate the cap-height. The default is *H*.

```js
WebFontConfig = {
  {
    // define your font modules here
  },
  fontactive: capHeight.fontActive(function(properties) {
    console.log(properties);
  }, "HI");
};
```

### setContainer(element)

If you want to see/debug the process, define a DOM element in which a canvas(es) of each rendered font will be displayed.

```js
WebFontConfig = {
  // set the container while the fonts are loading
  loading: function() {
    capHeight.setContainer(document.body);
  }
}
```

## Credits

- [Thomas Bredin-Grey](https://github.com/tbredin) for the essay [Web typography is broken. Here’s how we can fix it](http://www.studiothick.com/essays/web-typography-is-broken/), which was the main inspiration for this project.

- [Sebastian Lasse](https://github.com/sebilasse) for the [font metrics for google fonts](http://codepen.io/sebilasse/pen/gPBQqm?editors=1010) on CodePen, which provided the main implementation the cap-height calculation.

- [Percolate](https://github.com/percolate) for the [Font Variation Description for JavaScript](https://github.com/percolate/fvd) module.
