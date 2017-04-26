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

var URI = ""
const debug = require('debug')("snappy:gui:mainWindow")

Promise.config({
  // Enable cancellation
  cancellation: true
});

var menuTemplate = [{
    label: 'File',
    submenu: [{
      label: 'New Flow',
      accelerator: 'CmdOrCtrl+N',
      click(item, focusedWindow) {
        debug('New flow')
      }
    }, {
      label: 'New Flows Project',
      accelerator: 'CmdOrCtrl+Shift+N',
      click(item, focusedWindow) {
        debug('New flows')
        dialog.showMessageBox(focusedWindow, {
          "type": "question",
          "buttons": [
            "DELETE deployed Flows",
            "Cancel"
          ],
          "defaultId": 1,
          "title": "Are you sure?",
          "message": "Existing deployed flows would be cleaned and a new flow would be created",
          "detail": "Are you sure ?"
        }, function(res) {

          debug("Done ....", res)
          if (res + '' === '0') { //start new Flows Project
            unirest.post(URI + "/flows")
              .headers({
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Node-RED-API-Version': 'v2',
                'Node-RED-Deployment-Type': 'full'
              })
              .send({
                "flows": [{
                  "type": "tab",
                  "label": "Sheet 1"
                }]
              })
              .end(function(response) {
                if (response.error) {
                  debug("New Flows Error :", response.error)
                  return
                } else {
                  debug("Output:", response.body)
                  focusedWindow.reload()
                }
              })
          }
        })
      }
    }, {
      label: 'Open Flow',
      accelerator: 'CmdOrCtrl+O',
      click(item, focusedWindow) {
        debug('Open flow')
      }
    }, {
      type: 'separator'
    }, {
      label: 'Save Flow',
      accelerator: 'CmdOrCtrl+S',
      click(item, focusedWindow) {
        debug('save flow')
      }
    }, {
      label: 'Save All',
      click(item, focusedWindow) {
        debug('save all')
      }
    }]
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

    URI = "http://" + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT

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
        unirest.get(URI + "/info")
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
        unirest.get(URI + "/ros")
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
    var rosBootBtnClick = function(item, focusedWindow) {
      debug('ROS boot Button')
      if (!that.isROSBootRunning) {
        menuTemplate[3].submenu[2].label = 'setting ROS on boot'
        menuTemplate[3].submenu[2].enabled = false

        unirest.get(URI + "/ros/boot/on")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            debug("ros-boot-response:", response.body)

            global.snappy_gui.mainWindow.isROSBootRunning = response.body.onBoot

            menuTemplate[3].submenu[2].label = 'Run ROS on boot'
            menuTemplate[3].submenu[2].enabled = true
            menuTemplate[3].submenu[2].checked = global.snappy_gui.mainWindow.isROSBootRunning

            var menu = Menu.buildFromTemplate(menuTemplate)
            that.win.setMenu(menu)
          })
      } else {
        menuTemplate[3].submenu[2].label = 'removing ROS on boot'
        menuTemplate[3].submenu[2].enabled = false

        unirest.get(URI + "/ros/boot/off")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            debug("ros-boot-response:", response.body)

            global.snappy_gui.mainWindow.isROSBootRunning = response.body.onBoot
            menuTemplate[3].submenu[2].label = 'Run ROS on boot'
            menuTemplate[3].submenu[2].enabled = true
            menuTemplate[3].submenu[2].checked = global.snappy_gui.mainWindow.isROSBootRunning

            var menu = Menu.buildFromTemplate(menuTemplate)
            that.win.setMenu(menu)
          })
      }
    }

    var rosBtnClick = function(item, focusedWindow) {
      debug('ROS core Button')
      if (!global.snappy_gui.mainWindow.isROSrunning) {
        menuTemplate[3].submenu[0].label = 'starting ROScore'
        menuTemplate[3].submenu[0].enabled = false

        unirest.get(URI + "/ros/start")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            debug("ros-response:", response.body)
            global.snappy_gui.mainWindow.isROSrunning = response.body.isRunning
            if (response.body.isRunning) {
              menuTemplate[3].submenu[0].label = 'Stop ROScore'
              menuTemplate[3].submenu[0].enabled = true

              var menu = Menu.buildFromTemplate(menuTemplate)
              that.win.setMenu(menu)
            }
          })
      } else {
        menuTemplate[3].submenu[0].label = 'stopping ROScore'
        menuTemplate[3].submenu[0].enabled = false

        unirest.get(URI + "/ros/stop")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-access-token': global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]
          })
          .end(function(response) {
            debug("ros-response:", response.body)
            global.snappy_gui.mainWindow.isROSrunning = response.body.isRunning
            if (!response.body.isRunning) {
              menuTemplate[3].submenu[0].label = 'Start ROScore'
              menuTemplate[3].submenu[0].enabled = true

              var menu = Menu.buildFromTemplate(menuTemplate)
              that.win.setMenu(menu)
            }
          })
      }
    }

    getInfo().then(function(response) {
      debug('Loading : ', URI)
      debug('info:', response.body)
      that.info = response.body
      that.win.loadURL(URI)
      return getROSstatus()
    }).then(function(response) {
      debug("ros-response_init:", response.body)
      global.snappy_gui.mainWindow.isROSrunning = response.body.isRunning
      global.snappy_gui.mainWindow.isROSBootRunning = response.body.onBoot

      var checked = response.body.onBoot

      var label = "Start ROScore"
      if (response.body.isRunning) {
        label = 'Stop ROScore'
      }
      return {
        label: label,
        checked: checked
      }
    }).then(function(ol) {
      if (that.info.hasROS) {
        var x = []

        for (var i = 0; i < 3; i++) {
          x.push(menuTemplate[i])
        }
        x.push({
          label: 'ROS',
          submenu: [{
              label: ol.label,
              accelerator: 'CmdOrCtrl+Alt+R',
              click(item, focusedWindow) {
                return rosBtnClick(item, focusedWindow)
              }
            },
            {
              type: 'separator'
            },
            {
              label: 'Run ROScore on boot',
              type: 'checkbox',
              checked: ol.checked,
              click(item, focusedWindow) {
                return rosBootBtnClick(item, focusedWindow)
              }
            }
          ]
        })

        for (var j = 3; j < menuTemplate.length; j++) {
          x.push(menuTemplate[j])
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
