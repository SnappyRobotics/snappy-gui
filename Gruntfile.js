"use strict";

var path = require('path')

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        // http://www.jshint.com/docs/options/
        'node': true,
        'esversion': 6,
        'asi': true, // allow missing semicolons
        'curly': true, // require braces
        //"eqnull": true,   // ignore ==null
        'forin': true, // require property filtering in "for in" loops
        'immed': true, // require immediate functions to be wrapped in ( )
        'nonbsp': true, // warn on unexpected whitespace breaking chars
        'strict': true, // commented out for now as it causes 100s of warnings, but want to get there eventually
        'loopfunc': true, // allow functions to be defined in loops
        //"sub": true,       // don't warn that foo['bar'] should be written as foo.bar
        'freeze': true,
        'latedef': true,
        'maxerr': 2,
        'bitwise': true,
        "globals": {
          "Promise": true,
          "$": false
        }
      },
      main_process: {
        files: {
          src: [
            'main.js',
            'Gruntfile.js',
            'scripts/**/*.js'
          ]
        }
      },
      renderer: {
        files: {
          src: [
            'renderer/**/*.js'
          ]
        },
        options: {
          'browser': true
        }
      },
      tests: {
        files: {
          src: ['test/**/*.js']
        },
        options: {
          'mocha': true,
          'expr': true
        }
      }
    },
    mochaTest: {
      functions: {
        options: {
          //  captureFile: 'results.txt', // Optionally capture the reporter output to a file
          require: 'babel-register',
          reporter: 'spec'
        },
        src: ['test/functions/*_spec.js']
      },
      gui: {
        src: ['test/gui/*_spec.js']
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-mocha-test')


  grunt.registerTask('default', ['test'])
  grunt.registerTask('test', [
    'jshint',
    // 'mochaTest:functions',
    'mochaTest:gui'
  ])
}
