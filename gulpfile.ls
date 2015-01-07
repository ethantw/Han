
require! <[ gulp gulp-connect gulp-concat-util gulp-sass gulp-csscomb gulp-cssmin gulp-requirejs-optimize gulp-uglifyjs gulp-browserify gulp-livescript gulp-jade gulp-watch gulp-qunit ]>

concat = gulp-concat-util
sass = gulp-sass
rjs = gulp-requirejs-optimize
rjs-config = require \./rjs-option

watch = gulp-watch
pkg = require \./package.json

const VERSION = pkg.version
const BANNER = """
/*! 漢字標準格式 v#{VERSION} | MIT License | css.hanzi.co */
/*! Han.css: the CSS typography framework optimised for Hanzi */
\n
"""
const CSS-BANNER = """
@charset "UTF-8";

#{BANNER}
"""

gulp.task \default <[ build demo ]>
gulp.task \dev <[ watch server ]>
gulp.task \build <[ dist:sass dist:sassmin dist:js dist:uglify ]>

gulp.task \server !->
  gulp-connect.server {
    port: 7777
    livereload: true
  }

# Build for distribution
gulp.task \dist:sass ->
  gulp.src \./src/sass/han.scss
    .pipe sass!
    .pipe concat \han.css
    .pipe concat.header CSS-BANNER
    .pipe gulp-csscomb!
    .pipe gulp.dest \./

gulp.task \dist:sassmin <[ dist:sass ]> ->
  gulp.src \./han.css
    .pipe gulp-cssmin { keepSpecialComments: 0 }
    .pipe concat \han.min.css, {
      process: ( src ) ->
        src.replace /@charset\s(['"])UTF-8\1;/g, ''
    }
    .pipe concat.header CSS-BANNER
    .pipe gulp.dest \./

gulp.task \dist:js ->
  gulp.src \./src/js/han.js
    .pipe rjs rjs-config
    .pipe concat \han.js, {
      process: ( src ) ->
        src
          .replace /@VERSION/g, VERSION
          .replace /\n{3,}/g, '\n\n'
    }
    .pipe gulp.dest \./

gulp.task \dist:uglify <[ dist:js ]> ->
  gulp.src \./han.js
    .pipe gulp-uglifyjs \han.min.js {
      output: {
        ascii_only: true
      }
    }
    .pipe concat \han.min.js
    .pipe concat.header BANNER
    .pipe gulp.dest \./

# Demo
gulp.task \demo ->
  gulp.src <[ ./han*.css ./han*.js ]>
    .pipe gulp.dest \./test
  gulp.start <[ demo:sass demo:jade demo:lsc ]>

gulp.task \demo:sass ->
  gulp.src \./test/*.scss
    .pipe sass!
    .pipe gulp-cssmin { keepSpecialComments: 0 }
    .pipe gulp.dest \./test

gulp.task \demo:jade ->
  gulp.src \./test/*.jade
    .pipe gulp-jade!
    .pipe gulp.dest \./test

gulp.task \demo:lsc ->
  gulp.src \./test/test-commonjs.ls
    .pipe gulp-livescript!
    .pipe gulp-browserify!
    .pipe gulp-uglifyjs \test-commonjs.js {
      output: {
        ascii_only: true
      }
    }
    .pipe gulp.dest \./test

# Watch
gulp.task \watch <[ build demo ]> ->
  gulp.watch \./src/sass/**/* <[ dist:sass dist:sassmin demo ]>
  gulp.watch \./src/js/**/* <[ dist:js dist:uglify demo ]>
  gulp.watch \./test/*.scss <[ demo:sass ]>
  gulp.watch \./test/*.jade <[ demo:jade ]>
  gulp.watch \./test/*.ls <[ demo:lsc ]>

# Dependencies
gulp.task \normalize.css !->
  gulp.src \./node_modules/normalize.css/normalize.css
    .pipe concat \_normalize.scss
    .pipe gulp.dest \./src/sass/hyu

gulp.task \fibre.js !->
  gulp.src \./node_modules/fibre.js/dist/fibre.js
    .pipe concat \index.js
    .pipe gulp.dest \./src/lib/fibre.js

