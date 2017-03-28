'use strict';

const electron = require('electron')
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
    var that = mainWindow

    debug("createWindow of mainWindow")

    if (!global.snappy_gui.client_IP) {
      global.snappy_gui.client_IP = '127.0.0.1'
    }

    const {
      width,
      height
    } = electron.screen.getPrimaryDisplay().workAreaSize

    that.win = new BrowserWindow({
      title: "Snappy Robotics",
      webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'renderer', "preload_mainWindow.js")
      },
      width: width,
      height: height,
      center: true,
      show: false
    })

    var u = url.format({
      pathname: global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/red",
      protocol: 'http:',
      slashes: true
    })

    debug('Loading : ', u)
    that.win.loadURL(u)

    that.win.on('closed', function() {
      debug("Closed mainWindow")
    })

    that.win.on('close', function(e) {
      debug("Closing... mainWindow")
    })


    that.win.on('unresponsive', function() {
      debug("unresponsive... mainWindow")
    })

    that.win.onbeforeunload = function(e) {
      debug('I do not want to be closed')
    }

    that.win.webContents.on('did-finish-load', function() {
      debug('Loaded main Window')
      that.win.show()
      if (global.snappy_gui.discovery.win) {
        global.snappy_gui.discovery.win.close()
        delete global.snappy_gui.discovery.win
      }
      // that.win.maximize()
    })
  }
}
module.exports = mainWindow
