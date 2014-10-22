
module.exports = function( grunt ) {

	'use strict'

	var gzip = require( 'gzip-js' ),
			srcHintOptions = readOptionalJSON( '/.jshintrc' )

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
						' * 漢字標準格式 v3.0.0 | MIT License | css.hanzi.co\n' +
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

	// Load grunt tasks from NPM packages
	require( 'load-grunt-tasks' )( grunt )

	// Integrate jQuery specific tasks
	grunt.loadTasks( 'build' )

	grunt.registerTask( 'lint', [ 'jshint' ] )

	// Short list as a high frequency watch task
	grunt.registerTask( 'dev', [ 'build:*:*' ] )

	// Default grunt
	grunt.registerTask( 'default', [ 'dev', 'uglify' ] )
}
