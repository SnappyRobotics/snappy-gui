"use strict";

var Application = require('spectron').Application
var assert = require('assert')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var path = require('path')

const debug = require('debug')("snappy:gui:test:global-setup")

global.before(function() {
  chai.should()
  chai.use(chaiAsPromised)
})

exports.getElectronPath = function() {
  var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron')
  if (process.platform === 'win32') {
    electronPath += '.cmd'
  }
  return electronPath
}

exports.setupTimeout = function(test) {
  if (process.env.CI) {
    test.timeout(60 * 60 * 1000)
  } else {
    test.timeout(60000)
  }
}

exports.startApplication = function(options) {
  options.path = exports.getElectronPath()
  if (process.env.CI) {
    options.startTimeout = 30000
  }

  debug("Options:", options)

  var app = new Application(options)

  debug("starting app")

  return app.start().then(function() {
    debug("started app")
    assert.equal(app.isRunning(), true)
    chaiAsPromised.transferPromiseness = app.transferPromiseness
    return app
  })
}

exports.stopApplication = function(app) {
  if (!app || !app.isRunning()) {
    return
  }

  return app.stop().then(function() {
    assert.equal(app.isRunning(), false)
  })
}
