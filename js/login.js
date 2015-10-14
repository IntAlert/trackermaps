var ref = new Firebase("https://crackling-fire-1447.firebaseio.com/");
ref.onAuth(authDataCallback);

function authHandler(error, authData) {
    if (error) {
        console.log("Login Failed!", error);
    } else {
        console.log("Authenticated successfully:", authData);
        $( "#dialogLogin" ).dialog( "close" );
//        document.getElementById("checkbox").disabled = false;
        plotTrips();
        plotSOS();
    }
}

function login(username, password) {
    ref.authWithPassword({
        email    : username,
        password : password
    }, authHandler);
}

// Create a callback which logs the current auth state
function authDataCallback(authData) {
    if (authData) {
        console.log("User " + authData.uid + " is logged in with " + authData.provider);
        authHandler();
        //NOTHING
    }
}