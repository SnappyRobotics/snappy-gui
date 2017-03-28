"use strict";

const nock = require('nock')
const path = require('path')
const fs = require('fs')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect;

const main = require(path.join(__dirname, '..', '..', 'main'));

const debug = require('debug')("snappy:gui:test:functions:discovery_spec")

describe('Discovery class functions', function() {
  before(function() {
    chai.expect()
    chai.use(chaiAsPromised)
  })

  it('Test Ping function', function(done) {
    nock('http://127.0.0.1:8000')
      .get('/info')
      .reply(200, {
        name: "Snappy Robotics Software",
        version: '1.0.2',
        description: 'sdf .....',
        snappy: true
      })

    const discovery = require(path.join(__dirname, '..', '..', 'scripts', 'discovery'))
    discovery.ping('127.0.0.1')
      .then(function(ip) {
        debug(ip)
        expect(ip).to.be.an('object')
        expect(ip).to.have.property('ip')
        expect(ip).to.have.property('found')
        expect(ip.ip).to.be.equal('127.0.0.1')
        expect(ip.found).to.be.true
        done()
      })
  })
})
