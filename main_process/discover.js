'use strict';

const {
  app,
  ipcMain,
  BrowserWindow
} = require('electron')

const debug = require('debug')("snappy:gui:discover")

const path = require('path')
const when = require('when')
const discovery = require(path.join(__dirname, "..", "scripts", "discovery.js"))

ipcMain.on('discovery:start_scanning', function(event, arg) {
  debug("autoscan started", discovery)
  discovery.getRange().then(function(range) {
    var ar = []
    var retAr = []
    range.push("127.0.0.1") //------------ adding localhost
    for (var i = 0; i < range.length; i++) {
      var promise = discovery.ping(range[i]);
      promise.done(function(ip) {
        if (ip) {
          debug("Found Device at :", ip)
          retAr.push(ip)
          event.sender.send("discovery:devices", retAr)
        }
      })
      ar.push(promise)
    }

    var p = when.all(ar)
    p.done(function(ot) {
      debug("Scanning complete")
      event.sender.send("discovery:scan_done", retAr)
    }, function(er) {
      debug(er)
      event.sender.send("discovery:scan_done", er)
    })
  })
})
