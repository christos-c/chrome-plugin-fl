// Saves options to localStorage.
function save_options() {
  var delay = document.getElementById("delay").value;
  localStorage["delay_time"] = delay;
  //document.getElementById('shim').style.display=
  document.getElementById('msgbx').style.display ="block";
  //To hide
  //document.getElementById('shim').style.display=document.getElementById('msgbx').style.display ="none";
  setTimeout(function() {
	//document.getElementById('shim').style.display=
	document.getElementById('msgbx').style.display ="none";
  }, 1250);
  // Update status to let user know options were saved.
  //var status = document.getElementById("status");
  //status.innerHTML = "Options Saved.";
  //setTimeout(function() {
  //  status.innerHTML = "";
  //}, 1500);
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