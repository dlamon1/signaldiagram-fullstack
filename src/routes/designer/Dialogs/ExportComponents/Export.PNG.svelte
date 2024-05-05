<script lang="ts">
	import { tick } from 'svelte';
	import pkg from 'file-saver';
	import { getFontEmbedCSS } from 'html-to-image';
	const { saveAs } = pkg;

	import * as d3 from 'd3';

	const MIRO_MAX_MP = 30000000


	import { mode, screens, currentScreenIndex } from '$lib/store.designer';

	const download = async () => {
		$screens.forEach((s) => {
			s.panels.deSelect();
			s.signalLines.deSelect();
			s.snapPoints.deSelect();
		});
		$mode = 'select';

		await tick();

		let w = $screens[$currentScreenIndex].width * $screens[$currentScreenIndex].columns;
		let h = $screens[$currentScreenIndex].height * $screens[$currentScreenIndex].rows;

		let svg = d3.select('#svg');

		let p = svg.clone(true);

		p.attr('width', w).attr('height', h).attr('class', '');

		p.select('g').attr('class', '').attr('transform', '');

		getFontEmbedCSS(p.node()).then((fontCss) => {
			var svgString = getSVGString(p.node());

			svgString2Image(svgString, 'png', save); // passes Blob and filesize String to the callback

			function save(dataBlob, filesize) {
				saveAs(dataBlob, $screens[$currentScreenIndex].name + '.png'); // FileSaver.js function
			}

			// Below are the functions that handle actual exporting:
			// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
			function getSVGString(svgNode) {
				svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
				var cssStyleText = getCSSStyles(svgNode);
				// console.log(cssStyleText);
				appendCSS(cssStyleText, svgNode);
				appendCSS(fontCss, svgNode);

				var serializer = new XMLSerializer();
				var svgString = serializer.serializeToString(svgNode);
				svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
				svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

				return svgString;

				function getCSSStyles(parentElement) {
					var selectorTextArr = [];

					// Add Parent element Id and Classes to the list
					selectorTextArr.push('#' + parentElement.id);
					for (var c = 0; c < parentElement.classList.length; c++)
						if (!contains('.' + parentElement.classList[c], selectorTextArr))
							selectorTextArr.push('.' + parentElement.classList[c]);

					// Add Children element Ids and Classes to the list
					var nodes = parentElement.getElementsByTagName('*');
					for (var i = 0; i < nodes.length; i++) {
						var id = nodes[i].id;
						if (!contains('#' + id, selectorTextArr)) selectorTextArr.push('#' + id);

						var classes = nodes[i].classList;
						for (var c = 0; c < classes.length; c++)
							if (!contains('.' + classes[c], selectorTextArr))
								selectorTextArr.push('.' + classes[c]);
					}

					// Extract CSS Rules
					var extractedCSSText = '';
					for (var i = 0; i < document.styleSheets.length; i++) {
						var s = document.styleSheets[i];

						try {
							if (!s.cssRules) continue;
						} catch (e) {
							if (e.name !== 'SecurityError') throw e; // for Firefox
							continue;
						}

						var cssRules = s.cssRules;
						for (var r = 0; r < cssRules.length; r++) {
							if (contains(cssRules[r].cssText, selectorTextArr))
								extractedCSSText += cssRules[r].cssText;
						}
					}

					return extractedCSSText;

					function contains(str, arr) {
						return arr.indexOf(str) === -1 ? false : true;
					}
				}

				function appendCSS(cssText, element) {
					// console.log(cssText);
					var styleElement = document.createElement('style');
					styleElement.setAttribute('type', 'text/css');
					styleElement.innerHTML = cssText;
					var refNode = element.hasChildNodes() ? element.children[0] : null;
					element.insertBefore(styleElement, refNode);
				}
			}


			function setMaxDimensions(canvas: HTMLCanvasElement, width: number, height: number) {
  let scaleRatio = 1;
  let imageTotalPixels = width * height;

  if (imageTotalPixels > MIRO_MAX_MP) {
    scaleRatio = Math.sqrt(MIRO_MAX_MP / imageTotalPixels);
  }

  canvas.width = width * scaleRatio;
  canvas.height = height * scaleRatio;

  return scaleRatio;
}

		
		
		function svgString2Image(svgString, format, callback) {
			var format = format ? format : 'png';

			var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

			let canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');

			// Set the desired resolution multiplier (e.g., 2x, 3x, etc.)
			const resolutionMultiplier = 2;

			let scaleRatio = setMaxDimensions(canvas, w * resolutionMultiplier, h * resolutionMultiplier);

			var image = new Image();

			image.onload = function () {
				// Clear the canvas
				context.clearRect(0, 0, canvas.width, canvas.height);

				// Scale the canvas context to match the resolution multiplier and scale ratio
				context.scale(resolutionMultiplier * scaleRatio, resolutionMultiplier * scaleRatio);

				// Draw the image on the scaled canvas context
				context.drawImage(image, 0, 0, w, h);

				canvas.toBlob(function (blob) {
				var filesize = Math.round(blob.size / 1024) + ' KB';
				if (callback) callback(blob, filesize);
				});
			};

			image.src = imgsrc;
			}
		});
	};
</script>

<svg id="print" width="0" height="0" />

<button on:click={download} class="download" disabled={typeof $currentScreenIndex != 'number'}>
	Download .PNG
</button>

<style>
	button {
		height: 40px;
		width: 175px;
		transition:
			background-color 0.1s,
			color 0.1s;
		font-size: 1em;
		font-weight: 700;
	}
	button:hover {
		background-color: rgb(79, 79, 79);
		color: rgb(255, 255, 255);
	}

	.download {
		margin-top: 10px;
		margin-bottom: 0px;
	}
</style>
