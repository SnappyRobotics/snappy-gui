"use strict";

process.env.WINDOW = 'discovery'

global.snappy_gui = {}
global.snappy_gui.client_PORT = 8000

require('../setup')
const helpers = require('./app-setup')

const req = require('req-fast')
const path = require('path')
const fs = require('fs')

const core = require('snappy-core')

const debug = require('debug')("snappy:gui:test:gui:discovery_spec")

describe('Discovery GUI', function() {
  describe('with mock devices', function() {
    helpers.setupTimeout(this)

    var app = null

    beforeEach(function() {
      process.env.GUI_TEST = 'NOCKS'
      return helpers.startApplication({
        args: [path.join(__dirname, '..', '..', 'main.js')]
      }).then(function(startedApp) {
        app = startedApp
      })
    })

    afterEach(function() {
      return helpers.stopApplication(app)
    })

    it('scan with 253 fake servers', function() {
      return app.client
        .getMainProcessLogs().then(debug)
        // .getRenderProcessLogs().then(debug)
        .pause(500)
        // .waitUntilWindowLoaded()
        .waitUntilTextExists('#devices_count', '253')
    })
  })

  /*
  describe('without mock devices', function() {
    helpers.setupTimeout(this)
    var app = null

    beforeEach(function() {
      delete process.env.GUI_TEST

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

    it('click locally button and then click cancel', function() {
      return app.client
        .getMainProcessLogs().then(debug)
        .getRenderProcessLogs().then(debug)
        .waitUntilWindowLoaded()
        .getText('#devices_count').should.eventually.equal('0')
        .pause(1000)
        .click("#localBtn")
        .pause(1700)
        .click('#cancelConnectingBtn')
    })
  })
  describe('with core', function() {
    helpers.setupTimeout(this)
    var app = null

    var isPortTaken = function(fn) {
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

    beforeEach(function(done) {
      delete process.env.GUI_TEST
      isPortTaken(function(err, isIt) {
        if (isIt) {
          debug("Port already taken")
          done()
        } else {
          core.start().then(function() {
            helpers.startApplication({
              args: [path.join(__dirname, '..', '..', 'main.js')]
            }).then(function(startedApp) {
              app = startedApp
              done()
            })
          })
        }
      })
    })

    afterEach(function() {
      core.stop()
      return helpers.stopApplication(app)
    })

    it('connect to existing local server', function() {
      debug('comming to connect to server')
      return app.client
        .getMainProcessLogs().then(debug)
        .getRenderProcessLogs().then(debug)
        .waitUntilWindowLoaded()
        .getText('#devices_count').should.eventually.equal('1')
      //.click(".connectBtn")
    })
  })
  */

})
