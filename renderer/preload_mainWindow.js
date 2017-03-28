require('./preload.js')

window.myOnWindowLoad = function() {
  require('./postLoad_mainWindow.js')
}
