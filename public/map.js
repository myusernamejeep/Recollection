/*
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
*/
function initialize_map() {

    if(!!navigator.geolocation) {
    
        var map, geocoder;
    
        var mapOptions = {
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
        navigator.geolocation.getCurrentPosition(function(position) {
        
            var geolocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var lat = position.coords.latitude.toFixed(4);
            var lng = position.coords.longitude.toFixed(4);

            var markerPoint = new google.maps.LatLng(lat, lng);

            var marker = new google.maps.Marker({
                position: markerPoint,
                map: map,
                draggable:true,
                animation: google.maps.Animation.DROP,
     
                title: 'Choose Your Place Location'
            });

            google.maps.event.addListener(marker, 'dragend', function() 
            {
                //geocodePosition(marker.getPosition());
                var position = marker.getPosition();   
                console.log(position);
                var lat = position.coords.latitude.toFixed(4);
                var lng = position.coords.longitude.toFixed(4);
                $('#location').val(lat +","+lng);
             
            });
            /*
            function geocodePosition(pos) 
            {
               geocoder = new google.maps.Geocoder();
               geocoder.geocode
                ({
                    latLng: pos
                }, 
                    function(results, status) 
                    {
                        if (status == google.maps.GeocoderStatus.OK) 
                        {
                            $("#mapSearchInput").val(results[0].formatted_address);
                            $("#mapErrorMsg").hide(100);
                        } 
                        else 
                        {
                            $("#mapErrorMsg").html('Cannot determine address at this location.'+status).show(100);
                        }
                    }
                );
            }*/
            /*var infowindow = new google.maps.InfoWindow({
                map: map,
                position: geolocate,
                title: 'Your Location'
                content:
                    '<h1>Adjust Location pinned to your place.</h1>' +
                    '<h2>Latitude: ' + lat + '</h2>' +
                    '<h2>Longitude: ' + lng + '</h2>'
            });*/
            $('#location').val(lat +","+lng);
            map.setCenter(geolocate);
            
        });
        
    } else {
        document.getElementById('map-canvas').innerHTML = 'No Geolocation Support.';
    }
    
}

google.maps.event.addDomListener(window, 'load', initialize_map);