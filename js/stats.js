/**
 * Ottiene il totale e lo visualizza nel rispettivo campo nominato come la collezione
 */
function getTotal() {
	$(".loading-spinner-enabled").html("<img height=\"24px\" src=\"img/loading_spinner.gif\">");
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetTotal",
		dataType: 'json',
		success: function (result) {
			$("#veicoli").text(result['veicoli']);
			$("#incidenti").text(result['incidenti']);
			$("#persone").text(result['persone']);
			const mediaVeicoli = parseFloat(Math.round((result['veicoli'] / result['incidenti']) * 10000) / 10000).toFixed(4);
			const mediaPersone = parseFloat(Math.round((result['persone'] / result['incidenti']) * 10000) / 10000).toFixed(4);
			$("#mediaVeicoli").text(mediaVeicoli);
			$("#mediaPersone").text(mediaPersone);
		},
		error: function (result) {
			console.error(result);
			$("#veicoli").text("Error retrieving data.");
			$("#incidenti").text("Error retrieving data.");
			$("#persone").text("Error retrieving data.");
			$("#mediaVeicoli").text("Error retrieving data.");
			$("#mediaPersone").text("Error retrieving data.");
		}
	});
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetCount?collection=incidenti&field=strada",
		dataType: 'json',
		success: function (result) {
			$("#strade").text(result.length);	// TODO: change this endpoint to one that returns only count
		},
		error: function (result) {
			console.error(result);
			$("#strade").text("Error retrieving data.");
		}
	});
}

$(document).ready(getTotal());
