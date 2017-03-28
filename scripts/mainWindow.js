'use strict';

const {
  app,
  dialog,
  ipcMain,
  BrowserWindow
} = require('electron')


const Promise = require('bluebird')
const req = require('req-fast')
const path = require('path')
const url = require('url')
const fs = require('fs')
const os = require('os')

const debug = require('debug')("snappy:gui:mainWindow")

Promise.config({
  // Enable warnings
  warnings: true,
  // Enable long stack traces
  longStackTraces: true,
  // Enable cancellation
  cancellation: true,
  // Enable monitoring
  monitoring: true
});

var mainWindow = {
  createWindow: function() {
    var that = this

    that.myWin.setSize(500, 400, true)
    that.myWin.setResizable(true)
    that.myWin.setMovable(true)
    that.myWin.setMaximizable(true)
    that.myWin.setMinimizable(true)
    that.myWin.setFullScreenable(true)
    that.myWin.setClosable(true)
    that.myWin.setAlwaysOnTop(false)
    that.myWin.center()
    that.myWin.maximize()
    that.myWin.setProgressBar(-1)
    that.myWin.setMenuBarVisibility(true)
    that.myWin.setTitle("Snappy Robotics")

    debug("Building coreWin")

    var u = url.format({
      pathname: global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/red",
      protocol: 'http:',
      slashes: true
    })

    debug(u)
    that.myWin.loadURL(u)

    that.myWin.webContents.on('did-finish-load', function() {
      debug('Loaded content')
    })

    debug('Loading')
  }
}
module.exports = mainWindow
