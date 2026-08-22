
import gulp from 'gulp'

import { path } from './gulp/config/path.js'
import { plugins } from './gulp/config/plugins.js'

global.app = {
  isBuild: process.argv.includes('--build'),
  isDev: !process.argv.includes('--build'),
  path: path,
  gulp: gulp,
  plugins: plugins,
}

import { reset } from './gulp/tasks/reset.js'
import { html } from './gulp/tasks/html.js'
import { server } from './gulp/tasks/server.js'
import { scss } from './gulp/tasks/scss.js'
import { js } from './gulp/tasks/js.js'
import { images } from './gulp/tasks/images.js'
import { svgSprive } from './gulp/tasks/svgSprite.js'
import { zip } from './gulp/tasks/zip.js'
import { convertFonts, fontsStyle } from './gulp/tasks/fonts.js'
import { resources } from './gulp/tasks/resources.js' 

export { svgSprive }

const fonts = gulp.series(convertFonts, fontsStyle)

function watcher() {
  gulp.watch(path.watch.resources, resources) 
  gulp.watch(path.watch.html, html)
  gulp.watch(path.watch.scss, scss)
  gulp.watch(path.watch.js, js)
  gulp.watch(path.watch.images, images)
}
const mainTasks = gulp.series(fonts, gulp.parallel(resources, html, scss, js, images))

const dev = gulp.series(reset, mainTasks, gulp.parallel(watcher, server))
const build = gulp.series(reset, mainTasks)
const deployZIP = gulp.series(reset, mainTasks, zip)

export { dev, build, deployZIP }

gulp.task('default', dev)