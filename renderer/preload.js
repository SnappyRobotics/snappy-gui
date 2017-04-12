'use strict';

window.ipc = require('electron').ipcRenderer
window.remote = require('electron').remote

require('electron-compile/lib/initialize-renderer')
  .initializeRendererProcess(
    window
    .remote
    .getGlobal('globalCompilerHost')
    .readOnlyMode
  )

// if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
//   window.electronRequire = require
// }

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
