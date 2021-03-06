let districtsData = {};
let districtsMap;
let districtsMapLayer;
let districtsPopup;

/**
 * pulisce la mappa dai poligoni
 */
function clearDistrictsMap() {
	districtsMapLayer.getSource().clear();
}

/**
 * resetta i conteggi degli incidenti
 */
function resetDistrictsValues() {
	for (let i = 0; i < districtsData.length; i++) {
		districtsData[i]['incidenti'] = 0;
		districtsData[i]['totale'] = 0;
	}
}

/**
 * carica la mappa
 */
function initDistrictsMap() {

	districtsMapLayer = new ol.layer.Vector({
		source: new ol.source.Vector()
	});

	districtsMap = new ol.Map({
		target: 'districts-map',
		layers: [	// feature layers first!
			new ol.layer.Tile({
				source: new ol.source.OSM()
			}), districtsMapLayer
		],
		view: new ol.View({
			center: [1387845.90968452, 5143223.930010475],	// Rome
			zoom: 10
		})
	});
	districtsMap.getControls().push(new ol.control.FullScreen());

	let closer = $("#districts-popup-closer")[0];
	closer.onclick = function () {
		districtsPopup.setPosition(undefined);
		closer.blur();
		return false;
	};

	districtsPopup = new ol.Overlay({
		id: "districtsPopup",
		element: $("#districts-popup")[0],
		autoPan: true,
		autoPanAnimation: {
			duration: 250
		}
	});
	districtsMap.addOverlay(districtsPopup);

	let select = new ol.interaction.Select({
		condition: ol.events.condition.click
	});
	districtsMap.addInteraction(select);
	select.on('select', function (evt) {
		if (evt.selected.length > 0) {
			const feature = evt.selected[0];
			$("#districts-popup-content")[0].innerHTML = feature.get("popupContent");
			districtsPopup.setPosition(evt.mapBrowserEvent.coordinate);
		} else {
			districtsPopup.setPosition(undefined);
		}
	});
	$(".loading").hide();
}

/**
 * Retrieves districts coordinates from backend
 */
function getDistricts() {
	showSpinner();
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/Municipi",
		dataType: 'json',
		success: function (result) {
			result.forEach(function (district) {
				districtsData["" + district['numero']] = district;
			});
			getDistrictsAccidents(); // mostra gli incidenti subito
		},
		error: function (result) {
			showDistrictsErrorBox("Error retrieving districts");
			console.error(result);
		},
		complete: function (result) {
			removeSpinner();
		}
	});
}

/**
 * disegna i municipi cliccabili
 *
 * @param district
 * @param maximumCount maximum number of accidents in a district for the selected timeframe
 */
function drawDistrict(district, maximumCount) {

	// convert coordinates
	const coordinates = district['coord'].map(function convert(coordinate) {
		return ol.proj.fromLonLat(coordinate);
	});

	// close the polygon if necessary
	const last = coordinates[coordinates.length - 1];
	if (last[0] !== coordinates[0][0] || last[1] !== coordinates[0][1]) {
		coordinates.push(coordinates[0]);
	}

	let line = new ol.Feature(new ol.geom.Polygon([coordinates]));
	line.setId("district_" + district['numero']);
	line.set("popupContent", '<strong>' + district.name + '</strong>'
		+ '<p>'
		+ (district.description !== undefined ? district.description : "")
		+ '<br>'
		+ district['incidenti'] + ' incidenti su ' + district['totale'] + '</p>');

	const alpha = (district['incidenti'] * 1.0) / (maximumCount * 1.0);

	line.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#0000FF',
			width: 1
		}),
		fill: new ol.style.Fill({
			color: 'rgba(0,0,255,' + alpha + ')'
		})
	}));
	districtsMapLayer.getSource().addFeature(line);
}

function showDistrictsErrorBox(msg) {
	let alertBox = $("#districts-map-alert");
	alertBox.text(msg);
	alertBox.show();
}

function clearDistrictsErrorBox() {
	$("#districts-map-alert").hide();
}

/**
 * Carica e mostra gli incidenti
 */
function getDistrictsAccidents() {
	showSpinner();
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetIncidentiMunicipi?"
			+ "anno=" + $("#districts-year").val()
			+ "&mese=" + $("#districts-month").val()
			+ "&giorno=" + $("#districts-day").val()
			+ "&ora=" + $("#districts-hour").val(),
		success: function (result) {
			result.sort(function (a, b) {
				return (a['municipio'] - b['municipio']);
			});

			resetDistrictsValues();
			districtsPopup.setPosition(undefined);
			clearDistrictsMap();

			if (result.length === 0) {
				showDistrictsErrorBox("Nessun incidente nel periodo selezionato.");
				return;
			}
			clearDistrictsErrorBox();

			// merge ajax result with district objects
			let max = 0;	// maximum number of accidents in a district for the selected timeframe
			for (let i = 0; i < result.length; i++) { // aggiungi conteggi
				const districtAccidents = result[i];
				if (districtsData["" + districtAccidents['municipio']] !== undefined) {
					districtsData["" + districtAccidents['municipio']]['incidenti'] = districtAccidents["incidenti"];
					districtsData["" + districtAccidents['municipio']]['totale'] = districtAccidents["totale"];
					max = Math.max(max, districtAccidents["incidenti"]);
				} else {
					console.warn("skipping data for missing district. coordinates are missing for district " + districtAccidents['municipio']);
				}
			}

			// draw district polygons
			result.forEach(function (district) {
				const districtNumber = district['municipio'];
				if (districtsData[districtNumber] !== undefined && districtsData[districtNumber]['incidenti'] !== 0) {
					drawDistrict(districtsData[districtNumber], max);
				}
			});
			removeSpinner();
		},
		error: function (result) {
			showDistrictsErrorBox("Error retrieving data");
			console.error("Error retrieving data", result);
			removeSpinner();
		},
	});
}
