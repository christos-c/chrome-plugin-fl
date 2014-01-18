var Common = (function() { 
	return {
		startRequest: function(params) {
			console.log('Statring request');
			if (params && params.showNotification)
				document.getElementById('msgRefresh').style.display ="block";
			// We'll hide it after request is done
			Common.getActionCount(
				function(response) {
					if (params && params.showNotification)
						document.getElementById('msgRefresh').style.display ="none";
					console.log('Request success');
					Common.updateIcon(response);
				},
				function() {
					if (params && params.showNotification) {
						document.getElementById('msgRefresh').style.display ="none";
						document.getElementById('msgRefreshFail').style.display ="block";
						setTimeout(function() {
							document.getElementById('msgRefreshFail').style.display ="none";
						}, 1250);
					}
					console.log('Error during request');
					Common.updateIcon();
				}
			);
		},

		createCORSRequest:function(method, url) {
			var xhr = new XMLHttpRequest();
			if ("withCredentials" in xhr) {
				xhr.open(method, url, true);
			} else {
				// CORS not supported.
				xhr = null;
			}
			return xhr;
		},

		isGameUrl:function(url) {
			return url.indexOf(Common.getGameUrl()) == 0;
		},

		getGameUrl:function() {
			return 'http://fallenlondon.storynexus.com/Gap/Load?content=%2fStorylet%2fAvailable';
		},
		
		goToGame:function() {
			console.log('Going to game...');
			chrome.tabs.getAllInWindow(undefined, function(tabs) {
				for (var i = 0, tab; tab = tabs[i]; i++) {
					if (tab.url && Common.isGameUrl(tab.url)) {
						console.log('Found Game tab: ' + tab.url + '. ' +
						'Focusing and refreshing count...');
						chrome.tabs.update(tab.id, {selected: true});
						startRequest({scheduleRequest:false});
						return;
					}
				}
				console.log('Could not find Game tab. Creating one...');
				chrome.tabs.create({url: Common.getGameUrl()});
				Common.startRequest();
			});
		},

		getActionCount:function(onSuccess, onError) {
			console.log('Getting action count...');
			var xhr = this.createCORSRequest('GET', Common.getGameUrl());
	
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
		},

		updateIcon:function(response) {
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
	};
})();