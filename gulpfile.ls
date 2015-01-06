
require! <[ gulp ]>
connect = require \gulp-connect
concat = require \gulp-concat-util

sass = require \gulp-sass
csscomb = require \gulp-csscomb
cssmin = require \gulp-cssmin

rjs = require \gulp-requirejs-optimize
rjs-config = require \./rjs-option
uglify = require \gulp-uglifyjs

browserify = require \gulp-browserify
lsc = require \gulp-livescript
jade = require \gulp-jade

watch = require \gulp-watch
qunit = require \gulp-qunit
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

src = -> gulp.src( it ).pipe( watch( it ))

gulp.task \server !->
  connect.server {
    port: 7777
    livereload: true
  }

# Build for distribution
gulp.task \dist:css ->
  gulp.src \./sass/han.scss
    .pipe sass!
    .pipe concat \han.css
    .pipe concat.header CSS-BANNER
    .pipe csscomb!
    .pipe gulp.dest \./

gulp.task \dist:cssmin <[ dist:css ]> ->
  gulp.src \./han.css
    .pipe cssmin { keepSpecialComments: 0 }
    .pipe concat \han.min.css, {
      process: ( src ) ->
        src.replace /@charset\s(['"])UTF-8\1;/g, ''
    }
    .pipe concat.header CSS-BANNER
    .pipe gulp.dest \./

gulp.task \dist:js ->
  gulp.src \./js/han.js
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
    .pipe uglify \han.min.js {
      output: {
        ascii_only: true
      }
    }
    .pipe concat \han.min.js
    .pipe concat.header BANNER
    .pipe gulp.dest \./

# Demo
gulp.task \demo <[ dist ]> ->
  gulp.src \./han.*
    .pipe gulp.dest \./test

  gulp.src \./test/*.scss
    .pipe sass!
    .pipe cssmin { keepSpecialComments: 0 }
    .pipe gulp.dest \./test

  gulp.src \./test/test-commonjs-main.js
    .pipe browserify!
    .pipe uglify \test-commonjs.js {
      output: {
        ascii_only: true
      }
    }
    .pipe gulp.dest \./test

# Dependencies
gulp.task \normalize.css !->
  gulp.src \./node_modules/normalize.css/normalize.css
    .pipe concat \_normalize.scss
    .pipe gulp.dest \./sass/han/hyu

gulp.task \fibre.js !->
  gulp.src \./node_modules/fibre.js/dist/fibre.js
    .pipe concat \index.js
    .pipe gulp.dest \./js/lib/fibre.js

gulp.task \default <[ dist demo ]>
gulp.task \dev <[ default server ]>
gulp.task \dist <[ dist:css dist:cssmin dist:js dist:uglify ]>

