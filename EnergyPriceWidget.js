// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: bolt;
// EnergyPriceWidget
// v1.0.0 - first version - Sven-Ove Bjerkan
// v1.0.1 - translated to English
// v1.1.0 - support for Sweden and Denmark

// What power-zone to display?
// NORWAY:
// Valid values are: NO1, NO2, NO3, NO4 eller NO5
// Sørøst-Norge, N01
// Sørvest-Norge, N02
// Midt-Norge, N03
// Nord-Norge, N04
// Vest-Norge, N05
// Fortsatt usikker på hvilken sone du hører til?
// Se kart her: https://temakart.nve.no/prosjekt/f43d4457-d6a6-41e5-82aa-df12e42aa592

// SWEDEN
// Valid values are: SE1, SE2, SE3 or SE4

// DENMARK
// Valid values are: DK1 or DK2

// Power-zone - see valid settings above
const ZONE = "NO3";

// The additional cost your powercompany charges for the power, in øre. Usually 0-5 øre.
const ADDITION = 1;

// Mark midnight with at dot in the graph? (true/false)
const MIDNGHT = false;

// HTML-code for background color of the widghet (#000000 is black)
const BGCOLOR = "#000000";

// HTML-code for the text color (#FFFFFF is white)
const TEXTCOLOR = "#FFFFFF";

// When the price this hour is higher than the average price for the day, use this textcolor (default is red)
const TEXTCOLOR_HIGH = "#de4035";

// When the price this hour is lower than the average price for the day, use this textcolor (default is green)
const TEXTCOLOR_LOW = "#35de3b";

// Define how many hours backwards and forward from the current hour to display
const HOURS_BACK = 3;
const HOURS_FORWARD = 21;




// NO NEED TO CHANGE ANYTHING BELOW THIS!
// --------------------------------------

const COUNTRY = ZONE.slice(0,2);
let URL, L
if (COUNTRY == "NO") {
  URL = "hvakosterstrommen.no";
  L =   {
	  ore: "øre",
	  timepriser: "Timepriser",
	  pris_na: "Pris nå",
	  snitt: "Snitt",
	  oppdatert: "Oppdatert",
	  datakilde: "Datakilde"
  }
}
else if (COUNTRY == "SE") {
  URL = "elprisetjustnu.se";
  L =   {
  	  ore: "öre",
  	  timepriser: "Timpriser",
  	  pris_na: "Pris nu",
  	  snitt: "Medel",
  	  oppdatert: "Uppdaterad",
  	  datakilde: "Datakälla"
  }
}
else if (COUNTRY == "DK") {
  URL = "elprisenligenu.dk";
  L =   {
	  ore: "øre",
	  timepriser: "Timepriser",
	  pris_na: "Pris nu",
	  snitt: "Gennemsnit",
	  oppdatert: "Opdateret",
	  datakilde: "Datakilde"
	}
}

// Date-object for the current hour
let d = new Date();
d.setMinutes(0)
d.setSeconds(0)
d.setMilliseconds(0)

let json, json2, json3, req;
// Fetch yesterday (if HOURS_BACK point back beyond midnight)
if (d.getHours()-HOURS_BACK < 0) {
  d2 = new Date()
  d2.setDate(d2.getDate()-1)
  req = new Request("https://www." + URL + "/api/v1/prices/"+d2.getFullYear()+"/"+(d2.getMonth()+1)+"-"+pad(d2.getDate())+"_"+ZONE+".json")
  json = await req.loadString()
}

// Fetch today
req = new Request("https://www." + URL + "/api/v1/prices/"+d.getFullYear()+"/"+(d.getMonth()+1)+"-"+pad(d.getDate())+"_"+ZONE+".json")
json2 = await req.loadString()

// Fetch tomorrow (if time is after 13:00 and HOURS_FORWARD points beyond midnight)
if (d.getHours() >= 13 && d.getHours() + HOURS_FORWARD > 23) {
  d2 = new Date()
  d2.setDate(d2.getDate()+1)
  req = new Request("https://www." + URL + "/api/v1/prices/"+d2.getFullYear()+"/"+(d2.getMonth()+1)+"-"+pad(d2.getDate())+"_"+ZONE+".json")
  json3 = await req.loadString()
}

// Merge yesterday and today, if yesterday exist
if (json != null) {
  json = json.slice(0, -1) + "," + json2.slice(1)
}
else {
  json = json2
}

// Merge yesterday/today with tomorrow, if tomorrow exists
if (d.getHours() >= 13 && json3 != null && json != null && req.response.statusCode != 404) {
  json = json.slice(0, -1) + "," + json3.slice(1)
}
else if (json == null) {
  json = json3;
}

// Array with all the prices
let allPrices  = JSON.parse(json)

// Loop to find the array-key for current hour
let iNow, iStart, iEnd, dLoop
for (let i = 0; i < allPrices.length; i++) {
 dLoop = new Date(allPrices[i].time_start)

 // Found current hour, set the time back and forward for the start and end of the graph
 if (d.getTime() == dLoop.getTime()) {
   iNow = i
   iStart = (iNow-HOURS_BACK)
   iEnd = (iNow + HOURS_FORWARD)
   if (iEnd > allPrices.length) {
     iEnd = (allPrices.length-1)
   }
   break;
  }
}

// Loop to find average price
let avgPrice = 0
let minPrice = 100000
let maxPrice = 0
let prices = [];
let colors = [];
let pointsize = [];

// Find next midnight
d.setHours(0);
d.setDate(d.getDate()+1)

for (let i = iStart; i <= iEnd; i++) {
  if (COUNTRY == "NO")
    allPrices[i].per_kWh = allPrices[i].NOK_per_kWh
 else if (COUNTRY == "SE")
    allPrices[i].per_kWh = allPrices[i].SEK_per_kWh
 else if (COUNTRY == "DK")
	    allPrices[i].per_kWh = allPrices[i].DKK_per_kWh


  // Add 25% taxes if not zone=NO4
  if (ZONE != "NO4")
    allPrices[i].per_kWh *= 1.25

  // Add the power company addition
  allPrices[i].per_kWh += (ADDITION/100)

  // Convert from kroner to øre
  allPrices[i].per_kWh *= 100

  avgPrice += allPrices[i].per_kWh
  prices.push(Math.round(allPrices[i].per_kWh));

  if (allPrices[i].per_kWh < minPrice)
    minPrice = Math.round(allPrices[i].per_kWh)
  if (allPrices[i].per_kWh > maxPrice)
    maxPrice = Math.round(allPrices[i].per_kWh)

  // Mark current hour in the graph
  if (i == iNow) {
    colors.push("'yellow'");
    pointsize.push(30);
  }
  // Mark midnight in the graph
  else if (MIDNGHT && d.getTime() == new Date(allPrices[i].time_start).getTime()) {
    colors.push("'cyan'");
    pointsize.push(30);
  }
  else {
    colors.push("'cyan'");
    pointsize.push(7);
  }
}

avgPrice = Math.round(avgPrice / prices.length)

// Loop to create a line for the average price
let dTemp
let avgPrices = []
let labels = []
for (let i = iStart; i <= iEnd; i++) {
  avgPrices.push(avgPrice);
  dTemp = new Date(allPrices[i].time_start)
  let hours = dTemp.getHours();
  labels.push("'" + pad(hours) + "'");
}

// Generate the graph
let url = "https://quickchart.io/chart?w=2400&h=1200&devicePixelRatio=1.0&c="
url += encodeURI("{ \
   type:'line', \
   data:{ \
      labels:[ \
         " + labels + " \
      ], \
      datasets:[ \
         { \
            label:'" + L['ore'] +"/kWh', \
            steppedLine:true, \
            data:[ \
               " + prices + " \
            ], \
            fill:false, \
            borderColor:'cyan', \
            borderWidth: 7, \
            pointBackgroundColor:[ \
               " + colors + " \
            ], \
            pointRadius:[ \
               " + pointsize + " \
            ] \
         }, \
         { \
            label:'Snitt (" + avgPrice + " " + L['ore'] + ")', \
            data:[ \
               " + avgPrices + " \
            ], \
            fill:false, \
            borderColor:'red', \
            borderWidth: 7, \
            pointRadius: 0 \
         } \
      ] \
   }, \
   options:{ \
      legend:{ \
         labels:{ \
            fontSize:90, \
            fontColor:'white' \
         } \
      }, \
      scales:{ \
         yAxes:[ \
            { \
               ticks:{ \
                  beginAtZero:false, \
                  fontSize:100, \
                  fontColor:'white' \
               } \
            } \
         ], \
         xAxes:[ \
            { \
               ticks:{ \
                  fontSize:60, \
                  fontColor:'white' \
               } \
            } \
         ] \
      } \
   } \
}")

const GRAPH = await new Request(url).loadImage()


// Get the price for the current hour
let priceOre = Math.round(allPrices[iNow].per_kWh)

// Create widget
async function createWidget() {
  // Create new empty ListWidget instance
  let lw = new ListWidget();

  // Set new background color
  lw.backgroundColor = new Color(BGCOLOR);

  // It's not possible to control when the widget updates
  // but we try to tell it to update one minute over the next hour
  var d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(1);
  // If prices for tomorrow should be available, wait a bit with the update
  if (d.getHours() == 13)
    d.setMinutes(15)

  lw.refreshAfterDate = d;

  // Add current price above the graph
  let price = lw.addText(L['pris_na'] + ": " + priceOre + " " + L['ore'] + "/kWh");
  price.centerAlignText();
  price.font = Font.lightSystemFont(20);
  // Define text color based on price
  if (priceOre < avgPrice)
    price.textColor = new Color(TEXTCOLOR_LOW)
  else if (priceOre > avgPrice)
    price.textColor = new Color(TEXTCOLOR_HIGH)

  // Add min/max price above the graph
  let maxmin = lw.addText("Min: " + minPrice + " " + L['ore'] + "/kWh | Max: " + maxPrice + " " + L['ore'] + "/kWh")
  maxmin.centerAlignText()
  maxmin.font = Font.lightSystemFont(12);
  maxmin.textColor = new Color(TEXTCOLOR);

  // A bit of space above graph
  lw.addSpacer(25)

  let overskrift = L['timepriser'];
  if (ZONE == "NO4")
    overskrift += " (eks MVA)"
  graphTxt = lw.addText(overskrift);
  graphTxt.centerAlignText();
  graphTxt.font = Font.lightSystemFont(16);
  graphTxt.textColor = new Color(TEXTCOLOR);

  // A bit of space
  lw.addSpacer(10)

  let stackGraph = lw.addStack()
  let imgstack2 = stackGraph.addImage(GRAPH)
  imgstack2.imageSize = new Size(300, 150)
  imgstack2.centerAlignImage()
  stackGraph.setPadding(0, 0, 0, 0)


  // A bit of space below graph
  lw.addSpacer(30)


  // Add info about last update time
  d = new Date()
  let hour = d.getHours();
  let min = d.getMinutes();

  let time = lw.addText(L['oppdatert'] + ": " + pad(hour) + ":" + pad(min));
  time.centerAlignText();
  time.font = Font.lightSystemFont(12);
  time.textColor = new Color(TEXTCOLOR);

  lw.addSpacer(5)

  // Add "link"
  let link = lw.addText(L['datakilde'] + ": www." + URL);
  link.centerAlignText();
  link.font = Font.lightSystemFont(10);
  link.textColor = new Color(TEXTCOLOR);

  // Return the created widget
  return lw;
}

let widget = await createWidget();

// When clicking on the widget, it should open the website of that zone
if (COUNTRY == "NO") {
	let by = "trondheim";
	if (ZONE == "NO1")
	  by = "oslo";
	else if (ZONE == "NO2")
	  by = "kristiansand"
	else if (ZONE == "NO4")
	  by = "tromso"
	else if (ZONE == "NO5")
	  by = "bergen"

	widget.url = 'https://www.' + URL + '/i/'+by
}
else {
	widget.url = 'https://www.' + URL
}

function pad(n){return n<10 ? '0'+n : n}

// Check where the script is running
if (config.runsInWidget) {
  // Runs inside a widget so add it to the homescreen widget
  Script.setWidget(widget);
} else {
  // Show the medium widget inside the app
  widget.presentLarge();
}
Script.complete();
