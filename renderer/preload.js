'use strict';

if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
  window.electronRequire = require
}

window.ipc = window.electronRequire('electron').ipcRenderer

window.debug = function(s, s1, s2) {
  if (s1) {
    if (s2) {
      console.log(s, s1, s2);
    } else {
      console.log(s, s1);
    }
  } else {
    console.log(s);
  }
}
