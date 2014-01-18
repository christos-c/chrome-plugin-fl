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
document.querySelector('#refresh').addEventListener('click', 
		Common.startRequest({showNotification: true}));

