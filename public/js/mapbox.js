

export const displayMap = (locations) =>{
     mapboxgl.accessToken =
  'pk.eyJ1IjoiYW1ydXRhLXNwZWN0YSIsImEiOiJjbXB1d2cwam0wbHZjMnNzZnJpcnUwdXp0In0.VyXrCVpdP4Ui_LAUPe7WvA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/amruta-specta/cmpuyxu35001401sa4t9wgyr3',
  scrollZoom:false
//   center: [-71.06776, 42.35816],

//   interactive:false
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
    //Create marker

    const el = document.createElement('div');
    el.className='marker'

    //Add Marker
    new mapboxgl.Marker({
        element:el,
        anchor:'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    new mapboxgl.Popup({
        offset:40,
   
    }).setLngLat(loc.coordinates).setHTML(`<p> Day ${loc.day}:${loc.description}</p>`).addTo(map)
    //Exyend map bounds to include curent location
    bounds.extend(loc.coordinates)
})

map.fitBounds(bounds,
    {
        padding:150,
        duration:0
    }
);

}

 