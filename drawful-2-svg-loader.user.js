// ==UserScript==
// @name         Drawful 2 SVG loader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  enables loading of SVG
// @author       zbrkic
// @match        https://jackbox.tv/
// @grant        none
// @repo         https://github.com/zbrkic/drawful-2-svg-loader
// @downloadURL  https://raw.githubusercontent.com/zbrkic/drawful-2-svg-loader/master/drawful-2-svg-loader.user.js
// ==/UserScript==

// Only SVG paths are supported, to prepare SVG using Inkscape:
//   Ctrl + A (select all)
//   Shift + Ctrl + C (Path/Object to paths)
//   Ctrl + U (ungroup)
//   Ctrl + G (group again)
//   Ctrl + S (save - choose as plain svg)

(function () {
    'use strict';

    const debug = true;
    let drawfulObj = null;

    const log = (message) => {
        if (debug) {
            console.log("[Debug] " + message);
        }
    };

    const DRAWFUL_2_APP_EXPORT_ID = 44;

    window.startDrawingInterfaceCallback = (drawfulObject) => {
        drawfulObj = drawfulObject;
        injectHtml();
    };

    const indexOfFunctionEnd = (text, name) => {
        let i = text.indexOf(name + ":");

        if (i === -1) return i;

        for (let count = 0; ; i++) {
            if (text[i] === '{') count++;
            if (text[i] === '}') {
                count--;
                if (!count)
                    return i;
            }
        }
    };

    const patchDrawful = (e) => {
        log("patchDrawful");

        for (let key in e[1]) {
            const oldFunction = e[1][key].toString();
            const i = indexOfFunctionEnd(oldFunction, "startDrawingInterface");

            if (i === -1) continue;

            const patch = ", window.startDrawingInterfaceCallback(this)";
            let patchedFunction = oldFunction.substring(0, i) + patch + oldFunction.substring(i);

            patchedFunction = patchedFunction
                .replace(/^function[^{]+{/i, "")
                .replace(/}[^}]*$/i, "");

            e[1][key] = new Function("t", "e", "n", patchedFunction);
            return;
        }

        log("startDrawingInterface not found!");
    };

    const patchWebpack = () => {
        log("patchWebpack");
        const originalPush = window.webpackJsonp.push;

        window.webpackJsonp.push = function(a1, a2) {
            if (Array.isArray(a1) && Array.isArray(a1[0]) && a1[0][0] === DRAWFUL_2_APP_EXPORT_ID) {
                patchDrawful(a1);
            }

            return originalPush.apply(this, arguments);
        };
    };

    const tryPatch = () => setTimeout(() => window.webpackJsonp ? patchWebpack() : tryPatch(), 500);
    tryPatch();

    const redrawLines = (lines) => {
        const cc = drawfulObj.currentCanvas;
        cc.isDrawing = false;
        cc.isClean = false;
        cc.lines = lines;

        let ctx = cc.context;
        ctx.clearRect(0, 0, cc.canvas.width, cc.canvas.height);

        lines.forEach(line => {
            const points = line.points;
            ctx.strokeStyle = line.color;
            ctx.miterLimit = line.thickness;
            ctx.lineWidth = line.thickness;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        });
    };

    const distance = (p1, p2) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const scaleLines = (lines, min, max) => {
        const cc = drawfulObj.currentCanvas;
        const width = max.x - min.x;
        const height = max.y - min.y;
        const scale = Math.min(cc.canvas.width / width, cc.canvas.height / height);
        const offset = { x: (cc.canvas.width - width * scale) / 2, y: (cc.canvas.height - height * scale) / 2 };

        for (let line of lines) {
            for (let point of line.points) {
                point.x = (point.x - min.x) * scale + offset.x;
                point.y = (point.y - min.y) * scale + offset.y;
            }

            line.thickness = cc.thickness;
            line.color = cc.color;
        }
    };

    const convertSvgToLines = (svgXml) => {
        const parser = new DOMParser();
        const div = parser.parseFromString(svgXml, "image/svg+xml");
        const paths = div.querySelectorAll('path');
        const step = 5;
        let lines = [];
        let min = { x: Number.MAX_VALUE, y: Number.MAX_VALUE };
        let max = { x: Number.MIN_VALUE, y: Number.MIN_VALUE };

        for (let path of paths) {
            let points = [];
            let lastPoint = null;

            for (let l = 0; l <= path.getTotalLength(); l = l + step) {
                let point = path.getPointAtLength(l);

                if (l > 0 && distance(point, lastPoint) > 1.1 * step) {
                    lines.push({ points: points });
                    points = [];
                }

                points.push({ x: point.x, y: point.y });
                lastPoint = point;

                min.x = Math.min(point.x, min.x);
                min.y = Math.min(point.y, min.y);
                max.x = Math.max(point.x, max.x);
                max.y = Math.max(point.y, max.y);
            }

            lines.push({ points: points });
        }

        scaleLines(lines, min, max);

        return lines;
    };

    const loadSvg = (e) => {
        log("loadSvg");
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const svgXml = e.target.result;
            const lines = convertSvgToLines(svgXml);

            let pointCount = 0;

            for (let l of lines) {
                pointCount += l.points.length;
            }

            log('lines: ' + lines.length);
            log('points: ' + pointCount);

            redrawLines(lines);
        };

        reader.readAsText(file);
    };

    const injectHtml = () => {
        log("injecting HTML");
        const html = `
        <div class="col-xs-4">
            <form class="pure-form">
                <button type="button" id="load-svg"
                    class="submit-drawing button-drawful button-drawful-black button-large col-xs-12"
                    style="margin-top: 0px;"
                    onclick="document.getElementById('load-svg-input').click();">
                    load
                </button>
                <input type="file" style="display:none;" id="load-svg-input" name="file"/>
            </form>
        </div>
        `;
        const loadSvgBtn = document.querySelector("#load-svg");

        if (loadSvgBtn) return;

        const buttonBar = document.querySelector(".button-bar");

        if (!buttonBar) return;

        buttonBar.children[0].classList.remove("col-xs-5");
        buttonBar.children[0].classList.add("col-xs-3");
        buttonBar.children[1].classList.remove("col-xs-5");
        buttonBar.children[1].classList.add("col-xs-4");
        buttonBar.children[1].insertAdjacentHTML("beforebegin", html);

        document.getElementById("load-svg");
        document.getElementById("load-svg-input").addEventListener("change", loadSvg, false);
    };
})();