'use strict';

const {
  app,
  dialog,
  ipcMain,
  BrowserWindow
} = require('electron')


const Promise = require('bluebird')
const unirest = require('unirest')
const req = require('req-fast')
const path = require('path')
const url = require('url')
const fs = require('fs')
const os = require('os')

const debug = require('debug')("snappy:gui:discovery")

Promise.config({
  // Enable cancellation
  cancellation: true
});

var discovery = {
  quit: function() {
    global.snappy_gui.quit()
  },
  createWindow: function() {
    var that = discovery
    that.win = new BrowserWindow({
      name: "Discovery",
      webPreferences: {
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'renderer', "preload.js")
      },
      icon: path.join(__dirname, '..', '', 'data', 'logo', '512x512.png'),
      show: false
    })
    that.win.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'renderer', 'discovery.html'),
      protocol: 'file:',
      slashes: true
    }))


    if (!that.win_listeners_registered) {
      that.discoveryWin()
      that.win_listeners_registered = true

      that.win.webContents.on('did-finish-load', function() {
        debug("loaded win with discovery")
        if (!that.win.isVisible()) {
          that.win.show()
        }
      })
    }
  },
  discoveryWin: function() {
    var that = discovery

    that.win.setContentSize(600, 400)
    that.win.setResizable(true)
    that.win.setMovable(true)
    that.win.setMaximizable(true)
    that.win.setMinimizable(true)
    that.win.setFullScreenable(false)
    that.win.setClosable(true)
    that.win.setAlwaysOnTop(false)
    that.win.center()
    that.win.setProgressBar(0)
    that.win.setMenuBarVisibility(false)
    that.win.setTitle("Discovery")

    // Chrome developer tools
    // win.webContents.openDevTools({
    //   // detach: true
    // });

    if (!that.discovery_listeners_registered) {
      that.discovery_listeners_registered = true

      ipcMain.on('discovery:start_core', that.start_core)

      ipcMain.on('discovery:connect_core', that.connect_core)

      ipcMain.on('discovery:start_scanning', that.start_scanning)

      ipcMain.on('discovery:stop_scanning', that.stop_scanning)

      that.win.on('close', function(e) {
        debug("Closing... discovery")

        e.preventDefault();

        var x = []
        if (that.allPromises) {
          x.push(that.allPromises.cancel())
        }
        if (that.forcedLocalPromise) {
          x.push(that.forcedLocalPromise.cancel())
        }
        var q = Promise.all(x)
        q.then(function() {
          debug("done closing all promises...")
          that.win.destroy()
        })
      })
    }
  },
  start_core: function(event, arg) {
    var that = discovery

    that.progress_connecting()
    setTimeout(function() {

      that.isPortTaken(function(err, ans) {
        if (ans) {
          that.cancel_login = true

          if (that.allPromises) {
            that.allPromises.cancel()
          }
          if (that.forcedLocalPromise) {
            that.forcedLocalPromise.cancel()
          }

          that.forcedLocalPromise = discovery.ping('127.0.0.1'); // force check localhost
          event.sender.send("discovery:searching", '127.0.0.1')
          that.forcedLocalPromise.then(function(ip) {
            if (ip.found) {
              debug("Found Device at :", ip.ip)
              event.sender.send("discovery:scan_done", [ip.ip])
            }
          }).catch(console.log.bind(console))

          dialog.showMessageBox(that.win, {
            "type": "error",
            "buttons": [
              "OK"
            ],
            "defaultId": 0,
            "title": "uncaughtException Error",
            "message": "Error! Port already in use :" + global.snappy_gui.client_PORT
          }, function() {
            that.discoveryWin()
            event.sender.send("discovery:cancel_start_core")

            if (that.allPromises) {
              that.allPromises.cancel()
            }
          })
        } else {
          that.cancel_login = false

          global.snappy_gui.core = require('snappy-core')
          global.snappy_gui.client_IP = '127.0.0.1'

          global.snappy_gui.core.start().then(function() {
            debug("local core started")

            if (that.allPromises) {
              that.allPromises.cancel()
            }
            if (that.forcedLocalPromise) {
              that.forcedLocalPromise.cancel()
            }
          }).catch(console.log.bind(console))
        }
      })
    }, 500)
  },
  stop_scanning: function(event, arg) {
    var that = discovery
    debug("stopping scanning")

    if (that.allPromises) {
      that.allPromises.cancel()
    }
    if (that.forcedLocalPromise) {
      that.forcedLocalPromise.cancel()
    }
  },
  connect_core: function(event, arg) {
    var that = discovery
    debug("received connect_core ipc event")

    that.cancel_login = false

    that.progress_connecting()

    debug("Connecting to IP:", arg)

    setTimeout(function() {
      if (that.allPromises) {
        that.allPromises.cancel()
      }
      if (that.forcedLocalPromise) {
        that.forcedLocalPromise.cancel()
      }
      global.snappy_gui.client_IP = arg
    }, 500)
  },
  progress_connecting: function() {
    var that = discovery

    debug("progress connecting")
    that.win.setContentSize(200, 150)
    that.win.setResizable(false)
    that.win.setMovable(false)
    that.win.setMaximizable(false)
    that.win.setMinimizable(false)
    that.win.setFullScreenable(false)
    that.win.setClosable(false)
    that.win.setAlwaysOnTop(true)
    that.win.center()
    that.win.setProgressBar(2, 'indeterminate')
    that.win.setMenuBarVisibility(false)
    that.win.setTitle("Connecting")

    ipcMain.on('cancel_connecting', function(event, arg) {
      that.cancel_login = true
      that.quit()
    })

    setTimeout(function() {
      if (!that.cancel_login) {
        that.loginForm()
      }
    }, 3000);
  },
  loginForm: function() {
    var that = discovery

    if (global.snappy_gui.config.token && global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT]) {
      debug("Found saved token")
      global.snappy_gui.mainWindow.createWindow()
    } else {
      debug("showing loginForm")
      that.win.setContentSize(240, 340)
      that.win.setResizable(false)
      that.win.setMovable(true)
      that.win.setMaximizable(false)
      that.win.setMinimizable(true)
      that.win.setFullScreenable(false)
      that.win.setClosable(true)
      that.win.setAlwaysOnTop(false)
      that.win.center()
      that.win.setProgressBar(0)
      that.win.setMenuBarVisibility(false)
      that.win.setTitle("Login")

      that.win.webContents.send('login:loaded')

      if (!that.login_listeners_registered) {
        that.login_listeners_registered = true

        that.win.webContents.on('did-finish-load', function() {
          debug("loaded win with discovery:loginForm")
        })

        ipcMain.on('discovery:cancel_login', function(event, arg) {
          that.quit()
        })

        ipcMain.on('discovery:login', function(event, arg) {
          unirest.post("http://" + global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT + "/login")
            .headers({
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            })
            .send(arg)
            .end(function(response) {
              if (response.error) {
                event.sender.send("login:error", response.body)
                return
              } else {
                if (response.body.success) {
                  if (!global.snappy_gui.config.token) {
                    global.snappy_gui.config.token = {}
                  }
                  global.snappy_gui.config.token[global.snappy_gui.client_IP + ":" + global.snappy_gui.client_PORT] = response.body.token

                  if (arg.toSaveCheckBox) {
                    global.snappy_gui.saveConfig()
                  }
                  //event.sender.send("login:success")

                  global.snappy_gui.mainWindow.createWindow()
                }
              }
            });
        })
      }
    }
  },
  start_scanning: function(event, arg) {
    var that = discovery

    debug("autoscan started")
    that.getRange().then(function(range) {
      var ar = []
      var retAr = []
      range.unshift("127.0.0.1") //------------ adding localhost to first
      for (var i = 0; i < range.length; i++) {
        var promise = that.ping(range[i]);
        promise.then(function(ip) {
          event.sender.send("discovery:searching", ip.ip)
          if (ip.found) {
            debug("Found Device at :", ip.ip)
            retAr.push(ip.ip)
            event.sender.send("discovery:devices", retAr)
          }
        }).catch(console.log.bind(console))
        ar.push(promise)
      }

      that.allPromises = Promise.all(ar)
      return that.allPromises
        .then(function(ot) {
          debug("Scanning complete")
          event.sender.send("discovery:scan_done", retAr)
        })
        .catch(function() {
          debug("Scanning completed with some error")
          event.sender.send("discovery:scan_done", [])
        })
    }).catch(console.log.bind(console))
  },
  ips: function() {
    return new Promise(function(resolve, reject, onCancel) {
      onCancel(function() {
        resolve([])
      })
      var interfaces = os.networkInterfaces()
      var addresses = []
      for (var k in interfaces) {
        if (interfaces.hasOwnProperty(k)) {
          for (var k2 in interfaces[k]) {
            if (interfaces[k].hasOwnProperty(k2)) {
              var address = interfaces[k][k2]
              if (address.family === 'IPv4' && !address.internal) {
                addresses.push({
                  address: address.address,
                  netmask: address.netmask
                })
              }
            }
          }
        }
      }
      if (process.env.CI) {
        debug("Detected CI : ", process.env.CI)
        for (var i = 0; i < addresses.length; i++) {
          addresses[i].netmask = "255.255.255.255";
        }
      }
      if (process.env.NODE_ENV === 'test') { // Add IP series for testing
        addresses.push({
          address: '192.168.108.1',
          netmask: '255.255.255.0'
        })
      }

      debug("Network Interfaces :", addresses)
      resolve(addresses)
    })
  },
  getRange: function() {
    return new Promise(function(resolve, reject, onCancel) {
      onCancel(function() {
        resolve([])
      })
      discovery.ips().then(function(addresses) {
        var ar = []
        for (var i = 0; i < addresses.length; i++) {
          const Netmask = require('netmask').Netmask;
          var block = new Netmask(addresses[i].address + "/" + addresses[i].netmask)
          block.forEach(function(ip, long, index) {
            if (addresses[i].address != ip) { // remove local node..
              ar.push(ip)
            }
          })
        }
        resolve(ar)
      }).catch(console.log.bind(console))
    })
  },
  autoScan: function() {
    var retAr = []
    return new Promise(function(resolve, reject, onCancel) {
      return discovery.getRange().then(function(range) {
        var ar = []
        for (var i = 0; i < range.length; i++) {
          ar.push(discovery.ping(range[i]))
        }
        ar.push(discovery.ping("127.0.0.1")) //------------ adding localhost

        var p = Promise.all(ar)

        onCancel(function() {
          p.cancel()
        })
        p.then(function(ot) {
            for (var i = 0; i < ot.length; i++) {
              if (ot[i].found) {
                retAr.push(ot[i].ip)
              }
            }
            debug("Scanning complete")
            resolve(retAr)
          })
          .catch(console.log.bind(console))
          .finally(function() {
            resolve([])
          })
      }).catch(console.log.bind(console))
    })
  },
  ping: function(ip) {
    return new Promise(function(resolve, reject, onCancel) {
      var rs = req({
        uri: "http://" + ip + ":" + global.snappy_gui.client_PORT + "/info",
        agent: "",
        headers: {
          'accept': 'application/json',
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      }, function(err, resp) {
        if (err) {
          resolve({
            ip: ip,
            found: false
          })
          return
        }
        if (resp.body.snappy) {
          debug("Valid node at :", ip)
          resolve({
            ip: ip,
            found: true
          })
        } else {
          debug("Invalid node at :", ip)
          resolve({
            ip: ip,
            found: false
          })
        }
      })
      onCancel(function() {
        rs.abort()
      })
    })
  },
  isPortTaken: function(fn) {
    var net = require('net')
    var tester = net.createServer()
      .once('error', function(err) {
        if (err.code != 'EADDRINUSE') {
          return fn(err)
        }

        debug("Error! Port already in use :", global.snappy_gui.client_PORT)
        fn(null, true)
      })
      .once('listening', function() {
        tester.once('close', function() {
            fn(null, false)
          })
          .close()
      })
      .listen(global.snappy_gui.client_PORT)
  }
}

module.exports = discovery
