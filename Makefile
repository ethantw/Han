
run ::
	npm start | npm run build:gemsass

han.css ::
	sass --sourcemap=none sass/han.sass han.css --style expanded
	grunt cssmin

han.js ::
	grunt dev
	grunt uglify

normalize.scss ::
	npm update normalize.css
	rm -f sass/han/hyu/_normalize.scss
	ln node_modules/normalize.css/normalize.css sass/han/hyu/_normalize.scss

test/watch ::
	sass --watch --sourcemap=none test --style compressed

test/sass ::
	sass --sourcemap=none test/counter-han.sass test/counter-han.css --style compressed
	sass --sourcemap=none test/em-han.sass test/em-han.css --style compressed
	sass --sourcemap=none test/generics-han.sass test/generics-han.css --style compressed
	sass --sourcemap=none test/ruby\(ff\)-han.sass test/ruby\(ff\)-han.css --style compressed

test/cjs ::
	browserify test/test-commonjs-main.js -o test/test-commonjs.js

test/dist ::
	rm -rf test/han.* test/font
	cp -r font test
	ln han.css test/han.css
	ln han.js test/han.js
	ln han.min.css test/han.min.css
	ln han.min.js test/han.min.js
	make test/cjs
	make test/sass
