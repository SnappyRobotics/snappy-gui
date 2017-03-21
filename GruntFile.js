var path = require("path");

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      tests: ['test/*_test.js']
    },
    paths: {
      dist: ".dist"
    },
    simplemocha: {
      options: {
        globals: ['expect'],
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },
      all: {
        src: ['test/**/*_spec.js']
      },
      core: {
        src: ["test/_spec.js", "test/red/**/*_spec.js"]
      },
      nodes: {
        src: ["test/nodes/**/*_spec.js"]
      }
    },
    jshint: {
      options: {
        // http://www.jshint.com/docs/options/
        "node": true,
        "esversion": 6,
        "asi": true, // allow missing semicolons
        "curly": true, // require braces
        //"eqnull": true,   // ignore ==null
        "forin": true, // require property filtering in "for in" loops
        "immed": true, // require immediate functions to be wrapped in ( )
        "nonbsp": true, // warn on unexpected whitespace breaking chars
        "strict": true, // commented out for now as it causes 100s of warnings, but want to get there eventually
        "loopfunc": true, // allow functions to be defined in loops
        //"sub": true       // don't warn that foo['bar'] should be written as foo.bar
      },
      all: [
        'Gruntfile.js',
        'main.js',
        'test/**/*.js',
        'main_process/**/*.js',
        'renderer/**/*.js',
        'scripts/**/*.js'
      ],
      main_process: {
        files: {
          src: [
            'main.js',
            'Gruntfile.js',
            'scripts/**/*.js',
            'main_process/**/*.js'
          ]
        }
      },
      renderer: {
        files: {
          src: [
            'renderer/**/*.js'
          ]
        }
      },
      tests: {
        files: {
          src: ['test/**/*.js']
        },
        options: {
          "expr": true
        }
      },
    }
  });
  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  //grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['jshint', 'nodeunit']);
};
