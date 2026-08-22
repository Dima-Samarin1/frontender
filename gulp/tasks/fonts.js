import fs from 'fs'
import path from 'path'
import ttf2woffEngine from 'ttf2woff'
import ttf2woff2Engine from 'ttf2woff2'

export const convertFonts = (done) => {
  // path.resolve гарантирует правильные слэши для любой ОС (Windows / Linux / macOS)
  const srcFontsFolder = path.resolve(app.path.srcFolder, 'fonts')
  const buildFontsFolder = path.resolve(app.path.build.fonts)

  // Если папки с исходными шрифтами нет — безопасно завершаем
  if (!fs.existsSync(srcFontsFolder)) {
    done()
    return
  }

  // Создаем папку назначения в dist, если ее нет
  if (!fs.existsSync(buildFontsFolder)) {
    fs.mkdirSync(buildFontsFolder, { recursive: true })
  }

  const files = fs.readdirSync(srcFontsFolder)

  files.forEach((file) => {
    const ext = path.extname(file).toLowerCase()
    const fileName = path.basename(file, ext)

    // Обрабатываем .ttf и .otf. Если их нет — цикл не упадет
    if (ext === '.ttf' || ext === '.otf') {
      const filePath = path.join(srcFontsFolder, file)
      const inputBuffer = fs.readFileSync(filePath)

      // 1. Конвертация в .woff
      const woffPath = path.join(buildFontsFolder, `${fileName}.woff`)
      if (!fs.existsSync(woffPath)) {
        const woffBuffer = Buffer.from(ttf2woffEngine(inputBuffer).buffer)
        fs.writeFileSync(woffPath, woffBuffer)
      }

      // 2. Конвертация в .woff2
      const woff2Path = path.join(buildFontsFolder, `${fileName}.woff2`)
      if (!fs.existsSync(woff2Path)) {
        const woff2Buffer = ttf2woff2Engine(inputBuffer)
        fs.writeFileSync(woff2Path, woff2Buffer)
      }
    }
  })

  done()
}

export const fontsStyle = (done) => {
  const fontsFile = path.resolve(app.path.srcFolder, 'scss', 'fonts.scss')
  const buildFontsFolder = path.resolve(app.path.build.fonts)

  if (!fs.existsSync(buildFontsFolder)) {
    done()
    return
  }

  const fontsFiles = fs.readdirSync(buildFontsFolder)

  if (fontsFiles && fontsFiles.length > 0) {
    if (!fs.existsSync(fontsFile)) {
      fs.writeFileSync(fontsFile, '')
      let newFileOnly

      for (let i = 0; i < fontsFiles.length; i++) {
        const fontFileName = fontsFiles[i].split('.')[0]

        if (newFileOnly !== fontFileName) {
          const fontName = fontFileName.split('-')[0]
            ? fontFileName.split('-')[0]
            : fontFileName
          const rawWeight = fontFileName.split('-')[1]
            ? fontFileName.split('-')[1].toLowerCase()
            : fontFileName.toLowerCase()

          let fontWeight = 400

          if (rawWeight.includes('thin')) {
            fontWeight = 100
          } else if (rawWeight.includes('extralight')) {
            fontWeight = 200
          } else if (rawWeight.includes('light')) {
            fontWeight = 300
          } else if (rawWeight.includes('medium')) {
            fontWeight = 500
          } else if (rawWeight.includes('semibold')) {
            fontWeight = 600
          } else if (rawWeight.includes('bold')) {
            fontWeight = 700
          } else if (
            rawWeight.includes('extrabold') ||
            rawWeight.includes('heavy')
          ) {
            fontWeight = 800
          } else if (rawWeight.includes('black')) {
            fontWeight = 900
          }

          const fontTemplate = `@font-face {\n\tfont-family: ${fontName};\n\tfont-display: swap;\n\tsrc: url("../fonts/${fontFileName}.woff2") format("woff2"), url("../fonts/${fontFileName}.woff") format("woff");\n\tfont-weight: ${fontWeight};\n\tfont-style: normal;\n}\n`

          fs.appendFileSync(fontsFile, fontTemplate)
          newFileOnly = fontFileName
        }
      }
    } else {
      console.log(
        'Файл scss/fonts.scss уже существует. Для обновления файла его нужно удалить!',
      )
    }
  }

  done()
}