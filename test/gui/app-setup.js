"use strict";

process.env.TEST_MODE = 'GUI'

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
  var electronPath = path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron')
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
  options.quitTimeout = 1000
  options.requireName = 'electronRequire'

  var app = new Application(options)

  return app.start().then(function() {
    assert.equal(app.isRunning(), true)
    chaiAsPromised.transferPromiseness = app.transferPromiseness
    return app
  }).catch(console.log.bind(console))
}

exports.stopApplication = function(app) {
  if (!app || !app.isRunning()) {
    return
  }

  return app.stop().then(function() {
    assert.equal(app.isRunning(), false)
  }).catch(console.log.bind(console))
}
