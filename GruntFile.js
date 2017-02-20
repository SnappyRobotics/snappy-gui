module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodeunit: {
      tests: ['test/*_test.js']
    },
    jshint: {
      options: {
        jshintrc: true
        // http://www.jshint.com/docs/options/
        //"asi": true,      // allow missing semicolons
        //"curly": true,    // require braces
        //"eqnull": true,   // ignore ==null
        //"forin": true,    // require property filtering in "for in" loops
        //"immed": true,    // require immediate functions to be wrapped in ( )
        //"nonbsp": true,   // warn on unexpected whitespace breaking chars
        ////"strict": true, // commented out for now as it causes 100s of warnings, but want to get there eventually
        //"loopfunc": true, // allow functions to be defined in loops
        //"sub": true       // don't warn that foo['bar'] should be written as foo.bar
      },
      all: ['Gruntfile.js', 'test/**/*.js']
    },
    watch: {
      options: {
        spawn: false
      },
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint']
      },
      nodes: {
        files: 'nodes/*.js',
        tasks: ['test']
      },
      test: {
        files: 'test/*js',
        tasks: ['test']
      }
    }
  });
  //grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  //grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test', ['jshint', 'nodeunit']);
};
