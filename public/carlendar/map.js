function initialize_map() {
    var loc = {};
    var geocoder = new google.maps.Geocoder();
    if(google.loader.ClientLocation) {
        loc.lat = google.loader.ClientLocation.latitude;
        loc.lng = google.loader.ClientLocation.longitude;

        var latlng = new google.maps.LatLng(loc.lat, loc.lng);
        geocoder.geocode({'latLng': latlng}, function(results, status) {
            if(status == google.maps.GeocoderStatus.OK) {
                console.log('formatted_address', results[0]['formatted_address']);
                console.log('results', results[0]);
            };
        });
 
        $('#location').val(loc.lat+","+loc.lng);
    }
}

google.load("maps", "3.x", {other_params: "sensor=false", callback:initialize_map});