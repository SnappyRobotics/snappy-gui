"use strict";

const nock = require('nock')
const path = require('path')
const fs = require('fs')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect;

const main = require(path.join(__dirname, '..', '..', 'main'));
const discovery = require(path.join(__dirname, '..', '..', 'scripts', 'discovery'))

const debug = require('debug')("snappy:gui:test:functions:discovery_spec")

describe('Discovery class functions', function() {
  before(function() {
    chai.expect()
    chai.use(chaiAsPromised)
  })

  describe('with mock device core servers', function() {
    it('Test Ping function', function(done) {
      nock('http://127.0.0.1:8000')
        .get('/info')
        .reply(200, {
          name: "Snappy Robotics Software",
          version: '1.0.2',
          description: 'sdf .....',
          snappy: true
        })

      discovery.ping('127.0.0.1')
        .then(function(ip) {
          expect(ip).to.be.an('object')
          expect(ip).to.have.property('ip').that.is.a('string').which.equals('127.0.0.1')
          expect(ip).to.have.property('found').that.is.a('boolean').which.is.true
          done()
        })
    })
    it('Test Ping function with non snappy response', function(done) {
      nock('http://127.0.0.1:8000')
        .get('/info')
        .reply(200, {
          name: "Snappy Robotics Software",
          version: '1.0.2',
          description: 'sdf .....',
          snappy: false
        })

      discovery.ping('127.0.0.1')
        .then(function(ip) {
          expect(ip).to.be.an('object')
          expect(ip).to.have.property('ip').that.is.a('string').which.equals('127.0.0.1')
          expect(ip).to.have.property('found').that.is.a('boolean').which.is.false
          done()
        })
    })

    it('Test getRange function', function(done) {
      discovery.getRange('127.0.0.1')
        .then(function(ips) {
          expect(ips).to.be.an('array')

          var arr = []
          for (var i = 0; i < ips.length; i++) {
            if (ips[i].match(/192.168.108.([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])/)) {
              arr.push(ips[i])
            }
          }
          expect(arr.length).to.be.equal(253) //our netmask generates 253 IPs
          done()
        })
    })

    it('Check ping for 253 existing nodes', function(done) {
      this.timeout(10000)
      nock(/192.168.108.([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5]):8000/)
        .get('/info')
        .times(290)
        .reply(200, {
          name: "Snappy Robotics Software",
          version: '1.0.2',
          description: 'sdf .....',
          snappy: true
        })


      discovery.getRange().then(function(range) {
        var ar = []
        var retAr = []
        //range.unshift("127.0.0.1") //------------ adding localhost to first
        var arr = [] // only get our ranges
        for (var j = 0; j < range.length; j++) {
          if (range[j].match(/192.168.108.([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])/)) {
            arr.push(range[j])
          }
        }
        for (var i = 0; i < arr.length; i++) {
          var promise = discovery.ping(arr[i]);
          promise.then(function(ip) {
            if (ip.found) {
              retAr.push(ip.ip)
            }
          })
          ar.push(promise)
        }

        var allPromises = Promise.all(ar)
        allPromises
          .then(function(ot) {
            debug("Scanning complete")
            expect(retAr).to.be.an('array');
            expect(retAr.length).to.be.equal(253)
            done()
          })
      })
    })

    it('Check isPortTaken function with port free', function(done) {
      // this.timeout(10000)
      discovery.isPortTaken(function(err, isIt) {
        expect(isIt).to.be.a('boolean')
        expect(isIt).to.be.false
        done()
      })
    })

    it('Check isPortTaken function with port already in use', function(done) {
      // this.timeout(10000)
      var net = require('net')
      var tester = net.createServer()
        .once('error', function(err) {
          if (err.code != 'EADDRINUSE') {
            done(err)
            return
          }
          debug("Error! Port already in use :", global.snappy_gui.client_PORT)
        })
        .once('listening', function() {
          discovery.isPortTaken(function(err, isIt) {
            expect(isIt).to.be.a('boolean')
            expect(isIt).to.be.true
            tester.close()
            done()
          })
        })
        .listen(global.snappy_gui.client_PORT)
    })
  })
  describe('with real device core servers', function() {
    const core = require('snappy-core')
    it('without core running', function(done) {
      discovery.ping('127.0.0.1')
        .then(function(ip) {
          expect(ip).to.be.an('object')
          expect(ip).to.have.property('ip').that.is.a('string').which.equals('127.0.0.1')
          expect(ip).to.have.property('found').that.is.a('boolean').which.is.false
          done()
        })
    })

    it('with core running', function(done) {
      this.timeout(10000)
      core.start()

      setTimeout(function() {
        discovery.ping('127.0.0.1')
          .then(function(ip) {
            expect(ip).to.be.an('object')
            expect(ip).to.have.property('ip').that.is.a('string').which.equals('127.0.0.1')
            expect(ip).to.have.property('found').that.is.a('boolean').which.is.false
            done()
          })
      }, 3000);
    })
  })
})
