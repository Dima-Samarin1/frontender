export const resources = () => {
  return app.gulp.src(`${app.path.resourcesFolder}/**`, { encoding: false })
    .pipe(app.plugins.plumber(
      app.plugins.notify.onError({
        title: "RESOURCES",
        message: "Error: <%= error.message %>"
      })
    ))
    .pipe(app.gulp.dest(app.path.buildFolder)) // Копирует напрямую в ./dist
    .pipe(app.plugins.browserSync.stream());
}