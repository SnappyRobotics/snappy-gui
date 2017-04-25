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
const unirest = require('unirest')
const is = require('electron-is')
const req = require('req-fast')
const path = require('path')
const url = require('url')
const fs = require('fs')
const os = require('os')

const debug = require('debug')("snappy:gui:mainWindow")

Promise.config({
  // Enable cancellation
  cancellation: true
});

var menuTemplate = [{
    role: 'File'
  }, {
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
      label: 'Open UI',
      accelerator: 'CmdOrCtrl+U',
      click(item, focusedWindow) {

        if (global.snappy_gui.UIWindow.win) {
          debug("Focusing")
          global.snappy_gui.UIWindow.win.focus()
        } else {
          global.snappy_gui.UIWindow.createWindow()
        }
        debug("Opening UI")
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
      icon: path.join(__dirname, '..', '', 'data', 'logo', '512x512.png'),
      width: width,
      height: height,
      center: true,
      show: false
    })

    var u = url.format({
      pathname: global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT,
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

    var getInfo = function() {
      return new Promise(function(resolve, reject) {
        unirest.get("http://" + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/info")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          })
          .end(function(response) {
            resolve(response)
          })
      })
    }
    var getROSstatus = function() {
      debug("getting getROSstatus")
      return new Promise(function(resolve, reject) {
        unirest.get("http://" + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/ros")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            resolve(response)
          })
      })
    }

    var rosBtnClick = function(item, focusedWindow) {
      debug('ROS core Button')
      if (!that.isROSrunning) {
        menuTemplate[3].submenu[0].label = 'starting ROScore'
        menuTemplate[3].submenu[0].enabled = false

        unirest.get("http://" + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/ros/start")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            if (response.error) {
              event.sender.send("ros:error", response.body)
              return
            } else {
              debug("ros-response:", response.body)
              that.isROSrunning = response.body.isRunning
              if (response.body.isRunning) {
                menuTemplate[3].submenu[0].label = 'Stop ROScore'
                menuTemplate[3].submenu[0].enabled = true

                var menu = Menu.buildFromTemplate(menuTemplate)
                that.win.setMenu(menu)
              }
            }
          })
      } else {
        menuTemplate[3].submenu[0].label = 'stopping ROScore'
        menuTemplate[3].submenu[0].enabled = false

        unirest.get("http://" + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/ros/stop")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            if (response.error) {
              event.sender.send("ros:error", response.body)
              return
            } else {
              debug("ros-response:", response.body)
              that.isROSrunning = response.body.isRunning
              if (!response.body.isRunning) {
                menuTemplate[3].submenu[0].label = 'Start ROScore'
                menuTemplate[3].submenu[0].enabled = true

                var menu = Menu.buildFromTemplate(menuTemplate)
                that.win.setMenu(menu)
              }
            }
          })
      }
    }

    getInfo().then(function(response) {
      debug('Loading : ', u)
      debug('info:', response.body)
      that.info = response.body
      that.win.loadURL(u)
      return getROSstatus()
    }).then(function(response) {
      debug("ros-response_init:", response.body)
      that.isROSrunning = response.body.isRunning
      var label = "Start ROScore"
      if (response.body.isRunning) {
        label = 'Stop ROScore'
      }
      return label
    }).then(function(label) {
      if (that.info.isLinux) {
        var x = []

        for (var i = 0; i < 3; i++) {
          x.push(menuTemplate[i])
        }
        x.push({
          label: 'ROS',
          submenu: [{
            label: label,
            accelerator: 'CmdOrCtrl+Alt+R',
            click(item, focusedWindow) {
              return rosBtnClick(item, focusedWindow)
            }
          }]
        })

        for (var i = 3; i < menuTemplate.length; i++) {
          x.push(menuTemplate[i])
        }

        menuTemplate = x
      }
      var menu = Menu.buildFromTemplate(menuTemplate)
      that.win.setMenu(menu)
    })

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
        } else {
          global.snappy_gui.quit()
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
