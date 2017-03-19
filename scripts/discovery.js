const req = require('req-fast')
const path = require('path')
const when = require('when')
const fs = require('fs')
var os = require('os');
const bindCallback = require('when/node').bindCallback;


const debug = require('debug')("snappy:gui:discovery")

var discovery = {
  ips: function(callback) {
    return bindCallback(when.promise(function(resolve, reject) {
      var interfaces = os.networkInterfaces();
      var addresses = [];
      for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
          var address = interfaces[k][k2];
          if (address.family === 'IPv4' && !address.internal) {
            addresses.push({
              address: address.address,
              netmask: address.netmask
            });
          }
        }
      }
      resolve(addresses)
    }), callback)
  },
  getRange: function(callback) {
    return bindCallback(when.promise(function(resolve, reject) {
      discovery.ips().then(function(addresses) {
        for (var i = 0; i < addresses.length; i++) {
          const Netmask = require('netmask').Netmask;
          var block = new Netmask(addresses[i].address + "/" + addresses[i].netmask)
          var ar = []
          block.forEach(function(ip, long, index) {
            ar.push(ip)
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
        var p = when.all(ar)
        p.done(function(ot) {
          for (var i = 0; i < ot.length; i++) {
            if (ot[i]) {
              retAr.push(ot[i])
            }
          }
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
        uri: "http://" + ip + ":" + PORT + "/info",
        agent: "",
        headers: {
          'accept': 'application/json',
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      }, function(err, resp) {
        if (err) {
          //  throw err
          resolve(null)
          return
        }
        if (resp.body.snappy) {
          debug("Valid node at :", ip)
          resolve(ip)
        } else {
          debug("Invalid node at :", ip)
          resolve(null)
        }
        //debug(resp)
      })
    }), callback)
  }
}

module.exports = discovery
