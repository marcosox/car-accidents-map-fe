// current highlight selection
let currentSelection = {
	field: "",
	value: ""
};

const margin = {
	top: 20,
	// right: 20,
	bottom: 20,
	left: 20
};
const width = 1100;// - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const chartHeight = 480;
const leftPadding = 48;

// let xScale = d3.scale.ordinal().rangeRoundBands([leftPadding, width - leftPadding], .1, .5);	// 0.1 colonne tra uno e l'altro, 0.5 colonne vuote agli estremi
// let yScale = d3.scale.linear().range([chartHeight - xLabelsPadding, 1]);	// 1 is the axis line stroke width

// let xAxis = d3.svg.axis().scale(xScale).orient("bottom");
// let yAxis = d3.svg.axis().scale(yScale).orient("left");

let svg = d3.select("#chart")
	.append("g")
	.attr("id", "maing");

let resultCache = {
	field: "",
	data: []
};

let highlightCache = {
	field: "",
	data: []
};

/**
 * helper function
 */
function getTextWidth(text, fontSize, fontFace) {
	if (fontSize === undefined) {
		fontSize = 16;
	}
	if (fontFace === undefined) {
		fontFace = "Arial";
	}
	let canvas = document.createElement('canvas');
	let context = canvas.getContext('2d');
	context.font = fontSize + 'px ' + fontFace;
	let result = context.measureText(text).width;
	// console.log(result);
	return result;
}

/**
 * helper function
 */
function getMaxTextWidth(list) {
	let max = 0;
	for (let i = 0; i < list.length; i++) {
		max = Math.max(getTextWidth(list[i]), max);
	}
	return max;
}

/**
 * Disegna sulla chart i dati passati con il parametro result
 */
function drawChart(dataset) {

	// select chart and clear it
	let svg = d3.select("#chart");
	svg.html("");

	let xLabelsPadding = getMaxTextWidth(dataset.map(d => {
		return d['_id']
	}));

	let xScale = d3.scale
		.ordinal()
		.rangeRoundBands([leftPadding, $("#chart").width() - leftPadding], .1, .5)	// 0.1 colonne tra uno e l'altro, 0.5 colonne vuote agli estremi
		.domain(dataset.map(function (d) {
			return d['_id'];					// assegna il dominio x alle label
		}));
	let xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom");

	let yScale = d3.scale
		.linear()
		.range([chartHeight, 1])	// 1 is the axis line stroke width
		.domain([0, d3.max(dataset,
			function (d) {
				return d['count'];	// dominio y ai valori count
			}
		)]);
	let yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");

	// asse x
	svg.attr("viewBox", "0 0 100vw 100vh")
		.attr("max-height", "calc(" + (chartHeight + xLabelsPadding) + " + 2em)")
		.attr("height", "calc(" + (chartHeight + xLabelsPadding) + " + 2em)");

	svg.append("g")
		.attr("class", "axis")
		.attr("id", "x_axis")
		.attr("transform", "translate(" + leftPadding + "," + (chartHeight) + ")")
		.call(xAxis)
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.7em")	//-.7em
		.attr("dy", ".15em")	//.15em
		.attr("y", "0")	// non ne vuole sapere
		.attr("transform", "rotate(-90)")
		.append("svg:title")
		.text(function (d) {
			return d;
		});

	// asse y
	svg.append("g")
		.attr("class", "axis")
		.call(yAxis)
		.attr("transform", "translate(" + (2 * leftPadding) + ",0)")	// don't know why times 2 is exactly right
		.append("text")
		.attr("x", "" + (-leftPadding))
		.attr("y", chartHeight + 24)	// 24 is about 1em, cannot use css calc() here
		.text("Count");

	// barre sull'asse x
	svg.selectAll(".bar")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("class", "bar")
		.attr("x", function (d) {
			return xScale(d['_id']) + leftPadding; // posizione barre x: xScale(d.id)
		})
		.attr("width", xScale.rangeBand())
		.attr("y", function (d) {
			return yScale(d['count']);
		})
		.attr("height", function (d) {
			return Math.max(chartHeight - 1 - yScale(d.count), 0);	// -1 is the line stroke width
		})
		.append("svg:title")
		.text(function (d) {
			return d['_id'] + ": " + d.count;
		});

	// listener per l'highlight cliccando su una barra
	d3.selectAll(".bar").on("click", highLightItem);
}

/**
 * Funzione che gestisce la selezione di una colonna per l'highlight
 * @param d i dati della colonna: _id e value
 * @param i l'indice della colonna nella selezione
 */
function highLightItem(d, i) {
	if (this.style.fill !== "") {	// se clicchi su una gia' scelta, viene cancellata la selezione
		this.style.fill = "";
		currentSelection.field = "";
		currentSelection.value = "";
		d3.select("#highlight-div")[0][0].style.display = "none";	// nasconde la seconda chart
	} else {	//altrimenti evidenzia la barra scelta
		d3.selectAll(".bar")[0].forEach(function (d) {
			d.style.fill = ""
		});	// resetta il colore di tutte le barre
		this.style.fill = "red";	// evidenzia quella selezionata di rosso
		// salva le variabili necessarie
		currentSelection.field = d3.select("#menu")[0][0].value;
		currentSelection.value = d['_id'];
		refreshHighlightChart();
	}
}

/**
 * disegna sulla seconda chart gli highlights
 * @param result risultati
 * @param normalized booleano, true se i dati devono essere normalizzati
 */
function drawHighlightChart(result) {
	let normalized = $("#normalizeHighlight")[0].checked;
	// create canvas
	d3.select("#chart2").html("");
	// d3.select("#highlight-div")[0][0].style.display = "";		// mostra la seconda chart
	$("#highlight-div").show();
	// let width2 = 960;
	// let height2 = 600;
	// let margin = [20, 50, 30, 20];

	let x = d3.scale.ordinal().rangeRoundBands([0, width /*- margin.right*/ - margin.left]);	// originale
	let y = d3.scale.linear().range([0, height - margin.top - margin.bottom]);
	let z = d3.scale.ordinal().range(["lightblue", "red"]);

	let chart2 = d3.select("#chart2")
	// .attr("width", width)
	// .attr("height", height)
		.append("svg:g")
		.attr("id", "stackg")
		.attr("transform", "translate(" + margin.top + "," + (height - margin.bottom) + ")");

	// Transpose the data into layers by cause.
	let layers = d3.layout.stack();

	for (let i = 0; i < result.length; i++) {
		result[i]['count'] -= result[i]['highlight'];
	}

	let func = function (valueType) {
		return result.map(function (d) {
			return {
				x: d['_id'],
				y: +d[valueType]
			};
		});
	};

	if (normalized) {
		// Transpose the data into layers by cause.
		layers = layers.offset('expand')(["count", "highlight"].map(func));
	} else {
		layers = layers(["count", "highlight"].map(func));
	}

	// Compute the x-domain (by id) and y-domain (by top).
	x.domain(layers[0].map(function (d) {
		return d.x;
	}));
	y.domain([0, d3.max(layers[layers.length - 1], function (d) {
		return d.y0 + d.y;
	})]);

	// Add a group for each cause.
	let cause = chart2.selectAll("g.cause")
		.data(layers)
		.enter().append("svg:g")
		.attr("class", "cause")
		.style("fill", function (d, i) {
			return z(i);
		})
		.style("stroke", function (d, i) {
			return d3.rgb(z(i)).darker();
		});

	// Add a rect for each date.
	cause.selectAll("rect")
		.data(Object)
		.enter()
		.append("svg:rect")
		.attr("x", function (d) {
			return x(d.x);
		})
		.attr("y", function (d) {
			return -y(d.y0) - y(d.y);
		})
		.attr("height", function (d) {
			return y(d.y);
		})
		.attr("width", x.rangeBand())
		.append("svg:title")
		.text(function (d) {
			return d.x + ": " + d.y0 + ": " + d.y;
		});

	// Add a label per date.
	chart2.selectAll(".rule text")
		.data(x.domain())
		.enter()
		.append("svg:text")
		.attr("x", "-1")
		.attr("dx", "0")
		.attr("y", function (d) {
			return -x(d) / 1.95;
		})
		.attr("dy", function (d) {
			return -x(d) / 1.95;
		})
		.attr("transform", "rotate(90)")
		.text(function (d) {
			return d;
		})
		.append("svg:title")
		.text(function (d) {
			return d;
		});

	// Add y-axis rules.
	let rule = chart2.selectAll("g.rule")
		.data(y.ticks(5))
		.enter().append("svg:g")
		.attr("class", "rule")
		.attr("transform", function (d) {
			return "translate(0," + -y(d) + ")";
		});

	rule.append("svg:line")
		.attr("x2", width /*- margin.right*/ - margin.top)
		.style("stroke", function (d) {
			return d ? "#fff" : "#000";
		})
		.style("stroke-opacity", function (d) {
			return d ? .7 : null;
		});

	rule.append("svg:text")
		.style("text-anchor", "end")
		.attr("x", width - margin.top)
		.attr("dy", ".35em")
		.text(function (d) {
			return d;
		});
}

/**
 * chiamata quando scegli un dato da visualizzare, chiama a sua volta la richiesta ajax
 */
function refreshChart() {

	let selection = d3.select("#menu")[0][0].value;
	let spinner = $("#limit")[0];
	let limit = parseInt(spinner.value);	// prendi il nome del campo su cui aggregare
	let sortDescending = $("#sort1")[0].checked;

	if (selection === "ora") {
		spinner.value = 24;
		limit = 24;
	} else if (selection === "mese") {
		spinner.value = 12;
		limit = 12;
	} else if (selection === "giorno") {
		spinner.value = 31;
		limit = 31;
	} else if (limit < 1) {
		limit = 1;
	}
	getCount(selection, limit, sortDescending);
}

/**
 * refresh la seconda chart
 */
function refreshHighlightChart() {

	let fieldName = $("#menu2")[0].value;

	let spinner = $("#limit2")[0];	// prendi il nome del campo su cui aggregare
	let limit = parseInt(spinner.value);	// prendi il nome del campo su cui aggregare
	let sortDescending = $("#sort2")[0].checked;
	if (fieldName !== "") {
		if (fieldName === "ora") {
			spinner.value = 24;
			limit = 24;
		}
		if (fieldName === "mese") {
			spinner.value = 12;
			limit = 12;
		}
		if (fieldName === "giorno") {
			spinner.value = 31;
			limit = 31;
		}
		d3.select("#highlight-label").html("Visualizzo <strong>" + fieldName + "</strong> evidenziando gli incidenti in cui <strong>" + currentSelection.field + "=" + currentSelection.value + "</strong>");
		getCountWithHighlight(fieldName, limit, sortDescending);
	}
}

/**
 * legge i dati dal database e chiama la funzione di popolamento della chart passandogli il risultato.
 */
function getCount(field, limit, sortDescending) {
	let sortFunction = function (a, b) {
		let result = a.count - b.count;
		if (sortDescending === true) {
			result = result * -1;
		}
		return result;
	};

	if (field === resultCache.field && limit <= resultCache.data.length) {
		drawChart(resultCache.data.sort(sortFunction).slice(0, limit));
	} else {
		$.ajax({
			type: 'GET',
			url: config.backendUrl + "/GetCount?field=" + field + "&limit=" + limit,
			dataType: 'json',
			success: function (result) {
				resultCache.field = field;
				resultCache.data = result;
				drawChart(result.slice(0, limit).sort(sortFunction));
			},
			error: function (result) {
				alert("Error retrieving data");
				console.error("Error retrieving data", result);
			}
		});
	}
}

/**
 * legge i dati dal database e chiama la funzione di popolamento della chart passandogli il risultato.
 */
function getCountWithHighlight(field, limit, sortDescending) {
	let sortFunction = function (a, b) {
		let result = a.count - b.count;
		if (sortDescending === true) {
			result = result * -1;
		}
		return result;
	};

	if (field === highlightCache.field && limit <= highlightCache.data.length) {
		drawHighlightChart(highlightCache.data.sort(sortFunction).slice(0, limit));
	} else {
		// highlightCache
		$.ajax({
			type: 'GET',
			url: config.backendUrl + "/GetCountWithHighlight?field=" + field + "&limit=" + limit + "&highlight-field=" + currentSelection.field + "&highlight-value=" + currentSelection.value,
			dataType: 'json',
			success: function (result) {
				highlightCache.field = field;
				highlightCache.data = result;
				drawHighlightChart(result.sort(sortFunction).slice(0, limit));
			},
			error: function (result) {
				alert("Error retrieving data");
				console.error("Error retrieving data", result);
			}
		});
	}
}

$(document).ready(function () {
	refreshChart()
});