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

  before(function() {
    return helpers.startApplication({
      args: [path.join(__dirname, '..', '..', 'main.js')]
    }).then(function(startedApp) {
      app = startedApp
    })
  })

  after(function() {
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
      .browserWindow.getTitle().should.eventually.be.equal("Discovery")
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

})
