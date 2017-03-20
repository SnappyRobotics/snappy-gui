'use strict';

const {
  app,
  BrowserWindow
} = require('electron')

const path = require('path')
const url = require('url')

function createWindow(file, width, height) {
  var win = new BrowserWindow({
    width: width,
    height: height
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer', file),
    protocol: 'file:',
    slashes: true
  }))

  // Chrome developer tools
  win.webContents.openDevTools({
    detach: true
  });

  win.on('closed', () => {
    win = null
  })
  return win
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

let launchWin

function createLaunch() {
  launchWin = createWindow("discovery.html", 300, 200)
}

app.on('ready', createLaunch)
app.on('activate', () => {
  if (launchWin === null) {
    createLaunch()
  }
})
