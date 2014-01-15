// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var requestTimerId;
var requestTimeout = 1000 * 2;  // 2 seconds
var delay = 10;

function isGameUrl(url) {
	return url.indexOf(getGameUrl()) == 0;
}

function getGameUrl() {
	return 'http://fallenlondon.storynexus.com/Gap/Load?content=%2fStorylet%2fAvailable';
}

if (oldChromeVersion) {
  updateIcon();
  onInit();
} else {
  chrome.runtime.onInstalled.addListener(onInit);
  chrome.alarms.onAlarm.addListener(onAlarm);
}

function onInit() {
  console.log('onInit');
  localStorage.requestFailureCount = 0;  // used for exponential backoff
  startRequest({scheduleRequest:true});
  if (!oldChromeVersion) {
    // TODO(mpcomplete): We should be able to remove this now, but leaving it
    // for a little while just to be sure the refresh alarm is working nicely.
    chrome.alarms.create('watchdog', {periodInMinutes:5});
  }
}

function scheduleRequest() {
  console.log('scheduleRequest');
  console.log('Scheduling for: ' + delay);

  if (oldChromeVersion) {
    if (requestTimerId) {
      window.clearTimeout(requestTimerId);
    }
    requestTimerId = window.setTimeout(onAlarm, delay*60*1000);
  }
  else {
    console.log('Creating alarm');
    // Use a repeating alarm so that it fires again if there was a problem
    // setting the next alarm.
    chrome.alarms.create('refresh', {periodInMinutes: delay});
  }
}

function startRequest(params) {
	console.log('Statring request');
  // Schedule request immediately. We want to be sure to reschedule, even in the
  // case where the extension process shuts down while this request is
  // outstanding.
  if (params && params.scheduleRequest) scheduleRequest();

  getActionCount(
    function(count) {
		updateIcon(count);
    },
	function() {
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

function getActionCount(onSuccess, onError) {
	console.log('Getting action count...');
	var xhr = createCORSRequest('GET', getGameUrl());
	var abortTimerId = window.setTimeout(function() {
		xhr.abort();  // synchronously calls onreadystatechange
	}, requestTimeout);

	function handleSuccess(count) {
		window.clearTimeout(abortTimerId);
		if (onSuccess)
			onSuccess(count);
	}

	var invokedErrorCallback = false;
	function handleError() {
		window.clearTimeout(abortTimerId);
		if (onError && !invokedErrorCallback)
			onError();
		invokedErrorCallback = true;
	}

	xhr.onload = function() {
		if (xhr.responseText) {
			var response = xhr.responseText;
			var actions = response.match('<span id="infoBarCurrentActions">([0-9]*)?</span>')[1];
			if (actions) {
				handleSuccess(actions);
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

function updateIcon(count) {
	console.log('Actions: ' + count);
	if (count == 0)
		chrome.browserAction.setBadgeText({text: ''});
	else
	chrome.browserAction.setBadgeText({text: count});
}

function onAlarm(alarm) {
  console.log('Got alarm', alarm);
  // |alarm| can be undefined because onAlarm also gets called from
  // window.setTimeout on old chrome versions.
  if (alarm && alarm.name == 'watchdog') {
    onWatchdog();
  } else {
    startRequest({scheduleRequest:true});
  }
}

function onWatchdog() {
  chrome.alarms.get('refresh', function(alarm) {
    if (alarm) {
      console.log('Refresh alarm exists. Yay.');
    } else {
      console.log('Refresh alarm doesn\'t exist!? ' +
                  'Refreshing now and rescheduling.');
      startRequest({scheduleRequest:true});
    }
  });
}

if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(function() {
    console.log('Starting browser... updating icon.');
    startRequest({scheduleRequest:false});
    updateIcon();
  });
} else {
  // This hack is needed because Chrome 22 does not persist browserAction icon
  // state, and also doesn't expose onStartup. So the icon always starts out in
  // wrong state. We don't actually use onStartup except as a clue that we're
  // in a version of Chrome that has this problem.
  chrome.windows.onCreated.addListener(function() {
    console.log('Window created... updating icon.');
    startRequest({scheduleRequest:false});
    updateIcon();
  });
}

chrome.browserAction.onClicked.addListener(goToGame);

function goToGame() {
  console.log('Going to game...');
  chrome.tabs.getAllInWindow(undefined, function(tabs) {
    for (var i = 0, tab; tab = tabs[i]; i++) {
      if (tab.url && isGameUrl(tab.url)) {
        console.log('Found Game tab: ' + tab.url + '. ' +
                    'Focusing and refreshing count...');
        chrome.tabs.update(tab.id, {selected: true});
        startRequest({scheduleRequest:false});
        return;
      }
    }
    console.log('Could not find Game tab. Creating one...');
    chrome.tabs.create({url: getGameUrl()});
	startRequest({scheduleRequest:true});
  });
}