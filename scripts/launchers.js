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
  quit: function() {
    var that = launchers
    if (process.platform !== 'darwin') {
      that.app.quit()
    }
  },
  init: function() {
    var that = launchers

    that.app = app
    that.app.on('window-all-closed', () => {
      that.quit()
    })

    that.app.on('ready', that.discovery)
    that.app.on('activate', () => {
      if (that.myWin === null) {
        that.discovery()
      }
    })
  },
  discovery: function() {
    var that = launchers

    that.myWin = new BrowserWindow({
      name: "Discovery",
      title: "Discovery",
      frame: true,
      resizable: true,
      width: 600,
      height: 400,
      webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'renderer', "preload.js")
      },
      show: false
    })

    that.myWin.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'renderer', 'discovery.html'),
      protocol: 'file:',
      slashes: true
    }))

    // Chrome developer tools
    // win.webContents.openDevTools({
    //   // detach: true
    // });
    that.myWin.on('closed', () => {
      that.quit()
    })

    const discover = require(path.join(__dirname, "..", "main_process", 'discover'));

    that.myWin.webContents.on('did-finish-load', function() {
      setTimeout(function() {
        that.myWin.show();
      }, 40)
    })


    ipcMain.on('connect_core', function(event, arg) {
      if (arg == '127.0.0.1') {
        global.snappy_gui.core = require('snappy-core')

        global.snappy_gui.core.start().then(function() {
          debug("Calling connect core to local core")

        })
      }

      debug("Connecting to IP:", arg)

      global.snappy_gui.client_IP = arg
      that.progress_connecting()
    })
  },
  progress_connecting: function() {
    var that = launchers
    //that.myWin.setSize(230, 160, true)
    that.myWin.setContentSize(200, 150)
    that.myWin.setResizable(false)
    that.myWin.setMovable(false)
    that.myWin.setMaximizable(false)
    that.myWin.setMinimizable(false)
    that.myWin.setFullScreenable(false)
    that.myWin.setClosable(false)
    that.myWin.setAlwaysOnTop(true)
    that.myWin.center()
    that.myWin.setProgressBar(2, 'indeterminate')
    that.myWin.setMenuBarVisibility(false)
    that.myWin.setTitle("Connecting")

    ipcMain.on('cancel_loading_core', function(event, arg) {
      that.quit()
    })

    setTimeout(function() {
      that.core_view()
    }, 2000);
  },
  core_view: function() {
    var that = launchers
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

module.exports = launchers
