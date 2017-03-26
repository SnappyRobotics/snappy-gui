'use strict';

window.ipc = require('electron').ipcRenderer
window.debug = function(s, s1, s2) {
  console.log(s, s1, s2);
}
