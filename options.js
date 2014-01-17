// Saves options to localStorage.
function save_options() {
  var delay = document.getElementById("delay").value;
  localStorage["delay_time"] = delay;
  document.getElementById('msgSaved').style.display ="block";
  //To hide
  setTimeout(function() {
	document.getElementById('msgSaved').style.display ="none";
  }, 1250);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  var delay = localStorage["delay_time"];
  if (!delay) {
    return;
  }
  var delay = document.getElementById("delay").value = delay;
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#refresh').addEventListener('click', startRequest);

// REPLICATED CODE FROM background.js SINCE I DON'T KNOW OF A BETTER WAY
function startRequest() {
	console.log('Statring request');
    document.getElementById('msgRefresh').style.display ="block";
	// We'll hide it after request is done
	getActionCount(
		function(response) {
			document.getElementById('msgRefresh').style.display ="none";
			console.log('Request success');
			updateIcon(response);
		},
		function() {
			document.getElementById('msgRefresh').style.display ="none";
			document.getElementById('msgRefreshFail').style.display ="block";
			setTimeout(function() {
				document.getElementById('msgRefreshFail').style.display ="none";
			}, 1250);
			console.log('Error during request');
			updateIcon();
		}
	);
}

function createCORSRequest(method, url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		xhr.open(method, url, true);
	} else {
		// CORS not supported.
		xhr = null;
	}
	return xhr;
}

function isGameUrl(url) {
	return url.indexOf(getGameUrl()) == 0;
}

function getGameUrl() {
	return 'http://fallenlondon.storynexus.com/Gap/Load?content=%2fStorylet%2fAvailable';
}

function getActionCount(onSuccess, onError) {
	console.log('Getting action count...');
	var xhr = createCORSRequest('GET', getGameUrl());
	
	function handleSuccess(response) {
		if (onSuccess)
			onSuccess(response);
	}

	var invokedErrorCallback = false;
	function handleError() {
		if (onError && !invokedErrorCallback)
			onError();
		invokedErrorCallback = true;
	}

	xhr.onload = function() {
		if (xhr.responseText) {
			var response = xhr.responseText;
			if (response) {
				handleSuccess(response);
				return;
			}
		}
		handleError();
	};

	xhr.onerror = function(error) {
		handleError();
	};

	xhr.send();
}

function updateIcon(response) {
	if (!response || !response.match('<span id="infoBarCurrentActions">([0-9]*)?</span>')) {
		//Need to login
		chrome.browserAction.setTitle({title: 'Fallen London: Not logged in! Click here.'});
		chrome.browserAction.setBadgeText({text: ''});
		chrome.browserAction.setIcon({path: 'hat-logo-inactive-19.png'});
	}
	else {
		var count = response.match('<span id="infoBarCurrentActions">([0-9]*)?</span>')[1];
		console.log('Actions: ' + count);
		chrome.browserAction.setTitle({title: 'Fallen London: '+count+' available actions.'});
		chrome.browserAction.setIcon({path: 'hat-logo-active-19.png'});
		if (count == 0)
			chrome.browserAction.setBadgeText({text: ''});
		else
			chrome.browserAction.setBadgeText({text: count});
	}
}