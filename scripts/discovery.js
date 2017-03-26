"use strict";

const req = require('req-fast')
const path = require('path')
const when = require('when')
const fs = require('fs')
const os = require('os')
const bindCallback = require('when/node').bindCallback;


const debug = require('debug')("snappy:gui:discovery")

var discovery = {
  ips: function(callback) {
    return bindCallback(when.promise(function(resolve, reject) {
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
    }), callback)
  },
  getRange: function(callback) {
    return bindCallback(when.promise(function(resolve, reject) {
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
    }), callback)
  },
  autoScan: function(callback) {
    var retAr = []
    return bindCallback(when.promise(function(resolve, reject) {
      discovery.getRange().then(function(range) {
        var ar = []
        for (var i = 0; i < range.length; i++) {
          ar.push(discovery.ping(range[i]))
        }
        ar.push(discovery.ping("127.0.0.1")) //------------ adding localhost

        var p = when.all(ar)
        p.done(function(ot) {
          for (var i = 0; i < ot.length; i++) {
            if (ot[i].found) {
              retAr.push(ot[i].ip)
            }
          }
          debug("Scanning complete")
          resolve(retAr)
        }, function(er) {
          debug(er)
          resolve(er)
        })
      })
    }), callback)
  },
  ping: function(ip, callback) {
    return bindCallback(when.promise(function(resolve, reject) {
      req({
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
    }), callback)
  }
}

module.exports = discovery
