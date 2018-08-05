/**
 * Ottiene il totale e lo visualizza nel rispettivo campo nominato come la collezione
 */
function getDBStats() {
	$(".loading-spinner-enabled").html("<img height=\"24px\" src=\"img/loading_spinner.gif\">");
	$.ajax({
		type: 'GET',
		url: config.backendUrl + "/GetTotals",
		dataType: 'json',
		success: function (result) {
			$("#veicoli").text(result['veicoli']);
			$("#incidenti").text(result['incidenti']);
			$("#persone").text(result['persone']);
			$("#strade").text(result['strade']);
			const mediaVeicoli = parseFloat(Math.round((result['veicoli'] / result['incidenti']) * 10000) / 10000).toFixed(4);
			const mediaPersone = parseFloat(Math.round((result['persone'] / result['incidenti']) * 10000) / 10000).toFixed(4);
			$("#mediaVeicoli").text(mediaVeicoli);
			$("#mediaPersone").text(mediaPersone);
		},
		error: function (result) {
			console.error(result);
			$(".loading-spinner-enabled").text("Error retrieving data.");
		}
	});
}

$(document).ready(getDBStats());
