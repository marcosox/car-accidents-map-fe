let accidentsMap;
let accidentsMapLayer;
let accidentsPopup;

function initAccidentsMap() {
	accidentsMapLayer = new ol.layer.Vector({
		source: new ol.source.Vector()
	});

	accidentsMap = new ol.Map({
		target: 'accidents-map',
		layers: [	// feature layers first!
			new ol.layer.Tile({
				source: new ol.source.OSM()
			}), accidentsMapLayer
		],
		view: new ol.View({
			center: [1387845.90968452, 5143223.930010475],	// Rome
			zoom: 10
		})
	});
	accidentsMap.getControls().push(new ol.control.FullScreen());

	let closer = $("#accidents-popup-closer")[0];
	closer.onclick = function () {
		accidentsPopup.setPosition(undefined);
		closer.blur();
		return false;
	};

	accidentsPopup = new ol.Overlay({
		id: "accidentsPopup",
		element: $("#accidents-popup")[0],
		autoPan: true,
		autoPanAnimation: {
			duration: 250
		}
	});
	accidentsMap.addOverlay(accidentsPopup);

	let select = new ol.interaction.Select({
		condition: ol.events.condition.click
	});
	accidentsMap.addInteraction(select);
	select.on('select', function (evt) {
		if (evt.selected.length > 0) {
			const feature = evt.selected[0];
			getItemDetails(feature.getId(), evt.mapBrowserEvent.coordinate);
		} else {
			accidentsPopup.setPosition(undefined);
		}
	});
	$(".loading").hide();
}

function getGeocodedAccidents() {
	showSpinner();

	const year = document.getElementById("accidents-map-year").value;
	const hour = document.getElementById("accidents-map-daytime").value;
	const district = document.getElementById("accidents-map-district").value;

	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetGeocodedAccidents?"
			+ "year=" + (year !== "all" ? year : "")
			+ "&district=" + (district !== "all" ? district : "")
			+ "&hour=" + (hour !== "all" ? hour : ""),
		dataType: 'json',
		success: function (result) {
			drawAccidentsDotsOnMap(result);
		},
		error: function (result) {
			console.log("Error retrieving accidents data", result);
		},
		complete: function () {
			removeSpinner();
		}
	});
}

function getItemDetails(accidentId, coordinates) {
	console.log("getting details for:", accidentId);
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetAccidentDetails?id=" + accidentId,
		dataType: 'json',
		success: function (result) {
			accidentsPopup.setPosition(undefined);
			if (result != null) {
				let c = result;
				let contentString =
					"<b>" + c['incidente'] + "</b>" + "<br>" +
					"Data: " + c['giorno'] + "/" + c['mese'] + "/" + c['anno'] + " " + c['ora'] + ":" + c['minuti'] +
					" - " +
					"municipio " + c['numero_gruppo'] + "<br>" +
					"Indirizzo: " + c['strada'] + "<br>" +
					"Coordinate: " + result['lat'].substr(0, 8) + ", " + result['lon'].substr(0, 8) + "<br>" +
					"Dinamica: " + c['dinamica'] + "<br>" +
					"Persone (" + c['persone'].length + "):";

				if (c['persone'].length > 0) {
					contentString += "<ul>";
					for (let i = 0; i < c['persone'].length; i++) {
						contentString += "<li>" + c['persone'][i]['sesso'] + " - " + c['persone'][i]['anno'];
					}
					contentString += "</ul>";
				}

				contentString += "Veicoli (" + c['veicoli'].length + "):";
				if (c['veicoli'].length > 0) {
					contentString += "<ul>";
					for (let i = 0; i < c['veicoli'].length; i++) {
						contentString += "<li>" + c['veicoli'][i]['brand'] + " " + (c['veicoli'][i]['model'] || "");
					}
					contentString += "</ul>";
				}
				$("#accidents-popup-content")[0].innerHTML = contentString;
				accidentsPopup.setPosition(coordinates);
			}
		},
		error: function (result) {
			console.log("Error retrieving accident details", result);
		}
	});
}

function drawAccidentsDotsOnMap(dataset) {
	const spinner = $(".loading");
	spinner.show();

	accidentsMapLayer.getSource().clear();
	accidentsPopup.setPosition(undefined);

	for (let i = 0; i < dataset.length; i++) {
		let marker = new ol.Feature(new ol.geom.Point(ol.proj.fromLonLat([+dataset[i]['lon'], +dataset[i]['lat']])));
		marker.setId(dataset[i]['protocollo']);
		accidentsMapLayer.getSource().addFeature(marker);
	}
	spinner.hide();
}
