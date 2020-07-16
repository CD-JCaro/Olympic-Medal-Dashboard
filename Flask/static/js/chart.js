////////////////////////////////////////////////
//Utility functions
////////////////////////////////////////////////

//filters current dataset based off a provided key
//there is a hack to accomodate differing names from the geojson
function filterData(data, key, value)
{
    return data.filter(medal => (medal[key] == value || (value.startsWith(medal[key]) && !(medal[key] == value) ) ) ); 
}

// provides the  first and last years of a dataset
function getMinMaxYear(years)
{
    return [years[0], years[years.length -1]];
}

//used during testing before flask app
///////////
function getYearRange(data, start, end)
{
    if(start > end)
    {
        //simple swap
        var temp = start;
        start = end;
        end = temp;
    }

    return data.filter(stuff => parseInt(stuff["Year"]) >= parseInt(start) && parseInt(stuff['Year']) <= parseInt(end) ); 
}
//////////

//provides a list of all years in the dataset
function getYears(data)
{
    var years = {};

    data.forEach(element => 
        {
            years[element.Year] = 1; 
        });
    
    return Object.keys(years);
}

//provides a list of all countries in the dataset
//too lazy to generalize the getYears function
function getCountries(data)
{
    var country = {};

    data.forEach(element => 
        {
            country[element.Country] = 1; 
        });
    
    return Object.keys(country);
}

function getValues(data, cat)
{
    var results = {};

    data.forEach(element => 
        {
            results[element[cat]] = 1; 
        });
    
    return Object.keys(results);
}
//returns how many of a certain medal are present in the dataset
// if no medal is provided, all medals will be returned
function getMedalCount(data, medal = "")
{
    var medalCount = 0;

    data.forEach(element => 
    {
        if(medal == "" || element.Medal == medal)
        {
            medalCount +=1;
        }
    });

    return medalCount;
}

//returns rgb color for a given medal
function getColor(medal)
{
    var color = "black";

    switch(medal)
    {
        case "Gold":
        {
            color = 'rgb(255,215,0)';
            break;
        }
        case "Silver":
        {
            color = 'rgb(192,192,192)';
            break;
        }
        case "Bronze":
        {
            color = 'rgb(205,127,50)'
            break;
        }
    }

    return color;
}

////////////////////////////////////////////////
//Create stacked bar graph
////////////////////////////////////////////////

//creates a male/female pair for a given medal
// assigns the trace to a particular subplot
// based on provided count
function makeTrace(data, medal, count, legend)
{
    var male = filterData(data, "Gender", "Men");
    var female = filterData(data, "Gender", "Women");

    var mMedal = getMedalCount(male, medal);
    var fMedal = getMedalCount(female, medal);


    var trace = 
    {
        x: ["M", "F"],
        y: [mMedal, fMedal],
        name: medal,
        type: 'bar',
        xaxis: "x" + count,// assigning subplot
        marker: {color: getColor(medal)},//setting subplot color based on medal
        showlegend: legend
    };

    return trace;
}

function setupTrace(data, year, traces, count, legend)
{
    //get the data from a particular year to populate our subplot
    var yearData = filterData(data, "Year", year);

    //create traces
    traces.push(makeTrace(yearData, "Gold", count, legend));
    traces.push(makeTrace(yearData, "Silver", count, legend));
    traces.push(makeTrace(yearData, "Bronze", count, legend));
}

function setupLayout(layout, year, start, increment, count)
{
    var axisID = "xaxis";

    if(count != 1)
    {
        axisID += count;
    }

    layout[axisID] = 
    {
        domain: [start, start + increment],//dynamically setting its display region
        anchor: "x" + count,//anchoring to subplot
        showdividers: true,
        tickson: "boundaries",
        ticklen: 15,
        title: year,
        xaxis: {tickangle: -45}
    };
}

function createBar(data)
{
    var years = getYears(data);
 
    var minMax = getMinMaxYear(years);

    var traces = [];
    //base layout for the bar
    var layout = 
    {
         barmode: "stack",
         title: `Medal Breakdown by gender for years ${startFilter}-${endFilter}`
    };

    //for dividing up the render area for our yearly bars
    var start = 0;
    var increment = 1 / years.length;

    //for subplot goodness
    var count = 1;

    var legend = true;

    for(var i = 0; i < years.length; i++)
    {
        setupTrace(data, years[i], traces, count, legend);
        setupLayout(layout, years[i], start, increment, count);
        start += increment;
        count += 1;
        legend = false;
    }

    Plotly.newPlot('stacked-bar', traces, layout);
}
/////////////////////////////////////////////////////////////
// End create bar graph
/////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////
// Create burst
/////////////////////////////////////////////////////////////
function createBurst(data)
{
    var male = filterData(data, "Gender", "Men");
    var female = filterData(data, "Gender", "Women");

    //getting our medal counts to populate burst
    ////////////////////////////////////////////
    var medals = [];
    var mMedals = getMedalCount(male);
    var fMedals = getMedalCount(female);

    medals.push(mMedals + fMedals);
    medals.push(mMedals);
    medals.push(fMedals);

    medals.push(getMedalCount(male, "Gold"));
    medals.push(getMedalCount(male, "Silver"));
    medals.push(getMedalCount(male, "Bronze"));

    medals.push(getMedalCount(female, "Gold"));
    medals.push(getMedalCount(female, "Silver"));
    medals.push(getMedalCount(female, "Bronze"));
    //////////////////////////////////////////////

    var gold = getColor("Gold");
    var silver = getColor('Silver');
    var bronze = getColor('Bronze');
    //             white                     blue                pink
    var colors = ['rgb(255, 255, 255)', 'rgb(0, 0, 255)', 'rgb(255, 192, 203)', gold, silver, bronze, gold, silver, bronze]

    //bursts are neato
    var data = [
    {
        type: "sunburst",
        labels: ["Medals", "Male", "Female", "Gold", "Silver", "Bronze", "Gold ", "Silver ", "Bronze "],
        parents: ["", "Medals", "Medals", "Male", "Male", "Male", "Female", "Female", "Female" ],
        values:  medals,
        outsidetextfont: {size: 20, color: "#377eb8"},
        leaf: {opacity: 0.4},
        marker: {colors: colors, line: {width: 2}},
    }];

    var layout = 
    {
        title: "Medal Breakdown by Gender",
    };

    Plotly.newPlot('pie', data, layout);
}

/////////////////////////////////////////////////////////////
// End create burst
/////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////
// Create Area chart
/////////////////////////////////////////////////////////////
function createArea(data)
{
    var years = getYears(data);

    var minmax = getMinMaxYear(years);

    var gold = [];
    var silver = [];
    var bronze = [];

    var yearData = data;
    for(var i = 0; i < years.length; i++)
    {
        yearData = filterData(data,"Year", years[i]);

        gold.push(getMedalCount(yearData, "Gold"));
        silver.push(getMedalCount(yearData, "Silver"));
        bronze.push(getMedalCount(yearData, "Bronze"));
    }

    var trace = 
    {
        y: gold,
        x: years,
        name: "Gold",
        marker: {color: getColor("Gold")},
        type: "line",
        stackgroup: "one"
    }

    var trace2 = 
    {
        y: silver,
        x: years,
        name: "Silver",
        marker: {color: getColor("Silver")},
        type: "line",
        stackgroup: "one"
    }

    var trace3 = 
    {
        y: bronze,
        x: years,
        name: "Bonze",
        marker: {color: getColor("Bronze")},
        type: "line",
        stackgroup: "one"
    }

    var data = [trace, trace2, trace3];

    var layout = 
    {
        title:`Medal type breakdown for ${startFilter}-${endFilter}`
    };

    Plotly.newPlot("area-chart", data, layout);
}

/////////////////////////////////////////////////////////////
// End create area chart
/////////////////////////////////////////////////////////////

var countries = undefined;
// do the thing
function init()
{
    updateData("1896","2014","All","All","All","All", "All");

    getData.done(function(results)
    {
        createBar(results);

        createBurst(results);

        createArea(results);

        initDropdowns(results);
    });

    updateData("1896","2014","All","All","All","All", "All");

    getData.done(function(results)
    {
        worldMap(results);
    });
}

/////////////////////////////////////////////////////////////
// Start Map area
/////////////////////////////////////////////////////////////

function worldMap(olympics)
{
    var url = 'https://s3.amazonaws.com/rawstore.datahub.io/23f420f929e0e09c39d916b8aaa166fb.geojson'

    d3.json(url, function(geoData)
    {
        createMap(geoData, olympics);
    });
}

//gross
var myMap = undefined;
var legend = undefined;
function createMap(geoData, olympics)
{
    if(myMap == undefined)
    {
        var corner1 = L.latLng(120, 200)
        var corner2 = L.latLng(-120, -200)
        var bounds = L.latLngBounds(corner2, corner1);

        myMap = L.map("map", 
        {
            center: [0,0],
            zoom: 2,
            maxBounds: bounds
        });
    }   

    L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", 
    {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/dark-v10",
        accessToken: API_KEY
    }).addTo(myMap);    

    setupCountries(geoData, olympics, myMap);
   
    if(legend != undefined)
    {
        myMap.removeControl(legend);
    }
    legend = setupLegend(olympics);
    legend.addTo(myMap);
}

function setupLegend(olympics)
{
    var total = getMedalCount(olympics);

    var legend = L.control({position: 'bottomright'});
    
    var ranges = ["1", `${Math.max(Math.floor(total * 0.01), 1)}`, `${Math.max(Math.floor(total * 0.02), 1)}`, 
                `${Math.max(Math.floor(total * 0.03), 1)}`, `${Math.max(Math.floor(total * 0.04), 1)}`];

    legend.onAdd = function(map) 
    {
        var div = L.DomUtil.create('div', 'info legend');
        var grades = [1, 10, 20, 30, 40];
        var labels = [ranges[0] + "-" + ranges[1], 
                    ranges[1] + "-" + ranges[2],
                    ranges[2] + "-" + ranges[3], 
                    ranges[3] + "-" + ranges[4],
                    ranges[4] + "+"];

        for (var i = 0; i < grades.length; i++) 
        {
            div.innerHTML += '<i style="background:' + chooseCountryColor(1000, grades[i]) + '"></i> ' +
                labels[i]+ '<br>';
        }

      return div;
    };   
    return legend;
}

function chooseCountryColor(total, country)
{
    
    var g = 255 * (country/total) * 25;
    var r = 0;
    var b = 0;

    if(country > 0 )
    {
        r += 55;
    }

    return `rgb(${r},${g},${b})`
}

//gross
var layer = undefined;
function setupCountries(geoJson, olympics, myMap)
{
    var total = getMedalCount(olympics);

    if(layer != undefined)
    {
        myMap.removeLayer(layer);
    }

    //so many lines... so much time
    layer = L.geoJson(geoJson, {
        style: function(feature) {
            //super ugly but meh
            var name = (feature.properties.ADMIN == 'United States of America' ? "USA": feature.properties.ADMIN );
            if (name == "United Kingdom")
            {
                name = "UK"
            }
            else if(name == "United Republic of Tanzania")
            {
                name = "Tanzania"
            }
          return {
            color: "white",
                        fillColor: chooseCountryColor(total, getMedalCount(filterData(olympics,"Country", name))),
            fillOpacity: 0.5,
            weight: 1.5
          };
        },
        onEachFeature: function(feature, layer) 
        {  
            //time crunch why
            var name = (feature.properties.ADMIN == 'United States of America' ? "USA": feature.properties.ADMIN );
            if (name == "United Kingdom")
            {
                var name = "UK"
            }
            else if(name == "United Republic of Tanzania")
            {
                name = "Tanzania"
            }
          layer.bindPopup("<h1>" + feature.properties.ADMIN + 
          "</h1> <hr> <h2>Gold:" + getMedalCount(filterData(olympics, "Country", name), "Gold") + "<br>" +
          "Silver:" + getMedalCount(filterData(olympics, "Country", name), "Silver") + "<br>" +
          "Bronze:" + getMedalCount(filterData(olympics, "Country", name), "Bronze") + "</h2>");
        }
      }).addTo(myMap);
}

/////////////////////////////////////////////////////////////
// End map area
/////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
// super ugly but im in a time crunch so here ya go
var startFilter = "1896"
var endFilter = "2014"
var countryFilter = "USA"
var seasonFilter = "All"
var sportFilter = "All"

var summer = true;
var winter = true;
var summerCB = d3.select("#summer");

summerCB.on("change", function()
{
    summer = summerCB.property("checked");
    updateDropdowns();
});

var winterCB = d3.select("#winter");
winterCB.on("change", function()
{
    winter = winterCB.property("checked");
    updateDropdowns();
});

function updateDropdowns()
{

    if(winter && summer)
    {
        seasonFilter = "All";
    }
    else if(summer)
    {
        seasonFilter = "Summer";
    }
    else if(winter)
    {
        seasonFilter = "Winter";
    }
    else
    {
        seasonFilter = "";
    }

    updateData(startFilter, endFilter, "All",seasonFilter,"All","All", "All");

    getData.done(function(results)
    {
        initDropdowns(results);
    });
}
///////////////////////////////////////////////////////////


var button = d3.select(".stuff");

var filters = [d3.select("#startyear"), d3.select("#endyear"), d3.select("#country")];

button.on("click", function() 
{
    var newStartFilter = d3.select("#startyear").property("value");
    newStartFilter = newStartFilter == ""? "1896": newStartFilter;

    var newEndFilter = d3.select("#endyear").property("value");
    newEndFilter = newEndFilter == ""? "2014": newEndFilter;

    var newCountryFilter = d3.select("#country").property("value");

    var newSportFilter = d3.select("#sport").property("value");

    var redoMap = false;

    if(parseInt(newStartFilter) > parseInt(newEndFilter))
    {
        //should probably swap the values in the text box buuuuuut....
        //super fancy swap
        var temp = newStartFilter;
        newStartFilter = newEndFilter;
        newEndFilter = temp;
    }

    if(startFilter != newStartFilter || endFilter != newEndFilter || sportFilter != newSportFilter)
    {
        redoMap = true;
    }

    startFilter = newStartFilter;
    endFilter = newEndFilter;
    countryFilter = newCountryFilter;
    sportFilter = newSportFilter;

    updateData(startFilter, endFilter, countryFilter,seasonFilter,"All",sportFilter, "All");

    getData.done(function(results)
    {
        createBar(results);
        createBurst(results);
        createArea(results);
    });

    if(redoMap)
    {
        updateData(startFilter, endFilter, "All",seasonFilter,"All",sportFilter, "All");

        getData.done(function(results)
        {
            worldMap(results);
        });
    }
});

function populateDropdown(items, id, all)
{
    var dropdown = d3.select(id);
    dropdown.html("");

    if(all)
    {
        addSelect("All", dropdown);
    }
    
    items.forEach(name => addSelect(name, dropdown));

    dropdown.property('selected', 'USA');
}

function addSelect(name, dropdown)
{
    var selected = name =="USA"
    var select = dropdown.append("option").text(name);
    select.property("value", name);
    select.property("selected", selected);
    
}

function initDropdowns(results)
{
    countries = getValues(results, "Country");
    countries.sort();
    populateDropdown(countries, "#country", false);

    sports = getValues(results, "Sport");
    sports.sort();
    populateDropdown(sports, "#sport", true);
}

init();