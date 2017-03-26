"use strict";

var helpers = require('../global-setup')
var path = require('path')

var describe = global.describe
var it = global.it
var beforeEach = global.beforeEach
var afterEach = global.afterEach

const debug = require('debug')("snappy:gui:test:main")

describe('Snappy GUI', function() {
  helpers.setupTimeout(this)

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
    return app.client.waitUntilWindowLoaded()
      .browserWindow.focus()
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
      .browserWindow.getTitle().should.eventually.be.equal("Discovery Wizard")
      .getText('#devices_count').should.eventually.equal('0')
  })

  describe('Local core', function() {
    it('click button to start core locally', function() {
      return app.client.waitUntilWindowLoaded()
        .click('#localBtn')
        .getMainProcessLogs().then(function(logs) {
          logs.forEach(function(log) {
            // debug("Main Process :", log)
          })
        })
        .getRenderProcessLogs().then(function(logs) {
          logs.forEach(function(log) {
            // debug("Renderer Process :", log.message)
          })
        })
    })
  })

  describe('separate local core', function() {
    const core = require('snappy-core')

    it('check the devices to be 0 without any server', function() {
      return app.client.waitUntilWindowLoaded()
        .waitUntilTextExists('#status_txt', 'Scan complete')
        .getText('#devices_count').should.eventually.equal('0')
    })

    describe('local running core', function() {
      before(function() {
        return core.start() //start the core
      })

      it('check the devices to be 1 with a on running server', function() {
        return app.client.waitUntilWindowLoaded()
          .waitUntilTextExists('#status_txt', 'Scan complete', 60000)
          .getText('#devices_count').should.eventually.equal('1')
      })

      it('press connect as soon as device detected', function() {
        return app.client.waitUntilWindowLoaded()
          .getText('#devices_count').should.eventually.equal('1')
      })
    })
  })
})
