import webp from "gulp-webp";
import imagemin, { mozjpeg, optipng } from "gulp-imagemin";

export const images = () => {
  return app.gulp.src([app.path.src.images, app.path.src.svg], { encoding: false })
    .pipe(app.plugins.plumber(
      app.plugins.notify.onError({
        title: "IMAGES",
        message: "Error: <%= error.message %>"
      })
    ))
    .pipe(app.plugins.newer(app.path.build.images))

    // 1. Создаем WebP и сохраняем
    .pipe(app.plugins.if(app.isBuild, webp()))
    .pipe(app.plugins.if(app.isBuild, app.gulp.dest(app.path.build.images)))

    // 2. Возвращаем исходные файлы (JPG/PNG/SVG) в поток
    .pipe(app.plugins.if(app.isBuild, app.gulp.src([app.path.src.images, app.path.src.svg], { encoding: false })))
    .pipe(app.plugins.if(app.isBuild, app.plugins.newer(app.path.build.images)))

    // 3. Сжимаем с контролем качества (Lossy Compression)
    .pipe(app.plugins.if(app.isBuild, imagemin([
      mozjpeg({ quality: 75, progressive: true }),
      optipng({ optimizationLevel: 5 })
    ], {
      svgoPlugins: [{ removeViewBox: false }],
      verbose: true // Выведет в консоль разницу до/после
    })))

    // 4. Финальное сохранение
    .pipe(app.gulp.dest(app.path.build.images))
    .pipe(app.plugins.browserSync.stream());
}