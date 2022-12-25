const express = require('express')
const app = express()
const cors = require('cors');
const port = 3000

const {point} = require('@turf/helpers');
const distance= require('@turf/distance').default;


app.use(cors())



var lat,lon,radius,key,value
var request = require('request');

const calculateDistance = (data,lat,lon) => {
  for(i=0; i<data.length; i++){
    var from = point([lat,lon]);
    var to = point([data.lat, data.lon]);
    var distance = distance(from, to);
    data[i].distance = distance
  }
  return(data)
}
//generate overpass api query
app.get('/api/:lat/:lon/:radius/:key/:value', async (req, res) => {
  lat = req.params.lat
  lon = req.params.lon
  radius = req.params.radius
  key = req.params.key
  value = req.params.value
  // var query = '[out:json];(node["amenity"="restaurant"]('+lat+','+lon+','+radius+');way["amenity"="restaurant"]('+lat+','+lon+','+radius+');relation["amenity"="restaurant"]('+lat+','+lon+','+radius+'););out body;>;out skel qt;'

  var query = `[out:json];
  (
    node["${key}"~"${value}"](around:${radius},${lat}, ${lon});
  );
  out center;`

  apiURL = 'https://overpass-api.de/api/interpreter?data=' + query
  
  // request(apiURL).pipe(res)

  request(apiURL, async function (error, response, body) {
    let data = JSON.parse(body);
    data = data.elements
    
    // calculate distance
    for(i=0; i<data.length; i++){
      var from = point([lat,lon]);
      var to = point([data[i].lat, data[i].lon]);
      data[i].distance = distance(from, to);
    }

    // convert to geojson
    features = []
    for(i=0; i<data.length; i++){
      data[i].type = "Feature"
      data[i].properties = data[i].tags
      data[i].properties.distance = data[i].distance
      data[i].geometry = {
        "type": "Point",
        "coordinates": [data[i].lon, data[i].lat]
      }
      delete data[i].lat
      delete data[i].lon
      delete data[i].tags
      delete data[i].id
      delete data[i].version
      delete data[i].changeset
      delete data[i].user
      delete data[i].uid
      delete data[i].timestamp
      delete data[i].distance
    }

    let geojson = {"type": "FeatureCollection", "features": data}
    let encodedURI = encodeURIComponent(JSON.stringify(geojson))
    let redirectURI = `http://geojson.io/#data=data:application/json,${encodedURI}`
    res.redirect(redirectURI);

    // res.send(uri)
    // res.send(calculateDistance(lat))
  });


  // res.send(query)
})




app.listen(port, () => {
  // console.log(`app listening on port ${port}`)
})


// import buffer from '@turf/buffer';
// import {point} from '@turf/helpers';





// console.log(buffered)