let preprocessor = 'scss'
import browserSync from 'browser-sync'
import del from 'del'
import pkg from 'gulp'
const { src, dest, parallel, series, watch } = pkg
import autoprefixer from 'gulp-autoprefixer'
import cleanCss from 'gulp-clean-css'
import fileinclude from 'gulp-file-include'
import gcmq from 'gulp-group-css-media-queries'
import gulpif from 'gulp-if'
import imagemin from 'gulp-imagemin'
import newer from 'gulp-newer'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import svgSprite from 'gulp-svg-sprite'
import svgmin from 'gulp-svgmin'
import util from 'gulp-util'
import versionNumber from 'gulp-version-number'
import webp from 'gulp-webp'
import webpcss from 'gulp-webpcss'
import sourcemaps from 'gulp-sourcemaps'
import zip from 'gulp-zip'
import vinylFtp from 'vinyl-ftp'
import webpack from 'webpack'
import webpackStream from 'webpack-stream'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import less from 'gulp-less'

const scss = gulpSass(dartSass)
import sassglob from 'gulp-sass-glob'

let isProd = false

function server() {
	browserSync.init({
		// Initialize Browsersync
		server: { baseDir: 'dist/' }, // Specify the server directory
		notify: false, // Disable notifications
		online: true, // Set online mode to true
	})
}

function html() {
	return src('src/*.html')
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
		.pipe(dest('dist/'))
		.pipe(browserSync.stream())
}

function styles() {
	return src(
		'src/assets/templates/styles/' + preprocessor + '/main.' + preprocessor + ''
	)
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
		.pipe(eval(preprocessor)())
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
		.pipe(dest('dist/assets/templates/css'))
		.pipe(browserSync.stream())
}

function js() {
	return src('src/assets/templates/js/main.js')
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
		.pipe(dest('dist/assets/templates/js'))
		.pipe(browserSync.stream())
}

function images() {
	return src('src/assets/templates/img/**/*.{jpg,jpeg,png,svg,ico,webp,gif}')
		.pipe(src('src/assets/templates/img/**/*.{jpg,jpeg,png,svg,ico,gif}'))
		.pipe(webp())
		.pipe(src('src/assets/templates/img/**/*.{jpg,jpeg,png,svg,ico,gif}'))
		.pipe(gulpif(isProd, imagemin()))
		.pipe(dest('dist/assets/templates/img'))
		.pipe(browserSync.stream())
}

function svgSprites() {
	return src('src/assets/templates/svgicons/*.svg')
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
		.pipe(dest('dist/assets/templates/img'))
		.pipe(browserSync.stream())
}

function resources() {
	return src('src/assets/templates/resources/**/*.*')
		.pipe(dest('dist/'))
		.pipe(browserSync.stream())
}

function fonts() {
	return src('src/assets/templates/fonts/*.{woff,woff2}').pipe(
		dest('dist/assets/templates/fonts')
	)
}

function clean() {
	return del('dist/')
}

function startWatch() {
	watch('src/**/*.html', html)
	watch('src/assets/templates/styles/**/' + preprocessor + '/**/*', styles)
	watch('src/assets/templates/js/**/*.js', js)
	watch('src/assets/templates/img/**/*.{jpg,jpeg,png,svg,ico,webp,gif}', images)
	watch('src/assets/templates/svgicons/*.svg', svgSprites)
	watch('src/assets/templates/resources/**/*.*', resources)
	watch('src/assets/templates/fonts/*.{woff,woff2}', resources)
}

function toProd(done) {
	isProd = true
	done()
}

export {
	html,
	styles,
	js,
	svgSprites,
	images,
	resources,
	fonts,
	server,
	clean,
	startWatch,
}

export default series(
	clean,
	parallel(
		html,
		styles,
		js,
		svgSprites,
		images,
		resources,
		fonts,
		parallel(server, startWatch)
	)
)

export const build = series(
	toProd,
	html,
	styles,
	js,
	svgSprites,
	images,
	resources,
	fonts
)