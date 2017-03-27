"use strict";

var helpers = require('../global-setup')
var path = require('path')
var fs = require('fs')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

const debug = require('debug')("snappy:gui:test:main")
const core = require('snappy-core')

describe('Snappy GUI', function() {
  helpers.setupTimeout(this)

  //process.env.CI = true

  var app = null

  beforeEach(function() {
    return helpers.startApplication({
      args: [path.join(__dirname, '..', '..', 'main.js')]
    }).then(function(startedApp) {
      app = startedApp
    })
  })

  afterEach(function() {
    return helpers.stopApplication(app)
  })

  it('opens discovery window with no clients', function() {
    return app.client
      .getMainProcessLogs().then(debug)
      .getRenderProcessLogs().then(debug)
      .waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.focus()
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
      .getTitle().should.eventually.be.equal("Discovery Wizard")
      .getText('#devices_count').should.eventually.equal('0')
  })

  it('Running local core', function() {
    return app.client.waitUntilWindowLoaded()
      .getMainProcessLogs().then(debug)
      .getRenderProcessLogs().then(debug)
      .getWindowCount(debug)
      .click("#localBtn")
      .pause(100) // for next window to come up
      .windowByIndex(0)
      .waitUntilTextExists('span.logo', 'Snappy Robotics', 60000)
  })
  /*
  describe('connecting to existing local core', function() {
    before(function() {
      core.clean().then(function() { //Clean previous config
        return core.start() //start the core
      })
    })
    after(function() {
      return core.stop()
    })

    it('waiting for scanning to complete', function() {
      return app.client.waitUntilWindowLoaded()
        .getMainProcessLogs().then(function(logs) {
          logs.forEach(function(log) {
            debug("Main Process :", log)
          })
        })
        .getRenderProcessLogs().then(function(logs) {
          logs.forEach(function(log) {
            debug("Renderer Process :", log.message)
          })
        })
        .waitUntilTextExists('#status_txt', 'Scan complete', 60000)
        .getText('#devices_count').should.eventually.equal('1')
        .click(".connectBtn")
        .pause(100) // for next window to come up
        .windowByIndex(1)
        .waitUntilTextExists('#status_txt', 'Connected', 60000)
    })

    it('click without waiting for scanning to complete', function() {
      return app.client.waitUntilWindowLoaded()
        .getMainProcessLogs().then(function(logs) {
          logs.forEach(function(log) {
            debug("Main Process :", log)
          })
        })
        .getRenderProcessLogs().then(function(logs) {
          logs.forEach(function(log) {
            debug("Renderer Process :", log.message)
          })
        })
        .getText('#devices_count').should.eventually.equal('1')
        .pause(100) // for next window to come up
        .click(".connectBtn")
        .pause(100) // for next window to come up
        .windowByIndex(1)
        .waitUntilTextExists('#status_txt', 'Connected', 60000)
    })
  })
  */
})
