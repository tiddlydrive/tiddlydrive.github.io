(function(){
  // Client ID and API key from the Developer Console
  var CLIENT_ID = '292510858390-7md8cr4332ppas1hcoccj7g1j24i9iqg.apps.googleusercontent.com';
  var API_KEY = 'AIzaSyD93IWoZl51SrV2h9K336iUnRzZCP-0GPA';

  // Array of API discovery doc URLs for APIs used by the quickstart
  var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  var SCOPES = 'https://www.googleapis.com/auth/drive.file';


  /**
   *  On load, called to load the auth2 library and API client library.
   */
  window.handleClientLoad = function() {
    gapi.load('client:auth2', initClient);
  }

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  function initClient() {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
  }

  /**
   *  Called when the signed in status changes, to update the UI
   *  appropriately. After a sign-in, the API is called.
   */
  function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
      alert("signed in");
      fetch_file();
    } else {
      alert("not signed in");
      gapi.auth2.getAuthInstance().signIn();
    }
  }

  function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function fetch_file() {
      gapi.client.drive.files.get({
          'fileId': JSON.parse(getParameterByName('state')).ids.pop(),
          'alt': 'media'
      }).then(function(file){
      document.getElementById('content').srcdoc=file.body;
    });
  }

  function saver(text, method, callback, options){
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      console.log(text);
      return true;
    } else {
      callback('Not authorized.');
      return false;
    }
  }


  if(typeof($tw) !== "undefined" && $tw) {
    if($tw.saverHandler && $tw.saverHandler.savers) {
      $tw.saverHandler.savers.push({
      	info: {
      		name: "tiddly-chrome",
      		priority: 5000,
      		capabilities: ["save", "autosave"]
      	},
      	save: saver
      });
    } else {
      setTimeout(addSaver, 1000);
    }
  }
})();
