'use strict';

const electron = require('electron')
const {
  app,
  dialog,
  ipcMain,
  session,
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

    debug("Applying token :", global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT])

    session
      .defaultSession
      .webRequest
      .onBeforeSendHeaders(function(details, callback) {
        details.requestHeaders['x-access-token'] = global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
        callback({
          cancel: false,
          requestHeaders: details.requestHeaders
        })
      })

    session
      .defaultSession
      .webRequest
      .onCompleted(function(details) {
        if (details.statusCode != 200) {
          debug("WebRequest session : ", details)
          if (details.statusCode == 403) {
            dialog.showMessageBox(that.win, {
              "type": "error",
              "buttons": [
                "OK"
              ],
              "defaultId": 0,
              "title": "Authentication failed",
              "message": "Error! Problem logging in"
            })
            if (global.snappy_gui.discovery.win == null) {
              global.snappy_gui.discovery.createWindow()
            }
            that.win.destroy()
          }
        }
      })

    session
      .defaultSession
      .webRequest
      .onErrorOccurred(function(details) {
        debug("Error occurred in web request session", details)
      })

    debug('Loading : ', u)
    that.win.loadURL(u)


    that.win.on('close', function(e) {
      debug("Closing... mainWindow")
      that.win.webContents.executeJavaScript('window.isDeployed()', function(deployed) {
        debug('isDeployed:', deployed);
        if (!deployed) {
          dialog.showMessageBox(that.win, {
            "type": "question",
            "buttons": [
              "Close without saving",
              "Cancel"
            ],
            "defaultId": 1,
            "title": "Unsaved changes",
            "message": "Do you want to discard the changes you made?",
            "detail": "Check the blue dots on the nodes for unsaved changes"
          }, function(res) {
            if (res + '' === '0') { //Close without saving
              debug("Dont want to save, hence closing")
              that.win.destroy()
            } else {
              debug("Preventing default for closing")
              e.preventDefault()
            }
          })
        }
      });
    })

    that.win.on('unresponsive', function() {
      debug("unresponsive... mainWindow")
    })

    that.win.webContents.on('did-finish-load', function() {
      debug('Loaded main Window')
      that.win.show()

      if (global.snappy_gui.discovery.win) {
        global.snappy_gui.discovery.win.close()
        delete global.snappy_gui.discovery.win
      }
    })
  }
}
module.exports = mainWindow
