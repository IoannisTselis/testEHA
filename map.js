let geojsonLayer;
const map = L.map('map').setView([59.33, 18.07], 10);

L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }
).addTo(map);


function getColor(zone){

    switch(zone){
        case "0-10 min":
            return "#228B22";

        case "10-15 min":
            return "#2ECC71";

        case "15-20 min":
            return "#F1C40F";

        case "20-30 min":
            return "#E67E22";

        case ">30 min":
            return "#E74C3C";

        default:
            return "#999999";
    }
} 
function highlightFeature(e){

    const layer = e.target;
    layer.setStyle({

        weight: 3,
        color: "#000",
        fillOpacity: 1

    });
    info.update(layer.feature.properties);

}

function resetHighlight(e){

    geojsonLayer.resetStyle(e.target);
    info.update();

}







const info = L.control();

info.onAdd = function(){

    this._div = L.DomUtil.create('div','info');

    this.update();

    return this._div;

};

info.update = function(props){

    this._div.innerHTML =
        props
        ? `<h4>${props.name}</h4>
           Travel time: ${Number(props.TimeMin).toFixed(1)} min<br>
           Population: ${props.beftotalt}`
        : 'Hover over a box';

};

info.addTo(map);


let allData;

function updateZoneFilter(){
    const selectedZone =
    document.getElementById("ZoneFilter").value;
    geojsonLayer.clearLayers();
    geojsonLayer.addData({
        type: "FeatureCollection",
        features: 
        allData.features.filter(feature => {
            if(selectedZone === "all"){
                return true;
            }
            return feature.properties.Timezone2 === selectedZone;
        })

    })
}

fetch('ExportPoly2.geojson')
  .then(response => response.json())
  .then(data => {
    allData = data;


    geojsonLayer = L.geoJSON(data,{

    style: function(feature){

        return{

            fillColor: getColor(feature.properties.Timezone2),
            color: "#444",
            weight: 0.5,
            fillOpacity: 0.8

        };
    },


      onEachFeature: function(feature, layer) {
layer.on({

    mouseover: highlightFeature,
    mouseout: resetHighlight

});
        layer.bindPopup(`

<h3>${feature.properties.name}</h3>

<b>Travel time:</b> ${Number(feature.properties.TimeMin).toFixed(1)} min<br>

<b>Population:</b> ${feature.properties.beftotalt} people

`);

      }

    });

    geojsonLayer.addTo(map);
    createLayerControl();
    if(hospitalLayer){
        hospitalLayer.bringToFront();
    }

    map.fitBounds(geojsonLayer.getBounds());

  })
  .catch(error => console.error(error));


//Legend skapande
  const legend = L.control({
    position: 'bottomright'
});
//Legend lägg till mapen
 legend.onAdd = function(map){

const div = L.DomUtil.create('div','info legend');

    div.innerHTML =

        '<i style="background:#228B22"></i> 0-10 min<br>' +
        '<i style="background:#2ECC71"></i> 10-15 min<br>' +
        '<i style="background:#F1C40F"></i> 15-20 min<br>' +
        '<i style="background:#E67E22"></i> 20-30 min<br>' +
        '<i style="background:#E74C3C"></i> >30 min';

    return div;

};

legend.addTo(map);


const hospitalIcon = L.icon({
    iconUrl: 'HosIcon.png',
    iconSize: [32,32],
    iconAnchor: [16,32],
    popupAnchor: [0,-32]
});

let hospitalLayer;

fetch('AkutSjukhus.geojson')
.then(response => response.json())
.then(data => {
    hospitalLayer = L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: hospitalIcon
            });
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(`<b>${feature.properties.name}</b>`);
        }

    });
    hospitalLayer.addTo(map);
    createLayerControl();
})
.catch(error => console.error(error));

let layerControl;
function createLayerControl() {
    if (!geojsonLayer|| !hospitalLayer) return;

 const overlays = {
        "Restidszoner": geojsonLayer,
        "Akutsjukhus": hospitalLayer
    };
    L.control.layers(null, overlays, {position: 'bottomleft'}).addTo(map);
}

document
.getElementById("zoneFilter")
.addEventListener("change", updateZoneFilter);
