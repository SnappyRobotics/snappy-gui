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

const debug = require('debug')("snappy:gui:discovery")

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

var discovery = {
  quit: function() {
    global.snappy_gui.quit()
  },
  createWindow: function() {
    var that = discovery

    that.win = new BrowserWindow({
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

    that.win.loadURL(url.format({
      pathname: path.join(__dirname, '..', 'renderer', 'discovery.html'),
      protocol: 'file:',
      slashes: true
    }))

    // Chrome developer tools
    // win.webContents.openDevTools({
    //   // detach: true
    // });

    that.win.webContents.on('did-finish-load', function() {
      debug("loaded win with discovery")
      that.win.show()
    })

    ipcMain.on('discovery:start_core', that.start_core)

    ipcMain.on('discovery:connect_core', that.connect_core)

    ipcMain.on('discovery:start_scanning', that.start_scanning)
  },
  start_core: function(event, arg) {
    var that = discovery
    require(path.join(__dirname, 'discovery.js'))
    that.isPortTaken(function(err, ans) {
      if (ans) {
        event.sender.send("discovery:cancel_start_core")

        that.forcedLocalPromise = discovery.ping('127.0.0.1'); // force check localhost
        that.forcedLocalPromise.then(function(ip) {
          event.sender.send("discovery:searching", ip.ip)
          if (ip.found) {
            debug("Found Device at :", ip.ip)
            event.sender.send("discovery:devices", [ip.ip])
          }
        })

        dialog.showMessageBox(that.win, {
          "type": "error",
          "buttons": [
            "OK"
          ],
          "defaultId": 0,
          "title": "uncaughtException Error",
          "message": "Error! Port already in use :" + global.snappy_gui.client_PORT
        })
      } else {
        global.snappy_gui.core = require('snappy-core')
        global.snappy_gui.core.start().then(function() {
          debug("local core started")

          debug("Connecting to IP:", arg)

          if (that.allPromises) {
            that.allPromises.cancel()
          }
          if (that.forcedLocalPromise) {
            that.forcedLocalPromise.cancel()
          }

          global.snappy_gui.client_IP = '127.0.0.1'
          that.progress_connecting()
        })
      }
    })
  },
  connect_core: function(event, arg) {
    var that = discovery
    debug("received connect_core ipc event")

    debug("Connecting to IP:", arg)

    if (that.allPromises) {
      that.allPromises.cancel()
    }
    if (that.forcedLocalPromise) {
      that.forcedLocalPromise.cancel()
    }

    global.snappy_gui.client_IP = arg
    that.progress_connecting()
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

    ipcMain.on('cancel_loading_core', function(event, arg) {
      that.quit()
    })

    setTimeout(function() {
      global.snappy_gui.mainWindow.createWindow()
      // that.core_view()
    }, 2000);
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
        })
        ar.push(promise)
      }

      that.allPromises = Promise.all(ar)
      that.allPromises
        .then(function(ot) {
          debug("Scanning complete")
          event.sender.send("discovery:scan_done", retAr)
        })
        .catch(function() {
          debug("Scanning completed with some error")
          event.sender.send("discovery:scan_done", [])
        })
    })
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
      })
    })
  },
  autoScan: function() {
    var retAr = []
    return new Promise(function(resolve, reject, onCancel) {
      discovery.getRange().then(function(range) {
        var ar = []
        for (var i = 0; i < range.length; i++) {
          ar.push(discovery.ping(range[i]))
        }
        ar.push(discovery.ping("127.0.0.1")) //------------ adding localhost

        var p = Promise.all(ar)

        onCancel(function() {
          p.cancel()
        })
        p
          .then(function(ot) {
            for (var i = 0; i < ot.length; i++) {
              if (ot[i].found) {
                retAr.push(ot[i].ip)
              }
            }
            debug("Scanning complete")
            resolve(retAr)
          })
          .finally(function() {
            resolve([])
          })
      })
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
