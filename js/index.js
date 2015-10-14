var version = "Dev";

////////// DIALOG \\\\\\\\\\
$(function() {
    var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/");
    var authData = ref.getAuth();
    console.log("authed " + authData);
    if (authData == null) {
        $( "#dialogLogin" ).dialog({
            closeOnEscape: false,
            open: function(event, ui) { $(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
            draggable: false,
            resizable: false,
            autoOpen: true,
            width: 400,
            dialogClass: "dialogInverse",
            modal: true,
            buttons: {
                "Login": function() {
                    var username = document.loginform.username.value;
                    var password = document.loginform.password.value;
                    login(username, password);
                }
            }
        });
    }
});

$(function() {
    $( "#dialogSOSDismiss" ).dialog({
        draggable: false,
        resizable: false,
        autoOpen: false,
        modal: true,
        dialogClass: "dlg-no-close",
        buttons: {
            "Confirm": function() {
                var sosKey = $( this ).data("key");
                console.log("SOSKEY DIALOG: " + sosKey);
                $( this ).dialog( "close" );
            },
            "Cancel": function() {
                $( this ).dialog( "close" );
            }
        }
    });
});

////////// MAIN CODE \\\\\\\\\\
var map;
var viewTrips = true;
var tripMarkers = []; //CREATES ARRAY FOR TRIP MARKERS
var sosMarkers = []; //CREATES ARRAY FOR SOS MARKERS
var tripsToggle = "Disable";

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 0, lng: 0}, //needs a value
        zoom: 2, //zoom level (0-20)
        mapTypeId: google.maps.MapTypeId.HYBRID, //ROADMAP, SATELLITE, HYBRID, TERRAIN
        disableDefaultUI: true
    });
}

function dialogDismissSOS(sosKey) {
    console.log("SOSKEY: " + sosKey);
    $("#dialogSOSDismiss").data("key", sosKey).dialog("open");
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
                callback(sosLocation);
            } else {
                window.alert("No results found.");
            }
        } else {
            window.alert("Geocoder failed due to: " + status);
        }
    });
}

function placeSOSMarker(lat, lon, map, fullname, timestring, sosKey){
    var sosLocation = ""; //set location to blank var before reverse geocode
    var sosKey = sosKey;
    var lat = parseFloat(lat);
    var lon = parseFloat(lon);
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
        var contentString = 
            '<div class="sosInfoWindow">' +
            '<h3><center>SOS Details</center></h3><hr>' + 
            '<p><b>Name: </b>' + name + '</p>' + 
            '<p><b>Location: </b>' + sosLocation + '</p>' + 
            '<p><b>Raised: </b>' + sosDate + '</p>' + 
            '<button class="buttonSOSDismiss" type="button" onclick="dialogDismissSOS(\''+ sosKey +'\')">Dismiss SOS</button>' +
            '</div>';
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
        //CHECK IF DATE IS VALID (TODAY OR LATER)
        //GET TODAY
        var today = new Date();
//        var todayutc = new Date(Date.UTC(today)); //CONVERT TO UTC
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        //SPLIT INTO ARRAY
        var backsplit = back.split("/");
        //SET ARRAY INTO VARS
        var backyear = backsplit[2];
        var backmonth = backsplit[1];
        var backday = backsplit[0];
        var backformatted = new Date(backyear, backmonth-1, backday);
        //SET DATE AS UTC FROM VARS
//        var leaveutc = new Date(Date.UTC(leaveyear, leavemonth, leaveday));
//        var leaveutc = new Date(Date.UTC(leaveobject));
        if (backformatted >= today) {
            console.log("WILL BE SHOWN");
            geocodeTripAddress(geocoder, map, destination, name, leave, back, contact);
            document.getElementById("checkbox").disabled = false;
        } else {
            console.log("WILL NOT BE SHOWN");
        }
        //CONVERTING DATES TO UTC
//        var todayyear = today.getFullYear();
//        var todaymonth = today.getMonth();
//        var todayday = today.getDate();
//        var todayformatted = todayday + "/" + todaymonth + "/" + todayyear;
//        console.log("LEAVE: " + leave);
//        console.log("YEAR: " + todayyear);
//        console.log("MONTH: " + todaymonth);
//        console.log("DAY: " + todayday);
//        console.log("FORMATTED: " + todayformatted);
//        geocodeTripAddress(geocoder, map, destination, name, leave, back, contact);
//        document.getElementById("checkbox").disabled = false;
    });
}

function plotSOS() {
    //connect to firebase sos table
    var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/sos");
    //retrieve sos snapshot
    //IF DISMISSED IS TRUE, IGNORE THAT RECORD
    ref.on('child_added', function(snapshot){
        //IF STATEMENT GOES HERE
        var sos = snapshot.val();
        var sosKey = snapshot.key();
        if (sos.dismissed == "false") {
            var geocoder = new google.maps.Geocoder(); //NEEDED??
            var lat = sos.lat;
            var lon = sos.lon;
            var timestamp = sos.timestamp;
            var timestampconverted = new Date(timestamp * 1000);
            var timestring = timestampconverted.toGMTString();
            var name = sos.name;
            var lastname = sos.lastname;
            var fullname = name + " " + lastname;
            placeSOSMarker(lat, lon, map, fullname, timestring, sosKey, geocodeSOSAddress);
        }
    });
}

function toggleViewTrips() {
    if(viewTrips == true) {
        viewTrips = false;
        tripsToggle = "Enable";
        document.getElementById("tripsToggle").innerHTML = tripsToggle + " Trips";
        console.log("Trips disabled");
        for(i=0; i<tripMarkers.length; i++){
        tripMarkers[i].setMap(null);
        }
    } else {
        viewTrips = true;
        tripsToggle = "Disable";
        document.getElementById("tripsToggle").innerHTML = tripsToggle + " Trips";
        plotTrips();
        console.log("Trips enabled");
    }
}

function dismissSOS(sosKey) {
    console.log("dismissSOS()");
    var key = sosKey;
    console.log("KEY: " + key);
    //CONNECT TO FIREBASE
    var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/sos/" + key);
    //PASS KEY INTO FIREBASE
    ref.on("child_added", function(snapshot) {
        ref.update({ dismissed: "true" });
        location.reload();
    });
}

function logout() {
    //LOGOUT
    console.log("LOGGING OUT");
    ref.unauth();
    location.reload();
}