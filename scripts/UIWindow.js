'use strict';

const electron = require('electron')
const {
  app,
  Menu,
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

const debug = require('debug')("snappy:gui:UIWindow")

Promise.config({
  // Enable cancellation
  cancellation: true
});


const menuTemplate = [{
    label: 'Edit',
    submenu: [{
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: 'copy'
      },
      {
        role: 'paste'
      },
      {
        role: 'pasteandmatchstyle'
      },
      {
        role: 'delete'
      },
      {
        role: 'selectall'
      }
    ]
  },
  {
    label: 'View',
    submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.reload()
          }
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        }
      },

      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    label: 'Server',
    submenu: [{
      label: 'Switch to Editor',
      accelerator: 'CmdOrCtrl+U',
      click(item, focusedWindow) {

        if (global.snappy_gui.mainWindow.win) {
          debug("Focusing")
          global.snappy_gui.mainWindow.win.focus()
        } else {
          global.snappy_gui.mainWindow.createWindow()
        }
        debug("Switching back to mainWindow")
      }
    }]
  },
  {
    role: 'window',
    submenu: [{
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'help',
    submenu: [{
      label: 'Learn More',
      click() {
        require('electron').shell.openExternal('http://snappyrobotics.github.io')
      }
    }]
  }
]

var UIWindow = {
  createWindow: function() {
    var that = UIWindow

    debug("createWindow of UIWindow")

    if (!global.snappy_gui.client_IP) {
      global.snappy_gui.client_IP = '127.0.0.1'
    }

    const {
      width,
      height
    } = electron.screen.getPrimaryDisplay().workAreaSize

    that.win = new BrowserWindow({
      title: "UI:Snappy Robotics",
      webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'renderer', "preload_UIWindow.js")
      },
      width: width,
      height: height,
      center: true,
      show: false
    })

    const menu = Menu.buildFromTemplate(menuTemplate)
    that.win.setMenu(menu)

    var u = url.format({
      pathname: global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/api/ui",
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
            delete global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
            global.snappy_gui.saveConfig()

            debug("Old Token exists, deleting that token and starting login")

            if (!global.snappy_gui.discovery.win) {
              global.snappy_gui.discovery.createWindow()

              dialog.showMessageBox(global.snappy_gui.discovery.win, {
                "type": "error",
                "buttons": [
                  "close"
                ],
                "defaultId": 0,
                "title": "Token Expired",
                "message": "Your login session expired!",
                "detail": "You need to reconnect"
              }, function(res) {
                debug("Done ....", res)
                that.win.destroy()
                global.snappy_gui.discovery.discoveryWin()
                global.snappy_gui.discovery.win.show()
              })
            } else {
              that.win.destroy()
              global.snappy_gui.discovery.loginForm()
            }
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

    that.win.on('unresponsive', function() {
      debug("unresponsive... UIWindow")
    })

    that.win.webContents.on('did-finish-load', function() {
      debug('Loaded UI Window')
      that.win.show()
    })
  }
}
module.exports = UIWindow
