var years = {};
var chart;
var chartExists = false;

$(document).ready(() => {
    let link = "https://opendata.cbs.nl/ODataApi/odata/37478eng/TypedDataSet";

    setBindings();

    $('#startBtn').trigger('Loading.Start');
    getData(link);
});

/*
* Function that sets binds custom events for start button to
* animate it at the start. Also it add event listeners to
* other elements for them to be able to provide needed
* functionality
*/
function setBindings() {
    $('#startBtn').on('Loading.Start', (e) => {
        $('#startBtn').text('Loading...');
    }).on('Loading.End', (e) => {
        $('#startBtn').text('Click Me!');
    });
}

/**
 * Function that get json dataset from cbs using AJAX
 * Calls function "manageData" when data was got successfully
 * Alerts with status of an error when data couldn't be got from CBS
 * @param  {string} link url to the json file
 */
function getData(link) {
    $.ajax({
        url: link,
        method: 'GET',
        dataType: 'json',
        success: (data) => {
            manageData(data.value)
        },
        error: (request, status, error) => {
            console.log(request);
            alert("Error: "+status);
        }
    });
}

/**
 * Function that filters the data, that was got in "getData" function
 * @param  {Array} data the database that was got from CBS
 */
function manageData(data) {
    let d = new Date();
    let year = d.getFullYear() - 1;

    years["y1"] = year - 9;
    years["y2"] = year;

    data = sortByLocalWorldNeeded(sortByAirports(filterByYears(data, years.y1, years.y2)));
    console.log(data);
    $('#startBtn').trigger('Loading.End');
    initPaths(data);
}

/**
 * Function that filters data by last full 10 years
 * @param  {Array} data the database that was got from CBS
 * @param  {number} y1   starting year
 * @param  {number} y2   ending year
 * @return {Array}       filtered database
 */
function filterByYears(data, y1, y2) {
    let newData = [];
    data.forEach((dataset) => {
        for (let i = y1; i <= y2; i++) {
            if (dataset["Periods"] === i.toString()+"JJ00") newData.push(dataset);
        }
    });

    return newData;
}

/**
 * Function that sorts data by Airports so it's easier to use in the future
 * @param  {Array} data databse that was sorted by full years
 * @return {object}     sorted database
 */
function sortByAirports(data) {
    let airports = {
        "Amsterdam": "A043590",
        "Rotterdam": "A043596",
        "Eindhoven": "A043591",
        "Maastricht": "A043595",
        "Groningen": "A043593"
    };

    let newData = {
        "Amsterdam": [],
        "Rotterdam": [],
        "Eindhoven": [],
        "Maastricht": [],
        "Groningen": []
    };

    data.forEach((dataset) => {
        Object.keys(newData).forEach((city) => {
            if (dataset["Airports"] === airports[city]) newData[city].push(dataset);
        });
    });

    return newData;
}

/**
 * Function that splits data into 2 variables that represents
 * data for Netherlands only and for the whole world, also filtering
 * only needed information that will be shown on the website
 * @param  {object} data database that was sorted out by Airport cities
 * @return {object}      sorted database
 */
function sortByLocalWorldNeeded(data) {
    let newData = { "local": {}, "world": {} };

    Object.keys(data).forEach((city) => {
        let cityData = { "local": [], "world": [] };
        data[city].forEach((dataset) => {
            let newLocalDataset = {
                "Year": dataset["Periods"].substr(0, 4),
                "CrossCountryFlights": dataset["CrossCountryFlights_1"],
                "LocalFlights": dataset["LocalFlights_2"]
            };
            let newWorldDataset = {
                "Year": dataset["Periods"].substr(0, 4),
                "TotalPassengers": dataset["TotalPassengers_12"],
                "Europe": dataset["EuropeTotal_22"],
                "Africa": dataset["Africa_26"],
                "America": dataset["America_32"],
                "Asia": dataset["Asia_36"],
                "Oceania": dataset["Oceania_40"]
            };

            cityData["local"].push(newLocalDataset);
            cityData["world"].push(newWorldDataset);

        });

        newData["local"][city] = cityData["local"];
        newData["world"][city] = cityData["world"];
    });

    return newData;
}

/**
 * Functions similar to "setBindings" but is used to add functionality to all
 * other elements and is called after the data is loaded so scripts wont have
 * any bugs later on
 * @param  {object} data completely filtered and sorted out database
 */
function initPaths(data) {
    let chosenCity = "";
    let chosenPlaceorPassengers = "";
    let chosenYear = 0;

    $('#startBtn').click((e) => {
        $(e.target).fadeOut();
        $('#choosePathContainer').fadeIn().css('display', 'flex');
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#choosePathContainer").offset().top
        }, 500);
    });

    for (let i = years.y1; i <= years.y2; i++) {
        let yearBtn = $(`<li><button class="yearBtn">${i}</button></li>`);
        $('.downMenu').append(yearBtn);
    }


    $('.chooseBtnContainer').click((e) => {
        if ($(e.target).attr('id') === "localImgHover") {
            $('#worldPath').css('display', 'none');
            $('#localPath').fadeIn().css('display', 'grid');

            $([document.documentElement, document.body]).animate({
                scrollTop: $("#localPath").offset().top
            }, 1000);
        }
        else {
            $('#localPath').css('display', 'none');
            $('#worldPath').fadeIn().css('display', 'grid');

            $([document.documentElement, document.body]).animate({
                scrollTop: $("#worldPath").offset().top
            }, 1000);
        }
    });

    $('.localMenuCities button').hover((e) => {
        showDots(e);
    }, (e) => {});

    $('.menuCities button').click((e) => {
        chosenCity = $(e.target.parentElement).text();

        $(e.target.parentElement.parentElement).hide();
        $(e.target.parentElement.parentElement).siblings('ul').show();
    });

    $('.backLi button').click((e) => {
        if (e.target.parentElement.parentElement.parentElement.parentElement.id === 'localPath') {
            $('#localChart').css('visibility', 'hidden');
            if (chartExists) chart.destroy();
            $(`#netherlandsMap, #${chosenCity}Flash`).css('visibility', 'visible');
        }
        else {
            $('.cls-3, .cls-14, .cityName, .cls-2').css('visibility', 'hidden');
        }

        $(e.target.parentElement.parentElement).hide();
        $(e.target.parentElement.parentElement).siblings('ul').show();

        chosenCity = "";
        chosenPlaceorPassengers = "";

        $('#worldPath .menuFlights button').css({ "color": "white", "background-color": "#B3192B" });
    });

    $('.localFlightBtn').click((e) => {
        $('#netherlandsMap, .cityFlash').css('visibility', 'hidden');

        if (chartExists) chart.destroy();
        setTimeout(() => initChart(
            $(e.target).text() + " Flights in " + chosenCity,
            chosenCity,
            data,
            $(e.target).text() === 'Cross-Country' ? "CrossCountryFlights" : "LocalFlights"
        ), 1500);
        $('#localChart').css('visibility', 'visible');
    });

    $('.worldMenuCities button').hover((e) => {
        showCities(e)
    });

    $('#worldPath .menuFlights button').hover((e) => {
        if (!($(".chosen").length)) {
            $('.cls-3, .cls-14').css('visibility', 'hidden');
            showLines(e);
        }
        $('.menuFlights button').not('.chosen').css({ "color": "white","background-color": "#B3192B" });
        $(e.target).css({ "background-color": "#E62037", "color": "lightgrey" });
    }, (e) => {
        if (!$(e.target).hasClass('chosen')) $(e.target).css({ "color": "white","background-color": "#B3192B" });    });

    $('#worldPath .menuFlights button').click((e) => {
        $('.chosen').removeClass('chosen');
        if ($(e.target).text() !== 'Back') $(e.target).addClass('chosen');
        showLines(e);
        if ($(e.target).attr('id') === 'totalPassengersBtn') chosenPlaceorPassengers = "TotalPassengers";
        else chosenPlaceorPassengers = $(e.target).text();

        if (chosenYear !== 0) showText(data, chosenCity, chosenYear, chosenPlaceorPassengers);

        $('.menuFlights button').css({ "color": "white", "background-color": "#B3192B" });
        $(e.target).css({ "background-color": "#E62037", "color": "lightgrey" });
    });

    $('.downMenu button').click((e) => {
        $('.downMenu button').css({ "color": "white", "background-color": "#B3192B" });
        chosenYear = $(e.target).text();
        $(e.target).css({ "background-color": "#E62037", "color": "lightgrey" });

        if (chosenPlaceorPassengers !== '') showText(data, chosenCity, chosenYear, chosenPlaceorPassengers);
    });

    $('#topBtn').click((e) => {
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#choosePathContainer").offset().top
        }, 1000);
    });
}

/**
 * Functions that animates small white flashes that indicate
 * cities on map of the Netherlands
 * @param  {Event} e event that was triggered by hovering over or clicking
 *                    sidemenu buttons with cities names in "Netherlands" section
 */
function showDots(e) {
    $('.cityFlash').css('visibility', 'hidden');
    switch ($(e.target).text()) {
        case 'Amsterdam':
            $('#AmsterdamFlash').css('visibility', 'visible');
            break;
        case 'Rotterdam':
            $('#RotterdamFlash').css('visibility', 'visible');
            break;
        case 'Eindhoven':
            $('#EindhovenFlash').css('visibility', 'visible');
            break;
        case 'Maastricht':
            $('#MaastrichtFlash').css('visibility', 'visible');
            break;
        case 'Groningen':
            $('#GroningenFlash').css('visibility', 'visible');
            break;
    }
}

/**
 * Functions that shows names of the cities on the worl map
 * @param  {Event} e event that was triggered by hovering over or clicking
 *                    sidemenu buttons with cities names in "World" section
 */
function showCities(e) {
    $('.cityName').css('visibility', 'hidden');
    switch ($(e.target).text()) {
        case 'Amsterdam':
            $('#Amsterdam').css('visibility', 'visible');
            break;
        case 'Rotterdam':
            $('#Rotterdam').css('visibility', 'visible');
            break;
        case 'Eindhoven':
            $('#Eindhoven').css('visibility', 'visible');
            break;
        case 'Maastricht':
            $('#Maastricht').css('visibility', 'visible');
            break;
        case 'Groningen':
            $('#Groningen').css('visibility', 'visible');
            break;
    }
}

/**
 * Function that shows paths to parts of the world that were chosen in the side
 * menu
 * @param  {Event} e event that was triggered by hovering over or clicking
 *                    sidemenu buttons with parts of the world names in "World"
 *                    section
 */
function showLines(e) {
    $('.cls-2, .worldPartName').css('visibility', 'hidden');
    switch ($(e.target).text()) {
        case 'Europe':
            $('#EuropePath, #Europe-2').css('visibility', 'visible');
            break;
        case 'America':
            $('#AmericaPath, #America-2').css('visibility', 'visible');
            break;
        case 'Africa':
            $('#AfricaPath, #Africa-2').css('visibility', 'visible');
            break;
        case 'Asia':
            $('#AsiaPath, #Asia-2').css('visibility', 'visible');
            break;
        case 'Oceania':
            $('#OceaniaPath, #Oceania-2').css('visibility', 'visible');
            break;
        case 'Annual Number Of Passengers':
            $('.cls-2').css('visibility', 'visible');
            break;
    }
}

/**
 * Function that shows numbers that represent data chosen from side menu for year
 * that was chosen from the down menu in "World" section
 * @param  {object} data       completely filtered and sorted out database
 * @param  {string} city       city name
 * @param  {number} year       last full year
 * @param  {string} placeOrPas string that represents name  of the part of the
 *                             world or "Passengers"
 */
function showText(data, city, year, placeOrPas) {
    if (data === "" || city === "" || year === "" || placeOrPas === "") return;

    $('.cls-3, .cls-14').css('visibility', 'hidden');

    let yearInd;
    for (let dataset in data['world'][city]) if (data['world'][city][dataset]['Year'] === year) yearInd = dataset;

    let num = data['world'][city][yearInd][placeOrPas];

    if (placeOrPas === 'TotalPassengers') $(`#Passengers`).text(num).css('visibility', 'visible');
    else $(`#${placeOrPas}`).text(num).css('visibility', 'visible');
}

/**
 * Function that returns array of strings made from consecutive numbers
 * @param  {number} a first number
 * @param  {number} b second number
 * @return {Array}    coverted int array to string array
 */
function rangeIntToStr(a, b) {
    var arr = [];
    for (let i = a; i <= b; i++) arr.push(i.toString());
    return arr;
}

/**
 * Function that creates chart with provided data with the help of "ChartJS"
 * library
 * @param  {string} label      label string for chart
 * @param  {string} city       city name
 * @param  {object} data       completely filtered and sorted database
 * @param  {string} infoNeeded string that says if info about local or
 *                             cross-country flights needed
 */
function initChart(label, city, data, infoNeeded) {
    var ctx = document.getElementById('localChart').getContext('2d');
    var chartData = [];
    for (let i = 0; i < data["local"][city].length; i++) { chartData.push(data["local"][city][i][infoNeeded]) }

    if (!chartExists) chartExists = !chartExists;

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rangeIntToStr(years.y1, years.y2),
            datasets: [{
                label: label,
                data: chartData,
                backgroundColor: 'rgb(179, 25, 43)',
                borderColor: 'rgb(36, 1, 21)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}
