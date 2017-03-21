"use strict";

const Application = require('spectron').Application
const assert = require('assert')
const path = require('path')
const debug = require('debug')("snappy:gui:test:main");

describe('application launch', function() {
  this.timeout(10000)

  beforeEach(function() {
    debug(path.join(__dirname, "..", "main.js"))

    this.app = new Application({
      path: './node_modules/.bin/electron',
      args: ['main.js']
    })
    return this.app.start()
  })

  afterEach(function() {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('shows an initial window', function() {
    return this.app.client.getWindowCount().then(function(count) {
      assert.equal(count, 2)
    })
  })
})
