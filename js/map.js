let fillColors = [
	"#ff0000",
	"#ff579D",
	"#ffCCA9",
	"#ffA37A",
	"#CCA95B",
	"#AA0000",
	"#ff9235",
	"#AA00C3",
	"#ff4A1B",
	"#BB4A1B",
	"#33FF5F",
	"#11FF98",
	"#9F3644",
	"#BB969C",
	"#0037EB"
];
let polygonArray = [];
let municipi = [];
let infoWindow = [];
let scaleAnno = d3.scale.linear().domain([0, 1]).range([.1, .9]);
let scaleMese = d3.scale.linear().domain([0, 1]).range([.1, .7]);
let scaleGiorno = d3.scale.linear().domain([0, 1]).range([.1, .5]);

/**
 * chiude tutte le infowindows aperte
 */
function closeAllInfoWindows() {
	for (let i = 0; i < infoWindow.length; i++) {
		infoWindow[i].close(); // chiude le infowindow
	}
}

/**
 * pulisce la mappa dai poligoni
 */
function clearMap() {
	closeAllInfoWindows();
	for (let i = 0; i < polygonArray.length; i++) {
		polygonArray[i].setMap(null);
	}
	polygonArray = [];

}

/**
 * resetta i conteggi degli incidenti
 */
function resetValues() {
	for (let i = 0; i < municipi.length; i++) {
		municipi[i]['incidenti'] = 0;
		municipi[i]['totale'] = 0;
	}
}

/**
 * crea le infowindow
 */
function createClickablePoly(poly, html, map) {
	const infowindow = new google.maps.InfoWindow();

	const contentString = html;
	google.maps.event.addListener(poly, 'click', function (event) {
		infowindow.setContent(contentString);
		if (event) {
			point = event.latLng;
		}
		infowindow.setPosition(point);
		infowindow.open(map);
		infoWindow.push(infowindow);
	});
}

/**
 * carica la mappa
 */
function loadMap() {
	let roma;

	const mapOptions = {
		zoom: 10,
		center: roma
	};

	map1 = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	const geocoder = new google.maps.Geocoder();

	geocoder.geocode({
		'address': "roma"
	}, function (results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			roma = results[0].geometry.location;
			map1.setCenter(roma);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});

}

function loadMunicipi() {

	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/Municipi",
		dataType: 'json',
		success: function (result) {
			result.sort(function (a, b) {
				return (a.numero - b.numero);
			});
			municipi = result;
			getAccidents(); // mostra gli incidenti subito
		},
		error: function (result) {
			console.log("Error retrieving municipi");
			console.log(result);
		},
		complete: function () {
		}
	});
}

/**
 * carica lo script
 */
function loadScript() {

	if (document.getElementById("google") != null || document.getElementById("google") !== undefined) {
		// se google gia' esiste...
		loadMap(); // carica mappa
		loadMunicipi(); // carica municipi
	} else { // altrimenti crea lo script
		// alert("script non trovato, lo creo");
		const script = document.createElement('script'); // e' possibile creare lo script nel container?
		script.id = "google";
		script.type = 'text/javascript';
		script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&' + 'callback=loadMap';
		document.body.appendChild(script);
		loadMunicipi();
	}
}

/**
 * disegna i municipi cliccabili
 *
 * @param municipio
 */
function drawPoli(municipio, cont, tipo) {

	let vertici = [];
	let bound1 = new google.maps.LatLngBounds();

	const zone = municipio.coord.split("-");

	for (let i = 0; i < zone.length; i++) {
		if (zone[i] != null && zone[i].length > 0) {

			const cordinate = zone[i].trim().split(",");

			const poi = new google.maps.LatLng(cordinate[1], cordinate[0]);
			vertici.push(poi);
			bound1.extend(poi);

		}
	}

	const inc = Number(municipio['incidenti']) / Number(municipio['totale']);

	let op;

	if (tipo === 1)
		op = scaleAnno(inc * 10).toFixed(1);
	else if (tipo === 2)
		op = scaleMese(inc * 10).toFixed(1);
	else if (tipo === 3)
		op = scaleGiorno(inc * 10).toFixed(1);

	const n = municipio['incidenti'];
	const tot = municipio['totale'];
	const color = fillColors[8];

	let poligono1 = new google.maps.Polygon({
		paths: vertici,
		strokeColor: color,
		strokeOpacity: op,
		strokeWeight: 2,
		fillColor: color,
		fillOpacity: op
	});

	poligono1.setMap(map1);
	polygonArray.push(poligono1);
	let tooltip = '<div id="tooltip" style="width:100px">' + '<strong>\t' + municipio.name + '</strong>' + '<p>'
		+ (municipio.description !== undefined ? municipio.description : "")
		+ '</p>' + '<p>numero incidenti: ' + n + ' su ' + tot + '</p>' + '</div>';

	createClickablePoly(poligono1, tooltip, map1);
	// map1.fitBounds(bound1);
}

/**
 * Carica e mostra gli incidenti
 */
function getAccidents() {

	clearMap();
	const anno = $("#anno").val();
	const mese = $("#mese").val();
	const giorno = $("#giorno").val();
	const ora = $("#ora").val();
	let tipo = 1;

	if (anno.length > 0) {
		if (mese.length > 0 && giorno.length === 0)
			tipo = 2;
		else if (mese.length > 0 && giorno.length > 0)
			tipo = 3;
	} else if (anno.length === 0) {
		if (mese.length > 0 && giorno.length > 0)
			tipo = 2;
	}

	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetIncidentiMunicipi?anno=" + anno + "&mese=" + mese + "&giorno=" + giorno + "&ora=" + ora,
		success: function (result) {
			console.log("result", result);
			result.sort(function (a, b) {
				return (a['municipio'] - b['municipio']);
			});
			let alertBox = $("#districts-map-alert");
			if (result.length === 0) {
				alertBox.text("Nessun incidente nel periodo selezionato");
				alertBox.show();
				clearMap();
				resetValues();
				return;
			} else{
				alertBox.hide();
			}
			resetValues();
			const zonaMappa = municipi;

			for (let j = 0; j < result.length; j++) { // per ogni mun riportato
				for (let i = 0; i < zonaMappa.length; i++) { // cicli su tutte le zone
					let numeroMunicipio = result[j]['municipio'];
					if (numeroMunicipio === zonaMappa[i]['numero']) { // quando trovi una zona afferente a lui
						zonaMappa[i]['incidenti'] = result[j]["incidenti"]; // copi
						zonaMappa[i]['totale'] = result[j]["totale"];
					}
				}
			}


			console.log(zonaMappa);
			console.log(municipi);
			clearMap();


			for (let i = 0; i < zonaMappa.length; i++) {
				if (zonaMappa[i]['incidenti'] !== 0) {
					drawPoli(zonaMappa[i], i, tipo);
				}
			}
			// google.maps.event.trigger(map1, 'resize');
		},
		error: function (result) {
			console.log("Error retrieving data");
			console.error("Error retrieving data", result);
		},
		complete: function () {
		}
	});
}
