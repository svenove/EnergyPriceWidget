// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: bolt;
// EnergyPriceWidget
// v1.0.0 - første versjon - Sven-Ove Bjerkan


// Hvilken strømsone skal vises? 
// Gyldig verdier er: NO1, NO2, NO3, NO4 eller NO5

// Sørøst-Norge, N01
// Sørvest-Norge, N02
// Midt-Norge, N03
// Nord-Norge, N04
// Vest-Norge, N05

// Fortsatt usikker på hvilken sone du hører til? 
// Se kart her: https://temakart.nve.no/prosjekt/f43d4457-d6a6-41e5-82aa-df12e42aa592
const SONE = "NO3";

// Påslag i øre pr kWh på din strømavtale
const PASLAG = 1;

// Markere midnatt med en prikk i grafen?
const MIDNATT = false;

// HTML-koden for bakgrunnsfarge på widget (#000000 er svart)
const BAKGRUNNSFARGE = "#000000";

// HTML-koden for tekstfarge (#FFFFFF er hvit)
const TEKSTFARGE = "#FFFFFF";

// Når prisen denne timen er høyere enn snittprisen i dag, så brukes denne tekstfargen (rød)
const TEXTFARGE_HOY = "#de4035";

// Når prisen denne timen er lavere enn snittprisen i dag, så brukes denne tekstfargen (grønn)
const TEXTFARGE_LAV = "#35de3b";

// Angi hvor mange timer bakover og fremover fra inneværende time den skal bruke
const TIMER_BAKOVER = 3;
const TIMER_FREMOVER = 21;




// DU TRENGER IKKE ENDRE NOE LENGRE NED !
// --------------------------------------


// Date-objekt for akkurat denne timen
let d = new Date();
d.setMinutes(0)
d.setSeconds(0)
d.setMilliseconds(0)

let json, json2, json3, req;
// I går (hvis den skal vise tilbake i tid helt til i går)
if (d.getHours()-TIMER_BAKOVER < 0) {
  d2 = new Date()
  d2.setDate(d2.getDate()-1)
  req = new Request("https://www.hvakosterstrommen.no/api/v1/prices/"+d2.getFullYear()+"/"+(d2.getMonth()+1)+"-"+pad(d2.getDate())+"_"+SONE+".json")
  json = await req.loadString()
}

// I dag
req = new Request("https://www.hvakosterstrommen.no/api/v1/prices/"+d.getFullYear()+"/"+(d.getMonth()+1)+"-"+pad(d.getDate())+"_"+SONE+".json")
json2 = await req.loadString()

// I morgen (hvis klokka er mer enn 1300) og den skal vise så langt frem
if (d.getHours() >= 13 && d.getHours() + TIMER_FREMOVER > 23) {
  d2 = new Date()
  d2.setDate(d2.getDate()+1)
  req = new Request("https://www.hvakosterstrommen.no/api/v1/prices/"+d2.getFullYear()+"/"+(d2.getMonth()+1)+"-"+pad(d2.getDate())+"_"+SONE+".json")
  json3 = await req.loadString()
}

// merge i går og i dag
// hvis i går finnes
if (json != null) {
  json = json.slice(0, -1) + "," + json2.slice(1)
}
else {
  json = json2
}

// merge i går/i dag og i morgen
// hvis i morgen finnes
if (d.getHours() >= 13 && json3 != null && json != null && req.response.statusCode != 404) {
  json = json.slice(0, -1) + "," + json3.slice(1)
}
else if (json == null) {
  json = json3;
}


// Array med alle timepriser
let allPrices  = JSON.parse(json)


// Loop for å finne array-key for inneværende time
let iNow, iStart, iEnd, dLoop
for (let i = 0; i < allPrices.length; i++) {
 dLoop = new Date(allPrices[i].time_start)

 if (d.getTime() == dLoop.getTime()) {
   iNow = i
   iStart = (iNow-TIMER_BAKOVER)
   iEnd = (iNow + TIMER_FREMOVER)
   if (iEnd > allPrices.length) {
	   iEnd = (allPrices.length-1)
   }
   break;
  }
}

// Loop for å finne snittpris
let avgPrice = 0
let minPrice = 100000
let maxPrice = 0
let prices = [];
let colors = [];
let pointsize = [];

// Finn neste midnatt
d.setHours(0);
d.setDate(d.getDate()+1)

for (let i = iStart; i <= iEnd; i++) {
  // Legg til evt MVA
  if (SONE != "NO4")
  allPrices[i].NOK_per_kWh *= 1.25
  
  // legg til påslag
  allPrices[i].NOK_per_kWh += (PASLAG/100)
  
  // gjør om tll øre
  allPrices[i].NOK_per_kWh *= 100
  
  avgPrice += allPrices[i].NOK_per_kWh
  prices.push(Math.round(allPrices[i].NOK_per_kWh));
    
  if (allPrices[i].NOK_per_kWh < minPrice)
    minPrice = Math.round(allPrices[i].NOK_per_kWh)
   if (allPrices[i].NOK_per_kWh > maxPrice)
     maxPrice = Math.round(allPrices[i].NOK_per_kWh)

  if (i == iNow) {
    colors.push("'yellow'");
    pointsize.push(30);
  }
  else if (MIDNATT && d.getTime() == new Date(allPrices[i].time_start).getTime()) {
    colors.push("'cyan'");
    pointsize.push(30);
  }
  else {
    colors.push("'cyan'");
    pointsize.push(7);
  }
}

  avgPrice = Math.round(avgPrice / prices.length)

// Loop for å lage strek for snittprisen
let dTemp
let avgPrices = []
let labels = []
for (let i = iStart; i <= iEnd; i++) {
  avgPrices.push(avgPrice);
  dTemp = new Date(allPrices[i].time_start)
  let hours = dTemp.getHours();
  labels.push("'" + pad(hours) + "'");
}

let url = "https://quickchart.io/chart?w=2400&h=1200&devicePixelRatio=1.0&c="
url += encodeURI("{ \
   type:'line', \
   data:{ \
      labels:[ \
         " + labels + " \
      ], \
      datasets:[ \
         { \
            label:'Øre pr kWh', \
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
            label:'Snitt (" + avgPrice + " øre)', \
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


// Hent ut pris i øre for inneværende time
let priceOre = Math.round(allPrices[iNow].NOK_per_kWh)

// Opprett widget
async function createWidget() {
  // Create new empty ListWidget instance
  let lw = new ListWidget();

  // Set new background color
  lw.backgroundColor = new Color(BAKGRUNNSFARGE);

  // Man kan ikke styre når widget henter ny pris
  // men, prøver her å be widget oppdatere seg etter 1 min over neste time
  var d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(1);
  // Prøv å oppdater litt senere for å få med morgendagens priser
  if (d.getHours() == 13)
    d.setMinutes(15)
    
  lw.refreshAfterDate = d;

  // Legg til inneværende pris i v.kolonne
  let price = lw.addText("Pris nå: " + priceOre + " øre/kWh");
  price.centerAlignText();
  price.font = Font.lightSystemFont(20);
  // Pris høyere eller lavere enn snitt avgjør farge
  if (priceOre < avgPrice)
    price.textColor = new Color(TEXTFARGE_LAV)
  else if (priceOre > avgPrice)
    price.textColor = new Color(TEXTFARGE_HOY)

  // Legg til dagens "max | min"-timespris
  let maxmin = lw.addText("Min: " + minPrice + " øre/kWh | Max: " + maxPrice + " øre/kWh")
  maxmin.centerAlignText()
  maxmin.font = Font.lightSystemFont(12);
  maxmin.textColor = new Color(TEKSTFARGE);

  // Avstand ned til grafen
  lw.addSpacer(25)


  let overskrift = "Timepriser";
  if (SONE == "NO4")
    overskrift += " (eks MVA)"
  graphTxt = lw.addText(overskrift);
  graphTxt.centerAlignText();
  graphTxt.font = Font.lightSystemFont(16);
  graphTxt.textColor = new Color(TEKSTFARGE);

  lw.addSpacer(10)

  let stackGraph = lw.addStack()
  let imgstack2 = stackGraph.addImage(GRAPH)
  imgstack2.imageSize = new Size(300, 150)
  imgstack2.centerAlignImage()
  stackGraph.setPadding(0, 0, 0, 0)


  // Avstand ned til bunntekst
  lw.addSpacer(30)


  // Legg til info om når widget sist hentet prisen
  d = new Date()
  let hour = d.getHours();
  let min = d.getMinutes();

  let time = lw.addText("Oppdatert: " + pad(hour) + ":" + pad(min));
  time.centerAlignText();
  time.font = Font.lightSystemFont(12);
  time.textColor = new Color(TEKSTFARGE);
  
  lw.addSpacer(5)

  // Legg til "link"
  let link = lw.addText("Datakilde: www.HvaKosterStrømmen.no");
  link.centerAlignText();
  link.font = Font.lightSystemFont(10);
  link.textColor = new Color(TEKSTFARGE);

  // Return the created widget
  return lw;
}

let widget = await createWidget();
let by = "trondheim";
if (SONE == "NO1")
  by = "oslo";
else if (SONE == "NO2")
  by = "kristiansand"
else if (SONE == "NO4")
  by = "tromso"
else if (SONE == "NO5")
  by = "bergen"

widget.url = 'https://www.hvakosterstrommen.no/i/'+by

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