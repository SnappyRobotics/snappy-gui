"use strict";

process.env.WINDOW = 'discovery'

const helpers = require('../global-setup')
const path = require('path')
const fs = require('fs')

const debug = require('debug')("snappy:gui:test:gui:discovery_spec")
// const core = require('snappy-core')

describe('Snappy GUI', function() {
  helpers.setupTimeout(this)

  //  process.env.CI = true

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

  it('click locally button and then click cancel', function() {
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
      .click("#localBtn")
      .pause(1400)
      .click('#cancelConnectingBtn')
  })
})
