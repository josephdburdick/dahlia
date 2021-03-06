'use strict';
// generated on 2014-10-10 using generator-gulp-webapp 0.1.0
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
const imagemin = require('gulp-imagemin');

gulp.task('styles', function () {
  return gulp.src('app/styles/main.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    .pipe($.autoprefixer('last 1 version'))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(gulp.dest('dist/styles'));
});


gulp.task('uncss', ['styles'], function () {
  return gulp.src('dist/styles/main.css')
    .pipe($.plumber())
    .pipe($.uncss({
      html: ['dist/*.html']
    }))
    .pipe($.cssnano())
    .pipe(gulp.dest('dist/styles'));
});

gulp.task('jshint', function () {
  return gulp.src('app/scripts/*.js')
    .pipe($.plumber())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.jshint.reporter('fail'));
});

gulp.task('views', function () {
    return gulp.src(['app/*.jade', '!app/layout.jade'])
        .pipe($.plumber())
        .pipe($.jade({pretty: true}))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('html', ['views', 'uncss'], function () {
  var lazypipe = require('lazypipe');
  var cssChannel = lazypipe()
    .pipe($.csso)
    .pipe($.replace, 'bower_components/bootstrap-sass/assets/fonts/bootstrap','fonts');
  var assets = $.useref.assets({searchPath: '{.tmp,app}'});

  return gulp.src('.tmp/*.html')
    .pipe($.plumber())
    .pipe(assets)
    // .pipe($.if('*.js', $.uglify()))
    // .pipe($.if('*.css', cssChannel()))
    .pipe(assets.restore())
    .pipe($.useref())
    // .pipe(gulp.dest('.tmp'))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('app/images/**/*')
    .pipe(imagemin(
      [ imagemin.gifsicle(), imagemin.jpegtran(), imagemin.optipng(), imagemin.svgo()],
      { verbose: true }
    ))
    .pipe(gulp.dest('dist/images'))
});

gulp.task('videos', function () {
  return gulp.src('app/videos/**/*')
    .pipe(gulp.dest('dist/videos'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')().concat('app/fonts/**/*'))
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', function () {
  return gulp.src([
    'CNAME',
    'app/*.*',
    '!app/*.jade',
    'node_modules/apache-server-configs/dist/.htaccess'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('connect', function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = require('connect')()
    .use(require('connect-livereload')({port: 35729}))
    .use(serveStatic('app'))
    .use(serveStatic('.tmp'))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use('/bower_components', serveStatic('bower_components'))
    .use(serveIndex('app'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('serve', ['connect', 'views', 'styles'], function () {
  require('opn')('http://localhost:9000');
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep())
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.jade')
    .pipe(wiredep({exclude: ['bootstrap-sass']}))
    .pipe(gulp.dest('app'));
});

gulp.task('watch', ['connect', 'views', 'serve'], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    '.tmp/*.html',
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', $.livereload.changed);
  gulp.watch('app/**/*.jade', ['views']);
  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['jshint']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('deploy', ['build'], function() {
  return gulp.src(['./dist/**/*'])
    .pipe($.ghPages()); //{remoteUrl: 'git@github.com:josephdburdick/Dahlia'}
});

gulp.task('build', ['views', 'html', 'images', 'videos', 'fonts', 'extras'], function () {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
