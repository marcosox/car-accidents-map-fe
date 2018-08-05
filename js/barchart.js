// current highlight selection
let currentSelection = {
	field: "",
	value: ""
};

const chartHeight = 320;
const leftPadding = 48;

let resultCache = {
	field: "",
	data: [],
	sortDescending: true
};

let highlightCache = {
	highlightField: "",
	highlightValue: "",
	field: "",
	data: [],
	sortDescending: true
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

	let xLabelsPadding = getMaxTextWidth(dataset.map(d => {
		return d['_id']
	}));

	// select chart and clear it
	let svg = d3.select("#chart").attr("viewBox", "0 0 100vw 100vh")
		.attr("max-height", "calc(" + (chartHeight + xLabelsPadding) + " + 2em)")
		.attr("height", "calc(" + (chartHeight + xLabelsPadding) + " + 2em)")
		.html("");

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
	svg.append("g")
		.attr("class", "axis")
		.call(xAxis)
		.attr("transform", "translate(" + leftPadding + "," + (chartHeight) + ")")
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.75em")	//-.75em
		.attr("dy", ".15em")	//.15em
		.attr("y", "0")	// non ne vuole sapere
		.attr("transform", "rotate(-90)");

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
			return Math.max(chartHeight - 1 - yScale(d['count']), 0);	// -1 is the line stroke width
		})
		.append("svg:title")
		.text(function (d) {
			return d['_id'] + ": " + d['count'];
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
 * @param dataset risultati
 * @param normalized booleano, true se i dati devono essere normalizzati
 */
function drawHighlightChart(dataset, normalized) {

	let xLabelsPadding = getMaxTextWidth(dataset.map(d => {
		return d['_id']
	}));

	// select chart and clear it
	let svg = d3.select("#chart2").attr("viewBox", "0 0 100vw 100vh")
		.attr("max-height", "calc(" + (chartHeight + xLabelsPadding) + " + 2em)")
		.attr("height", "calc(" + (chartHeight + xLabelsPadding) + " + 2em)")
		.html("");

	$("#highlight-div").show();	// show the chart

	let layers = d3.layout.stack();
	if (normalized) {
		layers = layers.offset('expand');
	}
	layers = layers(["count", "highlight"].map(
		function (valueType) {
			return dataset.map(function (d) {
				return {
					id: d['_id'],
					y: +d[valueType]
				};
			});
		}));

	let xScale = d3.scale
		.ordinal()
		.rangeRoundBands([leftPadding, $("#chart2").width() - leftPadding], .1, .5)
		.domain(layers[0].map(function (d) {
			return d['id'];	// map x axis to id field of first layer (same labels)
		}));
	let xAxis = d3.svg.axis()
		.scale(xScale)
		.orient("bottom");

	let yScale = d3.scale
		.linear()
		.range([chartHeight, 1])
		.domain([0, d3.max(layers[layers.length - 1], function (d) {
			return d.y0 + d.y;	// d.y0 + d.y = total count
		})]);
	let yAxis = d3.svg.axis()
		.scale(yScale)
		.orient("left");

	// asse x
	svg.append("g")
		.attr("class", "chart-axis")
		.call(xAxis)
		.attr("transform", "translate(" + leftPadding + "," + (chartHeight) + ")")
		.selectAll("text")
		.style("text-anchor", "end")
		.attr("dx", "-.7em")	//-.7em
		.attr("dy", ".15em")	//.15em
		.attr("y", "0")	// non ne vuole sapere
		.attr("transform", "rotate(-90)");

	// asse y
	svg.append("g")
		.attr("class", "chart-axis")
		.call(yAxis)
		.attr("transform", "translate(" + (2 * leftPadding) + ",0)")	// don't know why times 2 is exactly right
		.append("text")
		.attr("x", "" + (-leftPadding))
		.attr("y", chartHeight + 24)	// 24 is about 1em, cannot use css calc() here
		.text("Count");

	// base color
	svg.append("g")
		.selectAll(".base-bar")
		.data(layers[0])
		.enter()
		.append("rect")
		.attr("class", "base-bar")
		.style("fill", "steelblue")
		.style("stroke", d3.rgb("steelblue").darker())
		.attr("x", function (d) {
			return xScale(d['id']) + leftPadding; // posizione barre x: xScale(d.id)
		})
		.attr("width", xScale.rangeBand())
		.attr("y", function (d) {
			return yScale(d.y);
		})
		.attr("height", function (d) {
			return Math.max(chartHeight - 1 - yScale(d.y), 0);	// -1 is the line stroke width
		})
		.append("svg:title")
		.text(function (d) {
			return d['id'] + ": " + d.y;
		});

	// highlight color
	svg
		.selectAll(".highlight-bar")
		.data(layers[1])
		.enter()
		.append("rect")
		.attr("class", "highlight-bar")
		.style("fill", "red")
		.style("stroke", d3.rgb("red").darker())
		.attr("x", function (d) {
			return xScale(d['id']) + leftPadding; // posizione barre x: xScale(d.id)
		})
		.attr("width", xScale.rangeBand())
		.attr("y", function (d) {
			return yScale(d.y0 + d.y);
		})
		.attr("height", function (d) {
			return Math.max(chartHeight - 1 - yScale(d.y), 0);	// -1 is the line stroke width
		})
		.append("svg:title")
		.text(function (d) {
			return d['id'] + " (highlight): " + d.y;
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
	let normalized = $("#normalizeHighlight")[0].checked;

	if (fieldName !== "") {
		if (fieldName === "ora" && spinner.value > 24) {
			spinner.value = 24;
			limit = 24;
		}
		if (fieldName === "mese" && spinner.value > 12) {
			spinner.value = 12;
			limit = 12;
		}
		if (fieldName === "giorno" && spinner.value > 31) {
			spinner.value = 31;
			limit = 31;
		}
		getCountWithHighlight(fieldName, currentSelection.field, currentSelection.value, limit, sortDescending, normalized);
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
function getCountWithHighlight(field, highlightField, highlightValue, limit, sortDescending, normalized) {
	function sortFunction(a, b) {
		let result =
			((a['count'] + a['highlight']) * 10)
			- ((b['count'] + b['highlight']) * 10);
		if (result === 0) {
			result = a['highlight'] - b['highlight'];
		}
		if (sortDescending === true) {
			result = result * -1;
		}
		return result;
	}

	if (field === highlightCache.field
		&& highlightCache.highlightField === currentSelection.field
		&& highlightCache.highlightValue === currentSelection.value
		&& sortDescending === highlightCache.sortDescending
		&& limit <= highlightCache.data.length) {
		drawHighlightChart(highlightCache.data.sort(sortFunction).slice(0, limit), normalized);
	} else {
		$.ajax({
			type: 'GET',
			url: config.backendUrl + "/GetCountWithHighlight?field=" + field
				+ "&highlight-field=" + highlightField
				+ "&highlight-value=" + highlightValue
				+ "&sort=" + (sortDescending ? "desc" : "asc")
				+ "&limit=" + limit,
			dataType: 'json',
			success: function (result) {
				highlightCache.field = field;
				highlightCache.highlightField = currentSelection.field;
				highlightCache.highlightValue = currentSelection.value;
				highlightCache.data = result;
				highlightCache.sortDescending = sortDescending;
				drawHighlightChart(result.sort(sortFunction), normalized);
				d3.select("#highlight-label")
					.html("evidenziando gli incidenti in cui <strong>" + highlightField + " = " + highlightValue + "</strong>");
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