"use strict";

const nock = require('nock')
const path = require('path')
const fs = require('fs')

const debug = require('debug')("snappy:gui:test:functions:discovery_spec")

describe('Discovery class functions', function() {

  it('find local node', function(done) {
    nock('http://127.0.0.1:8000')
      .get('/info')
      .reply(200, {
        name: "Snappy Robotics Software",
        version: '1.0.2',
        description: 'sdf .....',
        snappy: true
      })
    const discovery = require(path.join(__dirname, '..', '..', 'scripts', 'discovery'))
    done()
    /*discovery.ping('127.0.0.1')
      .then(function(ip) {
        debug(ip)
        done()
      })*/
  })
})
