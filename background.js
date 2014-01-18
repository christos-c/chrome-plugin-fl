// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var requestTimerId;
var requestTimeout = 1000 * 2;  // 2 seconds
var delay = parseInt(localStorage["delay_time"]);
if (!delay) delay = 5;

if (chrome.runtime && chrome.runtime.onStartup) {
	chrome.runtime.onStartup.addListener(function() {
		console.log('Starting browser... updating icon.');
		startRequest({scheduleRequest:false});
		Common.updateIcon();
	});
} else {
	// This hack is needed because Chrome 22 does not persist browserAction icon
	// state, and also doesn't expose onStartup. So the icon always starts out in
	// wrong state. We don't actually use onStartup except as a clue that we're
	// in a version of Chrome that has this problem.
	chrome.windows.onCreated.addListener(function() {
		console.log('Window created... updating icon.');
		startRequest({scheduleRequest:false});
		Common.updateIcon();
	});
}

chrome.browserAction.onClicked.addListener(Common.goToGame);

if (oldChromeVersion) {
	Common.updateIcon();
	onInit();
} else {
	chrome.runtime.onInstalled.addListener(onInit);
	chrome.alarms.onAlarm.addListener(onAlarm);
}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (Common.isGameUrl(tab.url) && changeInfo.status == 'complete') {
	  console.log('Player logged-in. Refreshing...');
	  Common.startRequest();
  }
});

function onInit() {
	console.log('onInit');
	localStorage.requestFailureCount = 0;  // used for exponential backoff
	startRequest({scheduleRequest:true});
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

// Overloaded version used for scheduling
function startRequest(params) {
	console.log('Statring request');
	// Schedule request immediately. We want to be sure to reschedule, even in the
	// case where the extension process shuts down while this request is
	// outstanding.
	if (params && params.scheduleRequest) scheduleRequest();

	Common.getActionCount(
		function(response) {
			console.log('Request success');
			Common.updateIcon(response);
		},
		function() {
			console.log('Error during request');
			Common.updateIcon();
		}
	);
}

function onAlarm(alarm) {
	console.log('Got alarm', alarm);
	startRequest({scheduleRequest:true});
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