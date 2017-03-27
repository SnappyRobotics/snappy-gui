'use strict';

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')


const req = require('req-fast')
const path = require('path')
const Promise = require('bluebird')
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
  init: function() {
    var that = discovery
    debug("discovery init")
    ipcMain.on('discovery:start_scanning', that.start_scanning)
    setTimeout(function() {
      if (that.allPromises) {
        that.allPromises.cancel()
      } else {
        debug("No Promise found")
      }
    }, 4000);

    ipcMain.on('connect_core', function(event, arg) {
      debug("received connect_core ipc event")
      // that.sending = false;
      if (that.allPromises) {
        that.allPromises.cancel()
      }
    })
  },
  allPromises: null,
  sending: true,
  start_scanning: function(event, arg) {
    var that = discovery

    debug("autoscan started")
    that.getRange().then(function(range) {
      var ar = []
      var retAr = []
      range.unshift("127.0.0.1") //------------ adding localhost to first
      for (var i = 0; i < range.length; i++) {
        var promise = discovery.ping(range[i]);
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
        .finally(function() {
          debug("Scanning completed finally")
          event.sender.send("discovery:scan_done", [])
        })
    })
  },
  ips: function(callback) {
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
      debug("Network Interfaces :", addresses)
      resolve(addresses)
    })
  },
  getRange: function(callback) {
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
  autoScan: function(callback) {
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
  ping: function(ip, callback) {
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
          //throw err
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
        //debug(resp)
      })
      onCancel(function() {
        rs.abort()
      })
    })
  }
}

module.exports = discovery
