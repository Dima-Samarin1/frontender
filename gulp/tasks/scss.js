import fs from 'fs'
import path from 'path'
import { Transform } from 'node:stream'

import { src, dest } from 'gulp'
import dartSass from 'sass'
import gulpSass from 'gulp-sass'

import autoprefixer from 'gulp-autoprefixer'
import groupCssMediaQueries from 'gulp-group-css-media-queries'

const sass = gulpSass(dartSass)

export const scss = () => {
  const webpCss = () => {
    return new Transform({
      objectMode: true,

      transform(file, encoding, callback) {
        if (file.isNull()) {
          callback(null, file)
          return
        }

        if (file.isStream()) {
          callback(new Error('Streams are not supported'))
          return
        }

        let css = file.contents.toString()

        css = css.replace(
          /([^{}]+)\{([^{}]*)\}/g,
          (match, selector, declarations) => {
            if (!/url\(\s*["']?[^"')]+\.(?:jpe?g|png)["']?\s*\)/i.test(declarations)) {
              return match
            }

            const webpDeclarations = declarations.replace(
              /url\(\s*(["']?)([^"')]+)\.(jpe?g|png)\1\s*\)/gi,
              (urlMatch, quote, imagePath) => {
                return `url(${quote}${imagePath}.webp${quote})`
              }
            )

            return `\n\n.no-webp ${selector.trim()} {${declarations}}\n\n.webp ${selector.trim()} {${webpDeclarations}}`
          }
        )

        file.contents = Buffer.from(css)

        callback(null, file)
      }
    })
  }

  const minCss = () => {
    return new Transform({
      objectMode: true,

      transform(file, encoding, callback) {
        if (file.isNull()) {
          callback(null, file)
          return
        }

        if (file.isStream()) {
          callback(new Error('Streams are not supported'))
          return
        }

        // Принудительно сжимаем только минифицируемый файл через Dart Sass
        const compressed = dartSass.compileString(file.contents.toString(), {
          style: 'compressed'
        })

        file.contents = Buffer.from(compressed.css)

        const ext = path.extname(file.path)
        const name = path.basename(file.path, ext)
        const directory = path.dirname(file.path)

        file.path = path.join(
          directory,
          `${name}.min${ext}`
        )

        callback(null, file)
      }
    })
  }

  const componentsPath = path.resolve('./src/scss/components')
  const indexFile = path.join(componentsPath, '_index.scss')

  if (!fs.existsSync(componentsPath)) {
    fs.mkdirSync(componentsPath, { recursive: true })
  }

  const files = fs.readdirSync(componentsPath)
    .filter(file =>
      file.endsWith('.scss') &&
      file !== '_index.scss'
    )
    .sort()

  const content = files
    .map(file => {
      const name = file
        .replace(/^_/, '')
        .replace(/\.scss$/, '')

      return `@forward "${name}";`
    })
    .join('\n') + (files.length ? '\n' : '')

  const currentContent = fs.existsSync(indexFile)
    ? fs.readFileSync(indexFile, 'utf8')
    : null

  if (currentContent !== content) {
    fs.writeFileSync(indexFile, content, 'utf8')
  }

  const processCss = (isMinifiedFile) => {
    return src(app.path.src.scss, {
      sourcemaps: app.isDev && !isMinifiedFile
    })
      .pipe(app.plugins.plumber(
        app.plugins.notify.onError({
          title: 'SCSS',
          message: 'Error: <%= error.message %>'
        })
      ))
      .pipe(sass({
        outputStyle: 'expanded'
      }))
      .pipe(app.plugins.if(
        app.isBuild,
        groupCssMediaQueries()
      ))
      .pipe(app.plugins.if(
        app.isBuild,
        webpCss()
      ))
      .pipe(app.plugins.if(
        app.isBuild,
        autoprefixer({
          grid: true,
          overrideBrowserslist: ['last 3 versions'],
          cascade: !isMinifiedFile
        })
      ))
      .pipe(app.plugins.if(
        isMinifiedFile,
        minCss()
      ))
      .pipe(dest(app.path.build.css, {
        sourcemaps: app.isDev && !isMinifiedFile ? '.' : false
      }))
      .pipe(app.plugins.browserSync.stream())
  }

  return Promise.all([
    processCss(false),
    processCss(true)
  ])
}