// Set up the Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoiYWthbm9yayIsImEiOiJjbGVvMmt6M3cwNTQzM3pvNGl0bG9sbGs4In0.w29H-qMBfTJGYmwC4EQarA';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-6.26735, 53.344],
    zoom: 12
});

map.addControl(
    new MapboxDirections({
        accessToken: mapboxgl.accessToken
    }),
    'top-left'
);

APIKEY="534bc23767749c9092ddc16b51fe73fc4758c7ce";

fetch('http://127.0.0.1:5000/api/bike-stations')
    .then(response => response.json())
    .then(data => {
        data.forEach(station => {
        const el = document.createElement('div');
        el.className = 'marker';

        const marker = new mapboxgl.Marker(el)
            .setLngLat([station.position.lng, station.position.lat])
            .addTo(map);

        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
            <h3>${station.name}</h3>
            <p>Available Bikes: ${station.available_bikes}</p>
            <p>Available Bike Stands: ${station.available_bike_stands}</p>
            `);

        marker.setPopup(popup);
        });
    })
    .catch(error => console.log('Error:', error));