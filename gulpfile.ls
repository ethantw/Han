
require! {
  \./package.json : pkg
  \gulp
  \gulp-connect
  \gulp-concat-util : concat
  \gulp-stylus : styl
  \gulp-csscomb
  \gulp-cssmin
  \gulp-requirejs-optimize : rjs
  \gulp-uglifyjs
  \gulp-symlink
  \gulp-browserify
  \gulp-livescript
  \gulp-jade
  \gulp-plumber
  \gulp-util
  \gulp-watch : watch
  \gulp-qunit
}

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

const unwrap = ( name, path, src ) ->
  rdefineEnd = /\}\);?[^}\w]*$/

  if path is /.\/var\//
    src = src
      .replace( /define\([\w\W]*?return/, 'var ' + /var\/([\w-]+)/.exec(name)[1] + ' =' )
      .replace( rdefineEnd, '' )
  else if name is /^fibre$/
    src = '\nvar Fibre =\n' + src
      .replace( /void\s/, '' )
      .replace( "var Finder = Finder || require( './finder.umd' )\n", '' )
      .replace( /\/\/\s*EXPOSE[\w\W]*\/\/\s*EXPOSE/, 'return Fibre' )
  else
    src = src
      .replace( /\s*return\s+[^\}]+(\}\);?[^\w\}]*)$/, '$1' )
      .replace( /define\([^{]*?{/, '' )
      .replace( rdefineEnd, '' )
      .replace( /\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, '' )
      .replace( /\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, '' )
      .replace( /define\(\[[^\]]+\]\)[\W\n]+$/, '' )
  src

rjs-config = {
  baseUrl: \src/js
  name: \han
  out: \./han.js
  optimize: \none
  findNestedDependencies: yes
  skipSemiColonInsertion: yes
  wrap: {
    startFile: \src/js/intro.js
    endFile: \src/js/outro.js
  }
  paths: {
    fibre: \../lib/fibre.js/index
  }
  rawText: {}
  onBuildWrite: unwrap
}

gulp-src = ->
  gulp.src.apply gulp, arguments
    .pipe gulp-plumber ( error ) ->
      gulp-util.log gulp-util.colors.red(
        "Error (#{ error.plugin  }): #{ error.message }"
      )
      this.emit \end

gulp.task \default <[ build demo ]>
gulp.task \dev     <[ build watch server ]>
gulp.task \build   <[ dist:css dist:js ]>
gulp.task \demo    <[ build demo:lsc demo:styl demo:jade ]>
gulp.task \asset   <[ dist:font ]>
gulp.task \dep     <[ normalize.css fibre.js ]>

gulp.task \server !->
  gulp-connect.server {
    port: 7777
    livereload: true
  }

# Build for distribution
gulp.task \dist:css <[ dist:styl dist:cssmin ]>
gulp.task \dist:js  <[ dist:amd dist:uglify ]>

gulp.task \dist:font ->
  gulp-src './font/han*.{woff,otf}'
    .pipe gulp.dest \./dist/font
    .pipe gulp.dest \./demo/font

gulp.task \dist:styl ->
  gulp-src \./index.styl
    .pipe styl!
    .pipe concat \han.css, {
      process: ( src ) ->
        src
          .replace /@charset\s(['"])UTF-8\1;\n/g, ''
          .replace /@VERSION/g, "v#{VERSION}"
    }
    .pipe concat.header CSS-BANNER
    .pipe gulp-csscomb!
    .pipe gulp.dest \./dist
    .pipe gulp.dest \./demo

gulp.task \dist:cssmin <[ dist:styl ]> ->
  gulp-src \./dist/han.css
    .pipe gulp-cssmin { keepSpecialComments: 0 }
    .pipe concat \han.min.css, {
      process: ( src ) ->
        src.replace /@charset\s(['"])UTF-8\1;/g, ''
    }
    .pipe concat.header CSS-BANNER
    .pipe gulp.dest \./dist
    .pipe gulp.dest \./demo

gulp.task \dist:amd ->
  gulp-src \./src/js/han.js
    .pipe rjs rjs-config
    .pipe concat \han.js, {
      process: ( src ) ->
        src
          .replace /@VERSION/g, VERSION
          .replace /\n{3,}/g, '\n\n'
    }
    .pipe gulp.dest \./dist
    .pipe gulp.dest \./test
    .pipe gulp.dest \./demo

gulp.task \dist:uglify <[ dist:amd ]> ->
  gulp-src \./dist/han.js
    .pipe gulp-uglifyjs \han.min.js {
      output: {
        ascii_only: true
      }
    }
    .pipe concat \han.min.js
    .pipe concat.header BANNER
    .pipe gulp.dest \./dist
    .pipe gulp.dest \./test
    .pipe gulp.dest \./demo

# API test
gulp.task \test ->
  gulp-src \./test/index.html
    .pipe gulp-qunit!

# Demo
gulp.task \demo:styl ->
  gulp-src \./demo/*.styl
    .pipe styl!
    .pipe gulp-cssmin { keepSpecialComments: 0 }
    .pipe gulp.dest \./demo

gulp.task \demo:jade ->
  gulp-src \./demo/*.jade
    .pipe gulp-jade!
    .pipe gulp.dest \./demo

gulp.task \demo:lsc ->
  gulp-src \./demo/test-commonjs.ls
    .pipe gulp-livescript!
    .pipe gulp-browserify!
    .pipe gulp-uglifyjs {
      output: {
        ascii_only: true
      }
    }
    .pipe gulp.dest \./demo

  gulp-src \./test/index.ls
    .pipe gulp-livescript!
    .pipe gulp.dest \./test

# Watch
gulp.task \watch <[ default ]> ->
  gulp.watch \./src/styl/**/* <[ dist:css demo:styl ]>
  gulp.watch \./src/js/**/*   <[ dist:js demo:lsc ]>
  gulp.watch \./demo/*.styl   <[ demo:styl ]>
  gulp.watch \./demo/*.jade   <[ demo:jade ]>
  gulp.watch \./demo/*.ls     <[ demo:lsc ]>
  gulp.watch \./test/*.ls     <[ demo:lsc ]>

# Dependencies
gulp.task \normalize.css ->
  gulp-src \./node_modules/normalize.css/normalize.css
    .pipe concat \normalize.styl
    .pipe gulp.dest \./src/styl/locale
    .pipe concat \_normalize.scss
    .pipe gulp.dest \./src/sass/locale

gulp.task \fibre.js ->
  gulp-src \./node_modules/fibre.js/dist/fibre.js
    .pipe concat \index.js
    .pipe gulp.dest \./src/lib/fibre.js

