Car accidents map - frontend
=========================

This project is a rewrite of an old assignment for the [InfoVis course](http://www.dia.uniroma3.it/~infovis)
held by Maurizio Patrignani at Roma Tre University.
It's original version is visible [here](https://github.com/marcosox/visualizzazione_incidenti),
with a list of the changes.

This is the frontend component.
It reads data from the [backendend java application](https://github.com/marcosox/car-accidents-map-be).

### About

This is a tool to visualize data about car accidents reported in the Rome city territory between 2012 and 2015.
The original data was obtained from the [Rome municipality open data website](http://dati.comune.roma.it/cms/it/incidenti_stradali.page) in CSV format,
then converted to RDF with [Google Refine](http://openrefine.org/) and manipulated in different ways to learn about semantic web technologies
(which included generating an ontology to describe road accidents and using [SPARQL](https://en.wikipedia.org/wiki/SPARQL) to query the data).
Finally it was cleaned and persisted on a MongoDB collection to be used by this web app.

### Installation:

1. Have an instance of the [backend app](https://github.com/marcosox/car-accidents-map-be) running.
2. Deploy the contents of this project on a webserver
3. Connect to the webserver index.html. That's it.

##### run in a container

The app can also run in a docker container:

	docker run -it --rm -p 80:80 -v"$(pwd)":/usr/share/nginx/html nginx:alpine

### Usage

##### statistics

This page shows some statistics about the dataset, like total number of accidents and vehicles.

##### time graph

In this page there is a calendar chart for each year, coloured with a white-green-yellow-red scale based on daily accidents count.

At the bottom of this page there is a simple line graph showing the number of accidents over the complete time period.

##### histogram

This page shows a bar chart that groups accidents by a parameter selected from a dropdown menu.

Clicking on a bar opens a second chart that lets the user search on another parameter while highlighting the selected one.
Example:

- User selects from the dropdown "Accidents by road name"
- The accidents counts are shown, and user selects the highest bar
- The second chart opens, and the user selects "Accidents by type"
- The second chart shows the accidents count, grouped by type, highlighting in red the percentage of accidents happened in the most reported road.

The second chart can be normalized by clicking on the corresponding option.
This will normalize the chart bars to full height.

##### districts map

[work in progress]

##### accidents map

[work in progress]

### Technologies used:

* [**D3.JS**](https://d3js.org/)
* [**Bootstrap**](https://getbootstrap.com/)
* [**Jquery**](https://jquery.com/)
* [**Google Maps APIs**](https://developers.google.com/maps/)

## Feedback and contacts
If you think there is a bug, or something is missing or wrong with the documentation/support files, feel free to [open an issue].

## License
This software is released under the LGPL V3 license.
A copy is included in the LICENSE file


[open an issue]: https://github.com/marcosox/car-accidents-map-fe/issues
[releases page]: https://github.com/marcosox/car-accidents-map-fe/releases
