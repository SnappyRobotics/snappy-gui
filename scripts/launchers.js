"use strict";

const url = require('url')
const path = require('path')
const debug = require('debug')("snappy:gui:launchers")

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')

var launchers = {
  init: function() {
    var that = launchers

    that.app = app
    that.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        that.app.quit()
      }
    })

    that.app.on('ready', that.discovery)
    that.app.on('activate', () => {
      if (that.discoveryWin === null) {
        that.discovery()
      }
    })
  },
  discovery: function() {
    var that = launchers

    that.discoveryWin = new BrowserWindow({
      name: "Discovery",
      title: "Discovery",
      frame: true,
      resizable: true,
      width: 600,
      height: 400,
      show: false
    })

    that.discoveryWin.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'renderer', 'discovery.html'),
      protocol: 'file:',
      slashes: true
    }))

    // Chrome developer tools
    // win.webContents.openDevTools({
    //   // detach: true
    // });
    that.discoveryWin.on('closed', () => {
      that.discoveryWin = null
    })

    const discover = require(path.join(__dirname, "..", "main_process", 'discover'));

    that.discoveryWin.webContents.on('did-finish-load', function() {
      setTimeout(function() {
        that.discoveryWin.show();
      }, 40)
    })

    ipcMain.on('start_core', function(event, arg) {
      global.snappy_gui.core = require('snappy-core')

      setTimeout(function() {
        debug("Calling connect core to local core")
        ipcMain.emit("connect_core", "127.0.0.1")
      }, 100)
    })

    ipcMain.on('connect_core', function(event, arg) {
      global.snappy_gui.client_IP = arg
      that.progress_connecting()
    })
  },
  progress_connecting: function() {
    var that = launchers

    that.progressWin = new BrowserWindow({
      name: "Connecting",
      title: "Connecting",
      frame: false,
      resizable: false,
      width: 230,
      height: 160,
      transparent: true,
      'node-integration': true,
      show: true
    })

    that.progressWin.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'renderer', 'progress_connecting.html'),
      protocol: 'file:',
      slashes: true
    }))

    // Chrome developer tools
    // that.progressWin.webContents.openDevTools({
    //   detach: true
    // });

    that.progressWin.on('closed', () => {
      that.progressWin = null
    })

    that.progressWin.webContents.on('did-finish-load', function() {
      that.discoveryWin.close()
    })

    ipcMain.on('cancel_loading_core', function(event, arg) {
      that.progressWin.close()
    })
  }
}

module.exports = launchers
