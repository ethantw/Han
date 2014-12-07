
module.exports = function( grunt ) {

  'use strict'

  var srcHintOptions = readOptionalJSON( './.jshintrc' )

  function readOptionalJSON( filepath ) {
    var data = {}

    try {
      data = grunt.file.readJSON( filepath )
    } catch ( e ) {}
    return data
  }

  // The concatenated file won't pass onevar
  // But our modules can
  delete srcHintOptions.onevar

  grunt.initConfig({
    pkg: grunt.file.readJSON( 'package.json' ),
    jshint: {
      all: {
        src: [
          "js/src/**/*.js", "han.js"
        ],
        options: {
          jshintrc: true
        }
      },
      dist: {
        src: "dist/jquery.js",
        options: srcHintOptions
      }
    },
    build: {
      all: {
        dest: './han.js'
      }
    },
    uglify: {
      all: {
        files: {
          'han.min.js': [ 'han.js' ]
        },
        options: {
          preserveComments: false,
          report: 'min',
          beautify: {
            ascii_only: true
          },
          banner: '/*!\n' +
            ' * 漢字標準格式 v<%= pkg.version %> | MIT License | css.hanzi.co\n' +
            ' * Han: CSS typography framework optimised for Hanzi\n' +
            ' */\n',
          compress: {
            hoist_funs: false,
            loops: false,
            unused: false
          }
        }
      }
    }
  })

  require( 'load-grunt-tasks' )( grunt )
  grunt.loadTasks( 'build' )
  grunt.registerTask( 'test', [ 'jshint' ] )
  grunt.registerTask( 'dev', [ 'build:*:*' ] )
  grunt.registerTask( 'default', [ 'dev', 'uglify' ] )
}
