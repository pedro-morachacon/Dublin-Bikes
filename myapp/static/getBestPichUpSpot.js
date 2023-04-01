// function getBestPickupSpot(startLocation) {
//     // Define the URL for the API endpoint
//     const url = "https://api.jcdecaux.com/vls/v1/stations?contract=dublin&apiKey=d630c0ca29bdecff74ec4e2480a0e48fb5f9326f";
  
//     // Make a GET request to the API endpoint
//     fetch(url)
//       .then(response => response.json())
//       .then(data => {
//         // Get all stations
//         const stations = data;
  
//         //Calculate the distance between user location and each station
//         stations.forEach(station => {
//           const stationLatitude = station.position.lat;
//           const stationLongitude = station.position.lng;
//           const distance = ((stationLatitude - startLocation.llatitude) ** 2 + (stationLongitude - startLocation.longitude) ** 2) ** 0.5;
//           station.distance = distance;
//         });
  
//         // Sort stations by distance and available bikes
//         const sortedStations = stations.sort((a, b) => (a.distance - b.distance) || (a.number - b.number));
  
//         // Return the closest stations with available bikes
//         const bestStations = [];
//         for (let i = 0; i < 3; i++) {
//           const station = sortedStations[i];
//           if (station.number > 0) {
//             bestStations.push(station.name);
//           }
//         }
//         if (bestStations.length > 0) {
//           return bestStations;
//         } else {
//           // If no station with available bikes found, return the closest station
//           return [sortedStations[0].name];
//         }
//       })
//       .catch(error => {
//         // If request failed, return an error message
//         console.error("Error: Could not retrieve bike network data", error);
//         return ["Error: Could not retrieve bike network data"];
//       });
//   }
  
// //   Example usage
//   const latitude = 20.2082;
//   const longitude = 10.3738;
//   console.log("Best 3 pickup spots:", getBestPickupSpot(latitude,longitude));
  

  