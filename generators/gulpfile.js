var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('browserify', function() {
    console.log("running browserify");
    return browserify('./js/script.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('bundle.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./build/'))
        .pipe(reload({stream:true}));
});

gulp.task('default', ['browser-sync', 'browserify'], function() {
  gulp.watch("js/*.js", ['browserify'])
});
