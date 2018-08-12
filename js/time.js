/**
 * disegna il calendario annuale
 */
function refreshCalendar(result) {

	let cellSize = 19;
	let rowHeight = cellSize * 7;

	// let percent = d3.format(".1%");
	let format = d3.time.format("%Y-%m-%d");

	let massimo = Math.max.apply(Math, result.map(function (o) {
		return o.count;
	}));

	const colorQuantization = 100;	// color range quantization. tweak as you like, up to 100
	let color = d3.scale.quantize()
		.domain([0, massimo])		// dominio valori: da 0 al massimo trovato nei valori
		.range(
			d3.range(colorQuantization)
				.map(function (d) {
					return percent2color(d * (100 / colorQuantization));
				}));

	// year elements
	let div = d3.select("#calendar-div");
	div.html("");
	const rowSpacing = 5;
	let svg = div.selectAll("svg")
		.data(d3.range(2012, 2016))
		.enter()
		.append("svg")
		.attr("height", rowHeight + rowSpacing)
		.append("g")
		.attr("transform", "translate(50," + rowSpacing + ")");

	// year labels
	svg.append("text")
		.attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
		.style("text-anchor", "middle")
		.text(function (d) {
			return d;
		});

	// days
	let rect = svg.selectAll(".day")
		.data(function (d) {
			return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
		}).enter()
		.append("rect")
		.attr("class", "day")
		.attr("width", cellSize)
		.attr("height", cellSize)
		.attr("x", function (d) {
			return d3.time.weekOfYear(d) * cellSize;
		})
		.attr("y", function (d) {
			return d.getDay() * cellSize;
		})
		.datum(format);
	rect.append("title").text(function (d) {
		return d;
	});

	// months
	svg.selectAll(".month")
		.data(function (d) {
			return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
		})
		.enter()
		.append("path")
		.attr("class", "month")
		.attr("d", monthPath);

	// ********************************** mapping dati
	let data = d3.nest().key(function (d) {
		return d.data;
	}).rollup(function (d) {
		return d[0].count;
	}).map(result);

	rect.filter(
		function (d) {	// d e' la data, data[d] e' il totale
			return d in data;	// filtra in base alla data
		}
	)
		.attr("class", "day")
		.style("fill",
			function (d) {
				return color(data[d])	// colora il giorno in base al numero di incidenti
			}
		)
		.select("title").text(function (d) {
		return d + ": " + (data[d]);
	});

	function monthPath(t0) {
		let t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0), d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0),
			d1 = t1
				.getDay(), w1 = d3.time.weekOfYear(t1);
		return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize + "H" + w0 * cellSize + "V" + 7 * cellSize + "H" + w1
			* cellSize + "V" + (d1 + 1) * cellSize + "H" + (w1 + 1) * cellSize + "V" + 0 + "H" + (w0 + 1)
			* cellSize + "Z";
	}
}

/**
 * disegna la line chart
 */
function refreshTimeChart(result) {
	// Set the dimensions of the canvas / graph
	let container = $(`#timechart-div`);
	let width = Math.max(container.width(), 1100);
	let height = Math.max(container.height(), 240);
	const xAxisHeight = 30;
	const yAxisWidth = 50;
	// Parse the date / time
	let parseDate = d3.time.format("%Y-%m-%d").parse;

	// Set the ranges
	let xScale = d3.time.scale()
		.range([yAxisWidth, width]);
	let yScale = d3.scale.linear()
		.range([height, xAxisHeight]);

	// Define the axes
	let xAxis = d3.svg.axis().scale(xScale)
		.orient("bottom")
		.ticks(17);

	let yAxis = d3.svg.axis().scale(yScale)
		.orient("left")
		.ticks(5);

	// Define the line
	let valueline = d3.svg.line()
		.x(function (d) {
			return xScale(d.data);
		})
		.y(function (d) {
			return yScale(d.count);
		});

	// Adds the svg canvas
	let svg = d3.select("#timechart-div")
		.append("svg")
		.attr("width", '100%')
		.attr("height", '100%')
		.attr('viewBox', '0 0 ' + (Math.min(width, height) + xAxisHeight) + ' ' + (Math.min(width, height) + yAxisWidth))
		.attr('preserveAspectRatio', 'xMinYMax');
	// Map the data
	result.forEach(function (d) {
		d.data = parseDate(d.data);
		d.count = +d.count;
	});
	result.sort(function (a, b) {
		return a.data <= b.data ? -1 : +1;	// sort the results
	});

	// Scale the range of the data
	xScale.domain(d3.extent(result, function (d) {
		return d.data;
	}));
	yScale.domain([0, d3.max(result, function (d) {
		return d.count;
	})]);

	// Add the valueline path.
	svg.append("path")
		.style("stroke", "steelblue")	// override the css default black
		.attr("d", valueline(result));

	// Add the X Axis
	svg.append("g")
		.attr("class", "chart-axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	// Add the Y Axis
	svg.append("g")
		.attr("class", "chart-axis")
		.attr("transform", "translate(" + yAxisWidth + ",0)")
		.call(yAxis);
}

/**
 * Ottiene i totali giornalieri dal database
 */
function getTimeCounts() {
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetDailyAccidents",
		dataType: 'json',
		success: function (result) {
			refreshCalendar(result);
			refreshTimeChart(result);
		},
		error: function (result) {
			alert("Error retrieving data.");
			console.error(result);
		}
	});
}
