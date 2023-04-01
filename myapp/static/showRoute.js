var directionsRenderer;

var carMarkers = [];

function showRoute(origin, destination, bestSpotLocation0, bestSpotLocation1, bestSpotLocation2) {
  if (!directionsRenderer) {
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
  }

  // Check if a previous route is displayed and clear it
  if (directionsRenderer.getMap()) {
    directionsRenderer.setMap(null);
  }

  carMarkers.forEach(function(marker) { // remove old marker
    marker.setMap(null);
  });
  
  const directionsService = new google.maps.DirectionsService();
  directionsRenderer.setOptions({ suppressMarkers: true });
  directionsRenderer.setMap(map);
  
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING',
  }, function(response, status) {
    if (status === 'OK') {
      directionsRenderer.setDirections(response);
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds);
    } else {
      alert('Directions request failed due to ' + status);
    }
  });
  
  carMarkers = [ // create new marker and push it into array
    new google.maps.Marker({
      position: bestSpotLocation0,
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    }),
    new google.maps.Marker({
      position: bestSpotLocation1,
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    }),
    new google.maps.Marker({
      position: bestSpotLocation2,
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    })
  ];
}



const form = document.getElementById('directions-form');

form.addEventListener('submit', function(event) {
  event.preventDefault();
  
  const startInput = document.getElementById('start-input');
  const destinationInput = document.getElementById('destination-input');
  const startLocation = startInput.value;
  const destinationLocation = destinationInput.value;

  // Convert location names to geographic coordinates using geocoding services
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: startLocation }, function(startResults, startStatus) {
    if (startStatus === 'OK') {
      const startLatLng = startResults[0].geometry.location;
      
      geocoder.geocode({ address: destinationLocation }, function(destinationResults, destinationStatus) {
        if (destinationStatus === 'OK') {
          const destinationLatLng = destinationResults[0].geometry.location;
          
          // Call the function that displays the path here, passing in the latitude and longitude coordinates of the start and end points
          getBestPickupSpot(startLatLng).then(result => { 
            console.log("Best 3 pickup spots:", result);
            const bestSpotLocation0 = { lat: result[0].position.lat, lng: result[0].position.lng };
            const bestSpotLocation1 = { lat: result[1].position.lat, lng: result[1].position.lng };
            const bestSpotLocation2 = { lat: result[2].position.lat, lng: result[2].position.lng };
            showRoute(startLatLng, destinationLatLng, bestSpotLocation0, bestSpotLocation1, bestSpotLocation2);
          }).catch(error => {
            console.error("Error:", error);
          });
        } else {
          alert('Geocode was not successful for the following reason: ' + destinationStatus);
        }
      });
    } else {
      alert('Geocode was not successful for the following reason: ' + startStatus);
    }
  });
});


function getBestPickupSpot(startLatLng) {
  return new Promise((resolve, reject) => {
    const url = "https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey=d630c0ca29bdecff74ec4e2480a0e48fb5f9326f";

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const stations = data.filter(station => station.available_bikes > 0);

        stations.forEach(station => {
          const stationLatitude = station.position.lat;
          const stationLongitude = station.position.lng;
          const earthRadius = 6371; // in kilometers
          const dLat = deg2rad(stationLatitude - startLatLng.lat());
          const dLng = deg2rad(stationLongitude - startLatLng.lng());
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(startLatLng.lat())) * Math.cos(deg2rad(stationLatitude)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = earthRadius * c;
          station.distance = distance;
        });

        const sortedStations = stations.sort((a, b) => (a.distance - b.distance) || (a.number - b.number));

        const bestStations = [];
        for (let i = 0; i < 3; i++) {
          const station = sortedStations[i];
          if (station.number > 0) {
            bestStations.push(station.name);
          }
        }
        if (bestStations.length > 0) {
          resolve(sortedStations.slice(0, 3));
          
        } else {
          resolve([sortedStations[0].name]);
        }
      })
      .catch(error => {
        console.error("Error: Could not retrieve bike network data", error);
        reject("Error: Could not retrieve bike network data");
      });
  });
}
function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}








      
