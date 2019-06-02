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
      fetch_file();
    } else {
      gapi.auth2.getAuthInstance().signIn();
    }
  }

  // Helper functions ******
  function readCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1,c.length);
          if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
  }

  function is_prod() {
    return "tiddlydrive.github.io" == window.location.hostname
	&& ["/", "", "?", "/?"].indexOf(window.location.pathname) != -1; // Variation for compatibility
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

  function needLegacySrc() {
      return getParameterByName('legacysrc') === 'true' || (typeof InstallTrigger !== 'undefined'); //Is the browser either FireFox or are we forcing legacy support?
  }

  // *****************

  function fetch_file() {
    var state = JSON.parse(getParameterByName('state'));
    if (state == null) {
      $('#loader').hide();
      $('#nofile-msg').show();
      $('#content').hide();
      return;
    }
    gapi.client.drive.files.get({
      'fileId': state.ids.pop(),
      'alt': 'media'
    }).then(function(file){
      if (needLegacySrc()) {
        $('#content')[0].contentWindow.document.open('text/html', 'replace');
        $('#content')[0].contentWindow.document.write(file.body);
        $('#content')[0].contentWindow.document.close();
      } else {
        $('#content')[0].srcdoc=file.body;
      }
      $('#loader').hide();
    }).catch(function(err) {
      $('#loader').hide();
      $('#error-msg').show();
    });
  }

  function saver(text, method, callback, options){
    if ($('#disable-save')[0].checked || !$('#enable-autosave')[0].checked && method === 'autosave') {
      return false;
    }
    var $tw = $('#content')[0].contentWindow.$tw;
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
      var request = gapi.client.request({
        'path': '/upload/drive/v2/files/' + JSON.parse(getParameterByName('state')).ids.pop(),
        'method': 'PUT',
        'params': {'uploadType': 'multipart', 'alt': 'json'},
        'headers': {
          'Content-Type': 'text/html'
        },
        'body': text});
      request.execute(function(res) {
        if (typeof res === 'object' && typeof res.error !== 'object') {
          $tw.saverHandler.numChanges = 0;
          $tw.saverHandler.updateDirtyStatus();
          Materialize.toast("Saved to Drive", 2000);
        } else if (typeof res === 'object' && typeof res.error === 'object') {
          callback(res.error.message);
        } else {
          callback('Unknown error.');
        }
      });
      return true;
    } else {
      callback('Not authorized.');
      return false;
    }
  }


  function setupSaver() {
    var $tw = $('#content')[0].contentWindow.$tw;
    if(typeof($tw) !== "undefined" && $tw && $tw.saverHandler && $tw.saverHandler.savers) {
        $tw.saverHandler.savers.push({
        	info: {
        		name: "tiddly-drive",
        		priority: 5000,
        		capabilities: ["save", "autosave"]
        	},
        	save: saver
        });

        //Set the title
        $('#top-title').text($('#content')[0].contentWindow.document.getElementsByTagName("title")[0].innerText);

        if (!needLegacySrc()) {
            //Watch the title
            $('#content')[0].contentWindow.document.getElementsByTagName("title")[0].addEventListener("DOMSubtreeModified", function(evt) {
                $('#top-title').text(evt.target.innerText);
            }, false);

            //Watch hash
            $(window).on("hashchange",function() {
              console.log("Before parent->child");
            	$('#content')[0].contentWindow.location.hash = location.hash;
              console.log("After parent->child");
            });

            $($('#content')[0].contentWindow).on("hashchange",function() {
              console.log("Before child->parent");
            	location.hash = $('#content')[0].contentWindow.location.hash;
              console.log("After child->parent");
            });
        }

        //Enable hotkey saving
        function save_hotkey(event) {
          if (!(event.which == 115 && event.ctrlKey) && !(event.which == 19) || !$('#enable-hotkey-save')[0].checked) return true;
          var $tw = $('#content')[0].contentWindow.$tw;
          $tw.saverHandler.saveWiki();
          event.preventDefault();
          return false;
        }

        $(window).keypress(save_hotkey);
        $($('#content')[0].contentWindow).keypress(save_hotkey);
    } else {
      setTimeout(setupSaver, 1000);
    }
  }

  setupSaver();
  $('.modal').modal();
  $(document).ready(function(){
    if (!is_prod()) {
      $('#nonprod-warning').modal('open');
    }
    $('ul.tabs').tabs();
    $('ul.tabs').tabs('select_tab', 'options');
  });
  $('#hide-fab').click(function(){
    $('#open-settings').hide();
  });
  $('#auth').click(function() {
    gapi.auth2.getAuthInstance().signIn();
  });

  //Handle checkboxes
  $('#enable-autosave')[0].checked = readCookie('enableautosave') !== 'false';
  $('#enable-autosave').change(function() {
    function createCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    createCookie('enableautosave', this.checked, 364);
  });

  $('#enable-hotkey-save')[0].checked = readCookie('enablehotkeysave') !== 'false';
  $('#enable-hotkey-save').change(function() {
    function createCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    createCookie('enablehotkeysave', this.checked, 364);
  });

  $('#disable-save')[0].checked = readCookie('disablesave') === 'true';
  $('#disable-save').change(function() {
    function createCookie(name,value,days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + value + expires + "; path=/";
    }
    createCookie('disablesave', this.checked, 364);
  });

  if (needLegacySrc()) {
      $('.legacy-mode').show();
  }
})();
