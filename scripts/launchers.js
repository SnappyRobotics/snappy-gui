"use strict";

const url = require('url')
const path = require('path')
const debug = require('debug')("snappy:gui:launchers")

const {
  app,
  dialog,
  ipcMain,
  BrowserWindow
} = require('electron')

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

var launchers = {
  quit: function() {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  },
  init: function() {
    var that = this

    app.on('window-all-closed', () => {
      that.quit()
    });
    app.on('before-quit', function() {
      debug("before quit")
      that.before_quit = true
    });


    app.on('activate', () => {
      if (!that.myWin) {
        that.discovery()
      }
    });

    app.on('ready', () => {
      that.discovery()
    });
  },
  discovery: function() {
    var that = this

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
    that.myWin.on('closed', function() {
      debug("Closed window")
      //  that.quit()
    })

    that.myWin.on('close', function(e) {
      debug("Closing... window")
      /*setTimeout(function() {
        if (!that.before_quit) {
          dialog.showMessageBox(that.myWin, {
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
            if (res == 0) { //Close without saving
              process.exit(0)
            } else {
              return false
            }
          })
        }
      }, 500);
      e.preventDefault();*/
    })

    that.myWin.on('unresponsive', function() {
      debug("unresponsive... window")
    })

    that.myWin.onbeforeunload = (e) => {
      debug('I do not want to be closed')

      // Unlike usual browsers that a message box will be prompted to users, returning
      // a non-void value will silently cancel the close.
      // It is recommended to use the dialog API to let the user confirm closing the
      // application.
      //e.returnValue = false
    }

    const discover = require(path.join(__dirname, "..", "main_process", 'discover'));

    that.myWin.webContents.on('did-finish-load', function() {
      debug("loaded mainWin with discovery")
      that.myWin.show()
    })


    ipcMain.on('start_core', function(event, arg) {
      require(path.join(__dirname, 'discovery.js'))
      /*.ping('127.0.0.1')
      .then(function(ip) {
        debug(ip)
        if (!ip.found) {*/
      global.snappy_gui.core = require('snappy-core')

      global.snappy_gui.core.start().then(function() {
        debug("local core started")

        global.snappy_gui.client_IP = '127.0.0.1'
        that.progress_connecting()
      })
      /*  } else {
          debug("Already running core found on local system, connecting that")
          global.snappy_gui.client_IP = '127.0.0.1'
          that.progress_connecting()
        }
      })*/
    })
    ipcMain.on('connect_core', function(event, arg) {
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

module.exports = launchers
