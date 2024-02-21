import browserSync from 'browser-sync'
import del from 'del'
import fs from 'fs'
import pkg from 'gulp'
import autoprefixer from 'gulp-autoprefixer'
import cleanCss from 'gulp-clean-css'
import fileinclude from 'gulp-file-include'
import gcmq from 'gulp-group-css-media-queries'
import gulpif from 'gulp-if'
import imagemin from 'gulp-imagemin'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import gulpSass from 'gulp-sass'
import sassglob from 'gulp-sass-glob'
import sourcemaps from 'gulp-sourcemaps'
import svgSprite from 'gulp-svg-sprite'
import svgmin from 'gulp-svgmin'
import versionNumber from 'gulp-version-number'
import webp from 'gulp-webp'
import webpcss from 'gulp-webpcss'
import dartSass from 'sass'
import webpackStream from 'webpack-stream'

const sass = gulpSass(dartSass)
const { src, dest, parallel, series, watch } = pkg

let isProd = false

import * as nodePath from 'path'
const rootFolder = nodePath.basename(nodePath.resolve())

const srcPath = 'src/'
const distPath = 'dist/'

const path = {
	build: {
		html: distPath,
		js: distPath + 'assets/templates/js/',
		css: distPath + 'assets/templates/css/',
		images: distPath + 'assets/templates/img/',
		fonts: distPath + 'assets/templates/fonts/',
		resources: distPath + '/',
		svgicons: distPath + 'assets/templates/img/',
	},
	src: {
		html: srcPath + '*.html',
		js: srcPath + 'assets/templates/js/main.js',
		css: srcPath + 'assets/templates/styles/scss/main.scss',
		images:
			srcPath + 'assets/templates/img/**/*.{jpg,jpeg,png,svg,ico,webp,gif}',
		fonts: srcPath + 'assets/templates/fonts/**/*.{woff,woff2}',
		resources: srcPath + 'assets/templates/resources/**/*.*',
		svgicons: srcPath + 'assets/templates/svgicons/*.svg',
	},
	watch: {
		html: srcPath + '**/*.html',
		js: srcPath + 'assets/templates/js/**/*.js',
		css: srcPath + 'assets/templates/styles/scss/**/*.scss',
		images:
			srcPath + 'assets/templates/img/**/*.{jpg,jpeg,png,svg,ico,webp,gif}',
		fonts: srcPath + 'assets/templates/fonts/**/*.{ttf,otf}',
		resources: srcPath + 'assets/templates/resources/**/*.*',
		svgicons: srcPath + 'assets/templates/svgicons/*.svg',
	},
	clean: './' + distPath,
}

function server() {
	browserSync.init({
		server: { baseDir: 'dist/' },
		notify: false,
		online: true,
	})
}

function html() {
	return src(path.src.html)
		.pipe(plumber())
		.pipe(fileinclude())
		.pipe(
			gulpif(
				isProd,
				versionNumber({
					value: '%DT%',
					append: {
						key: '_v',
						cover: 0,
						to: ['css', 'js'],
					},
					output: {
						file: 'version.json',
					},
				})
			)
		)
		.pipe(dest(path.build.html))
		.pipe(browserSync.stream())
}

function css() {
	return src(path.src.css)
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: 'SCSS Error',
						message: 'Error: <%= error.message %>',
					})(err)
					this.emit('end')
				},
			})
		)
		.pipe(sassglob())
		.pipe(sass())
		.pipe(gulpif(!isProd, sourcemaps.init()))
		.pipe(gulpif(isProd, gcmq()))
		.pipe(
			gulpif(isProd, webpcss({ webpClass: '.webp', noWebpClass: '.no-webp' }))
		)
		.pipe(
			gulpif(
				isProd,
				autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })
			)
		)
		.pipe(gulpif(isProd, cleanCss({ level: 2 })))
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulpif(!isProd, sourcemaps.write()))
		.pipe(dest(path.build.css))
		.pipe(browserSync.stream())
}

function js() {
	return src(path.src.js)
		.pipe(
			webpackStream({
				mode: isProd ? 'production' : 'development',
				output: {
					filename: 'main.min.js',
				},
				module: {
					rules: [
						{
							test: /\.m?js$/,
							exclude: /node_modules/,
							use: {
								loader: 'babel-loader',
								options: {
									presets: [
										[
											'@babel/preset-env',
											{
												targets: 'defaults',
											},
										],
									],
								},
							},
						},
					],
				},
				devtool: 'source-map',
			})
		)
		.on('error', function (err) {
			console.error('WEBPACK ERROR', err)
			this.emit('end')
		})
		.pipe(dest(path.build.js))
		.pipe(browserSync.stream())
}

function images() {
	return src(path.src.images)
		.pipe(webp())
		.pipe(gulpif(isProd, imagemin()))
		.pipe(dest(path.build.images))
		.pipe(browserSync.stream())
}

function svgSprites() {
	return src(path.src.svgicons)
		.pipe(
			svgmin({
				js2svg: {
					pretty: true,
				},
			})
		)
		.pipe(replace('&gt;', '>'))
		.pipe(
			svgSprite({
				mode: {
					stack: {
						sprite: '../sprite.svg',
					},
				},
			})
		)
		.pipe(dest(path.build.svgicons))
		.pipe(browserSync.stream())
}

function resources() {
	return src(path.src.resources)
		.pipe(dest(path.build.resources))
		.pipe(browserSync.stream())
}

function fonts(done) {
	return src(path.src.fonts).pipe(dest(path.build.fonts)).on('end', done)
}

function fontStyle(done) {
	let fontsFile = `${srcPath}assets/templates/styles/scss/fonts.scss`
	fs.readdir(path.build.fonts, function (err, fontsFiles) {
		if (fontsFiles) {
			if (!fs.existsSync(fontsFile)) {
				fs.writeFile(fontsFile, '', function (err) {
					if (err) throw err
					let newFileOnly
					for (var i = 0; i < fontsFiles.length; i++) {
						let fontFileName = fontsFiles[i].split('.')[0]
						if (newFileOnly !== fontFileName) {
							let fontName = fontFileName.split('-')[0]
								? fontFileName.split('-')[0]
								: fontFileName
							let fontWeight = fontFileName.split('-')[1]
								? fontFileName.split('-')[1]
								: fontFileName
							if (fontWeight.toLowerCase() === 'thin') {
								fontWeight = 100
							} else if (fontWeight.toLowerCase() === 'extralight') {
								fontWeight = 200
							} else if (fontWeight.toLowerCase() === 'light') {
								fontWeight = 300
							} else if (fontWeight.toLowerCase() === 'medium') {
								fontWeight = 500
							} else if (fontWeight.toLowerCase() === 'semibold') {
								fontWeight = 600
							} else if (fontWeight.toLowerCase() === 'bold') {
								fontWeight = 700
							} else if (
								fontWeight.toLowerCase() === 'extrabold' ||
								fontWeight.toLowerCase() === 'heavy'
							) {
								fontWeight = 800
							} else if (fontWeight.toLowerCase() === 'black') {
								fontWeight = 900
							} else {
								fontWeight = 400
							}
							fs.appendFile(
								fontsFile,
								`@font-face {
                                font-family: ${fontName};
                                font-display: swap;
                                src: url("../fonts/${fontFileName}.woff2") format("woff2"),
                                    url("../fonts/${fontFileName}.woff") format("woff");
                                font-weight: ${fontWeight};
                                font-style: normal;
                                }\r\n`,
								function (err) {
									if (err) throw err
								}
							)
							newFileOnly = fontFileName
						}
					}
				})
			}
		}
	})
	done()
}

function clean() {
	return del('dist/')
}

function startWatch() {
	watch(path.watch.html, html)
	watch(path.watch.css, css)
	watch(path.watch.js, js)
	watch(path.watch.images, images)
	watch(path.watch.svgicons, svgSprites)
	watch(path.watch.resources, resources)
}

function toProd(done) {
	isProd = true
	done()
}

export {
	clean,
	css,
	fontStyle,
	fonts,
	html,
	images,
	js,
	resources,
	server,
	startWatch,
	svgSprites,
	toProd,
}

export const build = series(
	toProd,
	html,
	css,
	js,
	svgSprites,
	images,
	resources,
	fonts
)

export default series(
	clean,
	html,
	css,
	js,
	fonts,
	fontStyle,
	images,
	svgSprites,
	resources,
	parallel(server, startWatch)
)
