const gulp = require('gulp');
const uglify = require('gulp-uglify-es').default;
const { deleteAsync } = require('del');
const htmlmin = require('gulp-htmlmin');

gulp.task('default', () => {
    // place code for your default task here
});

gulp.task('build-clean', () => deleteAsync(['dist']));

gulp.task('build-js', () =>
    gulp.src([
        'src/common.js',
        'src/index.js',
        'src/options.js'
    ])
    .pipe(uglify())
    .pipe(gulp.dest('dist')));

gulp.task('build-html', () =>
    gulp.src([
        'src/index.html',
        'src/options.html'
    ])
    .pipe(htmlmin({
        collapseWhitespace: true,
        removeComments: true
    }))
    .pipe(gulp.dest('dist')));

gulp.task('build',
    gulp.series(
        'build-clean',
        'build-js',
        'build-html'));
