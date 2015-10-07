////////// DIALOG \\\\\\\\\\
$(function() {
    $( "#dialogLogin" ).dialog({
        autoOpen: true,
        width: 400,
        modal: true,
        buttons: {
            "Login": function() {
                //LOGIN();
                $( this ).dialog( "close" );
            }
        }
    });
});

$(function() {
    $( "#dialogSOSDismiss" ).dialog({
        autoOpen: false,
        modal: true,
        dialogClass: "dlg-no-close",
        buttons: {
            "Confirm": function() {
                $( this ).dialog( "close" );
                console.log("YES");
                dismissSOS();
            },
            "Cancel": function() {
                $( this ).dialog( "close" );
                console.log("NO");
            }
        }
    });
});

////////// MAIN CODE \\\\\\\\\\
var map;
var viewTrips = true;
var tripMarkers = []; //CREATES ARRAY FOR TRIP MARKERS
var sosMarkers = []; //CREATES ARRAY FOR SOS MARKERS
window.onload = plotTrips();
window.onload = plotSOS();

function initMap() {    
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0}, //needs a value
        zoom: 2, //zoom level (0-20)
        mapTypeId: google.maps.MapTypeId.HYBRID, //ROADMAP, SATELLITE, HYBRID, TERRAIN
        disableDefaultUI: true
    });
}

function geocodeTripAddress(geocoder, resultsMap, destination, name, leave, back, contact) {
    var address = destination;
    geocoder.geocode({'address': address}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            var pinColour = "008177";
            var tripMarkerIcon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColour);
            var tripMarker = new google.maps.Marker({
                map: resultsMap,
                position: results[0].geometry.location,
                icon: tripMarkerIcon,
                title: name + " : " + destination,
                animation: google.maps.Animation.DROP //BOUNCE, DROP
            });
            tripMarkers.push(tripMarker); //PUSHES TRIP MARKER INTO ARRAY
            var contentString = '<h3><center>Trip Details</center></h3><hr>' + '<p><b>Name: </b>' + name + '</p>' + '<p><b>Destination: </b>' + destination + '<p>' + '<p><b>Date: </b>' + leave + ' - ' + back + '<p>' + '<p><b>Contact: </b>' + contact + '</p>';
            tripMarker.info = new google.maps.InfoWindow({
                content: contentString,
            });
            tripMarker.info.opened = false;
            tripMarker.addListener('click', function() {
                if(tripMarker.info.opened) {
                    tripMarker.info.close();
                    tripMarker.info.opened = false;
                } else {
                    tripMarker.info.open(map, tripMarker);
                    tripMarker.info.opened = true;
                }
            });
            google.maps.event.addListener(tripMarker.info, 'closeclick', function(){
                tripMarker.info.opened = false;
            });
            google.maps.event.addListener(map, 'click', function(event) {
                tripMarker.info.close();
                tripMarker.info.opened = false;
            });
        } else {
            alert('Geocode was not successful: ' + status);
        }
    });   
}

function geocodeSOSAddress(geocoder, map, coords, callback) {
//    reverse geocode lat/lon coords to give rough location on sos marker.
    var address = coords;
    geocoder.geocode({'location': coords}, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            console.log(status);
            console.log(google.maps.GeocoderStatus.OK);
            if (results[1]) {
                sosLocation = results[1].formatted_address;
                console.log("Location: " + sosLocation);
                callback(sosLocation);
            } else {
                window.alert("No results found.");
            }
        } else {
            window.alert("Geocoder failed due to: " + status);
        }
    });
}

function placeSOSMarker(lat, lon, map, fullname, timestring){
    var sosLocation = ""; //set location to blank var before reverse geocode
    console.log(sosLocation);
    var lat = parseFloat(lat);
    console.log("lat: " + lat);
    var lon = parseFloat(lon);
    console.log("lon: " + lon);
    var coords = {lat: lat, lng: lon};
    var name = fullname;
    var sosDate = timestring;
    var geocoder = new google.maps.Geocoder();
    geocodeSOSAddress(geocoder, map, coords, function(sosLocation){
        console.log("SOS Loc: " + sosLocation);
        var pinColour = "e71837";
        var sosMarkerIcon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColour);
        var sosMarker = new google.maps.Marker({
            map: map,
            position: coords,
            icon: sosMarkerIcon,
            title: name + " : " + sosLocation,
            animation: google.maps.Animation.BOUNCE //BOUNCE, DROP
        });
        var contentString = '<h3><center>SOS Details</center></h3><hr>' + '<p><b>Name: </b>' + name + '</p>' + '<p><b>Email: </b>' + "EMAIL" + '</p>' + '<p><b>Location: </b>' + sosLocation + '</p>' + '<p><b>Raised: </b>' + sosDate + '</p>' + '<button class="buttonSOSDismiss"  type="button" onclick="dialogDismissSOS()">Dismiss SOS</button>';
        sosMarker.info = new google.maps.InfoWindow({
            content: contentString,
        });
        sosMarker.info.opened = false;
        sosMarker.addListener('click', function() {
            if(sosMarker.info.opened) {
                sosMarker.info.close();
                sosMarker.info.opened = false;
            } else {
                sosMarker.info.open(map, sosMarker);
                sosMarker.info.opened = true;
            }
        });
        google.maps.event.addListener(sosMarker.info, 'closeclick', function(){
            sosMarker.info.opened = false;
        });
        google.maps.event.addListener(map, 'click', function(event) {
            sosMarker.info.close();
            sosMarker.info.opened = false;
        });
    });
}

function plotTrips() {
    var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/trips");
    ref.on('child_added', function(snapshot){
        var geocoder = new google.maps.Geocoder();
        var trip = snapshot.val();
        console.log(trip);
        var destination = trip.destination;
        var name = trip.name + " " + trip.lastname;
        console.log("NAME: " + name);
        var leave = trip.leave;
        var back = trip.back;
        var contact = trip.contactlastname;
        //generate info popup
//        tripInfo(name, destination, leave, back, contact);
        //feed countries into geocoder
        geocodeTripAddress(geocoder, map, destination, name, leave, back, contact);
    });
}

function plotSOS() {
    //connect to firebase sos table
    var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/sos");
    //retrieve sos snapshot
    ref.on('child_added', function(snapshot){
        var geocoder = new google.maps.Geocoder(); //NEEDED??
        var sos = snapshot.val();
        var lat = sos.lat;
        var lon = sos.lon;
        var timestamp = sos.timestamp;
        var timestampconverted = new Date(timestamp * 1000);
        var timestring = timestampconverted.toGMTString();
        var name = sos.name;
        var lastname = sos.lastname;
        var fullname = name + " " + lastname;
        placeSOSMarker(lat, lon, map, fullname, timestring, geocodeSOSAddress);
    });
}

function toggleViewTrips() {
    if(viewTrips == true) {
        viewTrips = false;
        console.log("Trips disabled");
        for(i=0; i<tripMarkers.length; i++){
        tripMarkers[i].setMap(null);
        };
    } else {
        viewTrips = true;
        plotTrips();
        console.log("Trips enabled");
    }
}

function dismissSOS() {    
    //CONNECT TO FIREBASE
//    var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/sos");
    //PASS KEY INTO FIREBASE
//    ref.orderByKey().on('child_added', function(snapshot) {
    //    if(dismissed === false) {
        //    dismiss = true;
        //    sosMarkers.setMap(null);
        //    sosMarkers = [];
//    }
}

function dialogDismissSOS() {
    console.log("opening dialog");
    $("#dialogSOSDismiss").dialog("open");
}

function loginInit() {
    //SHOW DIALOG WITH LOGIN FIELDS
    //ON SUBMIT, RUN LOGIN SUBMIT(USER, PASS)
}

function loginSubmit(USER, PASS) {
    //VALIDATE LOGIN INFORMATION
    //IF SUCCESSFUL {
        //LOAD MARKERS
    //} ELSE {
        //FAILURE MESSAGE
        //DONT LOAD MARKERS
    //}
}