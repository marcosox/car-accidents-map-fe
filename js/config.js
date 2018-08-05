const config = {
	backendUrl: "http://"+window.location.hostname+":8080"
};


//
//

/**
 * Change the start and end values to reflect the hue map
 * Refernece : http://www.ncl.ucar.edu/Applications/Images/colormap_6_3_lg.png
 * Quick ref:
 *     0 – red
 *     60 – yellow
 *     120 – green
 *     180 – turquoise
 *     240 – blue
 *     300 – pink
 *     360 – red
 */
function percent2color(percent) {
	const start = 120;
	const end = 0;
	const a = percent / 100,
		b = (end - start) * a,
		c = b + start;

	// Return a CSS HSL string
	return 'hsl(' + c + ', 100%, 50%)';
}