# Drawful 2 SVG Loader

A [Tampermonkey](https://www.tampermonkey.net/) script that enables loading of SVG in [Drawful 2](https://www.jackboxgames.com/drawful-two/). 

Only SVG [paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) are supported, to prepare SVG using [Inkscape](https://inkscape.org/):

* <kbd>Ctrl</kbd> + <kbd>A</kbd> (select all)
* <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd> (Path/Object to paths)
* <kbd>Ctrl</kbd> + <kbd>U</kbd> (ungroup)
* <kbd>Ctrl</kbd> + <kbd>G</kbd> (group again)
* <kbd>Ctrl</kbd> + <kbd>S</kbd> (save - choose as plain svg)

## Why?
To easily draw 'a picture of yourself'.

## Instalation
* [Tampermonkey](https://www.tampermonkey.net/)
* [open this script](https://raw.githubusercontent.com/zbrkic/drawful-2-svg-loader/master/drawful-2-svg-loader.user.js)

## Sample
![sample](https://github.com/zbrkic/drawful-2-svg-loader/blob/master/drawful-2-dragon-head.webp)

[Dragon Head](https://openclipart.org/detail/302205/dragon-head) SVG from [openclipart.org](https://openclipart.org)

## Implementation Details

### Poor Man's SVG Rendering
[Drawful 2](https://www.jackboxgames.com/drawful-two/) uses lines to represent a drawing. To create lines from SVG path, we are getting points on the path using [getPointAtLength](https://developer.mozilla.org/en-US/docs/Web/API/SVGPathElement/getPointAtLength). To detect "moveTo" command, distance from last point is checked (if it is greater than step on the path). 

### Monkey Patching
Monkey patching is based on [Drawful 2 Cheat](https://github.com/Maeeen/drawful-2-colors), but with some changes. Instead of wrapping each function, source code of function is changed, hoping it will be less fragile to changes in [Drawful 2](https://www.jackboxgames.com/drawful-two/).

## Ineresting projects found
* [Drawful 2 Cheat](https://github.com/Maeeen/drawful-2-colors)
* [Coördinator](https://github.com/spotify/coordinator)
* [Rough.js](https://github.com/pshihn/rough)
* [Sketchy SVGs with RoughJS](https://jmperezperez.com/roughjs/)

