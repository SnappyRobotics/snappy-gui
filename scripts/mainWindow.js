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
    submenu: [
      /*{
        label: 'New Flow',
        accelerator: 'CmdOrCtrl+N',
        click(item, focusedWindow) {
          debug('New flow')
        }
      }, {
        type: 'separator'
      }, {
        label: 'New Project',
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
            if (res + '' === '0') { //start new Flows Project
              unirest.get(URI + "/flows")
                .headers({
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Node-RED-API-Version': 'v2',
                  'Node-RED-Deployment-Type': 'full'
                })
                .end(function(respo) {
                  debug('respo.body.rev...:', respo.body.rev)
                  if (respo.error) {
                    debug("New Flows Error :", respo.error)
                    return
                  } else {
                    unirest.post(URI + "/flows")
                      .headers({
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Node-RED-API-Version': 'v2',
                        'Node-RED-Deployment-Type': 'full'
                      })
                      .send({
                        "rev": respo.body.rev,
                        "flows": [{
                          "type": "tab",
                          "label": "Flow 1"
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
          })
        }
      },
      {
        label: 'Load Project',
        accelerator: 'CmdOrCtrl+O',
        click(item, focusedWindow) {
          debug('Load flow')
          dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{
              name: 'Snappy Project File',
              extensions: ['snappy']
            }]
          }, function(o) {
            var flows = JSON.parse(fs.readFileSync(o[0]))
            debug('o.......:', o[0])
            dialog.showMessageBox(focusedWindow, {
              "type": "question",
              "buttons": [
                "Continue",
                "Cancel"
              ],
              "defaultId": 1,
              "title": "Are you sure?",
              "message": "Existing deployed flows would be overwritten"
            }, function(res) {
              if (res + '' === '0') {
                debug('Flows:', flows.flows)
                unirest.post(URI + "/flows")
                  .headers({
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Node-RED-API-Version': 'v2',
                    'Node-RED-Deployment-Type': 'full'
                  })
                  // .send(x)
                  .send(flows.flows)
                  .end(function(response) {
                    if (response.error) {
                      debug("load Flows Error :")
                      debug(response.error)
                      debug(response.body)
                      return
                    } else {
                      debug("Output:", response.body)
                      focusedWindow.reload()
                    }
                  })
              }
            })
          })
        }
      },
      {
        label: 'Save Project',
        accelerator: 'CmdOrCtrl+S',
        click(item, focusedWindow) {
          debug('save flows')
          global.snappy_gui.mainWindow.win.webContents.executeJavaScript('window.isDeployed()', function(deployed) {
            debug('isDeployed:', deployed);
            if (!deployed) {
              dialog.showMessageBox(focusedWindow, {
                "type": "question",
                "buttons": [
                  "Discard changes and save",
                  "Cancel"
                ],
                "defaultId": 1,
                "title": "Are you sure?",
                "message": "Do you want to delete Undeployed changes?",
                "detail": "undeployed changes cannot be saved."
              }, function(res) {
                if (res + '' === '0') {
                  global.snappy_gui.mainWindow.saveFlows();
                }
              })
            } else {
              global.snappy_gui.mainWindow.saveFlows();
            }
          })
        }
      }*/
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
        label: 'Open UI',
        accelerator: 'CmdOrCtrl+U',
        click(item, focusedWindow) {

          if (global.snappy_gui.UIWindow.win &&
            !global.snappy_gui.UIWindow.win.isDestroyed()) {
            debug("Focusing")
            global.snappy_gui.UIWindow.win.focus()
          } else {
            global.snappy_gui.UIWindow.createWindow()
          }
          debug("Opening UI")
        }
      },
      {
        label: 'Always connect to same server',
        type: 'checkbox',
        click(item, focusedWindow) {
          if (item.checked) {

            global.snappy_gui.config.same_server = global.snappy_gui.client_IP
          } else {
            global.snappy_gui.config.same_server = null
          }

          global.snappy_gui.saveConfig()
        }
      }
    ]
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

            if (global.snappy_gui.discovery.win === undefined) {
              debug('creating window discovery')
              global.snappy_gui.discovery.createWindow()
              that.win.destroy()

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
      if (response.error.code == 'ECONNREFUSED') {
        var s = new BrowserWindow({
          title: "Snappy Robotics",
          show: false
        })

        that.win.destroy()
        dialog.showMessageBox(s, {
          "type": "error",
          "buttons": [
            "close"
          ],
          "defaultId": 0,
          "title": "No Server found",
          "message": "No server found at " + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT
        }, function(res) {
          process.exit()
        })
      } else {
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
      }
    }).then(function(ol) {
      var hasROSalreadyInMenu = false
      for (var i = 0; i < menuTemplate.length; i++) {
        if (menuTemplate[i].label && menuTemplate[i].label === 'ROS') {
          hasROSalreadyInMenu = true
        }
      }
      if (that.info.hasROS && !hasROSalreadyInMenu) {
        var x = []

        for (var k = 0; k < 3; k++) {
          x.push(menuTemplate[k])
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

      menuTemplate[2].submenu[1].checked = (global.snappy_gui.config.same_server !== null) ? true : false


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

    that.showSaved = function(b) {
      debug('showSaved called')
      /*
      var t = 'Snappy Robotics'

      debug('that.saveFile:', that.saveFile)

      if (that.saveFile !== null) {
        t += ":" + require('path').basename(that.saveFile)
      }

      debug('b', b)

      if (!b) {
        t + ":*****Not Saved*****"
      } else {
        if (that.saveFile !== null) {
          t + ":Saved"
        }
      }
      debug("title is :", t)
      that.win.setTitle(t)
      */
    }

    that.deployedREV = null
    that.onDeploy = function() {
      if (that.saveFile !== null) {
        unirest.get(URI + "/flows")
          .headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Node-RED-API-Version': 'v2',
            'Node-RED-Deployment-Type': 'full'
          })
          .end(function(response) {
            if (response.error) {
              debug("New Flows Error :", response.error)
              return
            } else {
              that.deployedREV = response.body.rev
              if (that.deployedREV != that.lastSavedREV) {
                that.showSaved(false)
              }
            }
          })
      }
    }

    if (!that.mainWindow_listeners_registered) {
      that.mainWindow_listeners_registered = true

      ipcMain.on('mainWindow:onDeploy', that.onDeploy)
    }

    that.saveFile = null
    that.lastSavedREV = null

    that.saveFlows = function() {
      unirest.get(URI + "/flows")
        .headers({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Node-RED-API-Version': 'v2',
          'Node-RED-Deployment-Type': 'full'
        })
        .end(function(response) {
          if (response.error) {
            debug("save Flows Error :", response.error)
            return
          } else {
            // debug("Output:", response.body)
            if (!that.saveFile) {
              dialog.showSaveDialog({
                title: "Save Project",
                defaultPath: '~/Project.snappy',
                filters: [{
                  name: 'Snappy Project file',
                  extensions: ['snappy']
                }]
              }, function(fileName) {
                if (fileName === undefined) {
                  return;
                }

                that.saveFile = fileName
                that.lastSavedREV = response.body.rev

                fs.writeFile(fileName, JSON.stringify(response.body), function(err) {
                  if (err) {
                    debug(err)
                    return
                  }
                  debug('saved')
                })
              })
            }
          }
        })
    }

    that.win.webContents.on('did-finish-load', function() {
      debug('Loaded main Window')
      that.win.show()

      that.showSaved()

      if (global.snappy_gui.discovery.win) {
        global.snappy_gui.discovery.win.close()
        delete global.snappy_gui.discovery.win
      }
    })
  }
}

module.exports = mainWindow
