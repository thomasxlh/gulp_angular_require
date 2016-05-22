'use strict';


var gulpConfigs = require('./gulpconfig.js'),
    gulp = require('gulp'),
    connect = require('gulp-connect'),
    open = require('gulp-open'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    less = require('gulp-less'),
    minifycss = require('gulp-minify-css'),
    autoprefixer = require('less-plugin-autoprefix'),
    rjs = require('gulp-requirejs'),
    stylish = require('jshint-stylish'),
    //webpack = require('webpack'),
//    webpackConfig = require('./webpack.config.js'),
    jshint = require('gulp-jshint');

var cnd = require('./node_modules/grunt-local-cnd/lib/cdn');

gulpConfigs = gulpConfigs.setConfig();


/** about server**/
gulp.task('local-cdn', function () {
    var options = {
        port: '55635',
        repositoryDir: process.env['CND_DIR'] || 'C:\\sandbox\\cdn',
        verbose: false
    };
    var done = function () {
        console.info('cdn started ...');
    };
    cdn.start(options, done);
});
gulp.task('connect', function () {
    var config = gulpConfigs.serverConfig.web;
    var root = './';

    connect.server({
        root: root,
        host: config.hostname, //if you want use the ip to load web it should be set like 19.168.90.9
        port: config.port,
        livereload: true
    });
});
gulp.task('open', function () {
    var config = gulpConfigs.serverConfig.web;
    var root = '/node_modules/[server]/';
    var url = 'http://' + config.hostname + ';' + config.port + root;
    var options = {
        uri: url,
        app: 'chrome'
    };
    gulp.src('')
        .pipe(open(options))
        .on('error', gulpConfigs.errorHandle);
});

/*
 gulp.task('open', function () {
 var options = {
 url: 'http://localhost:9000'
 };
 gulp.src('./dist/index.html') //this must be a valid and existing path.
 .pipe(open('<%file.path%>', options));
 });
 */

/** about javascript **/
gulp.task('jshint', function () {
    var stream = gulp.src('./src/**/*.js')
        .pipe(jshint())
        .on('error', gulpConfigs.errorHandle)
        .pipe(jshint.reporter(stylish));
    //.pipe(jshint.reporter('fail'))

    return stream;
});
gulp.task('requirejs', function () {
    var config = {
        baseUrl: './src/',
        name: gulpConfigs.moduleConfig.name,
        put: gulpConfigs.moduleConfig.buildDist + '/'
    };
    var stream = rjs({
        optimize: 'none',
        baseUrl: './src/',
        include: gulpConfigs.moduleConfig.name,
        exclude: gulpConfigs.excludeDeps,
        paths: gulpConfigs.mockPathsForDeps,
        out: gulpConfigs.moduleConfig.name + 'js'
    })
        .pipe(gulp.dest(config.out))
        .on('error', gulpConfigs.errorHandle)
        .pipe(connect.reload());

    return stream;
});
gulp.task('uglify', function () {
    var stream = gulp.src(['./dist/artifacts/[MODULE].js'])
        .pipe(rename({suffix: '.min'}))
        .on('error', gulpConfigs.errorHandle)
        .pipe(uglify({
            outSourceMap: true
        }))
        .on('error', gulpConfigs.errorHandle)
        .pipe(gulp.dest(gulpConfigs.moduleConfig.buildDist + '/'));

    return stream;
});
//gulp.task('webpack',function(done) {
//    var myConfig = Object.create(webpackConfig);
//    var error;
//    webpack(myConfig, function(err, status) {
//        error = new Error(err + ':' +status);
//        gulpConfigs.errorHandle(error);
//        done();
//    });
//});

/** about less and css **/
gulp.task('less', function () {
    var autoPrefixerPlugin = new autoprefixer({browsers: ['last 2 version', 'safari 5', 'ie 7', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']});
    var stream = gulp.src(['./src/styles/[MODULE].less'])
        .pipe(less({
            plugins: [autoPrefixerPlugin]
        }))
        .on('error', gulpConfigs.errorHandle)
        .pipe(gulp.dest(gulpConfigs.moduleConfig.buildDist + '/'))
        .on('error', gulpConfigs.errorHandle)
        .pipe(connect.reload());

    return stream;
});
gulp.task('watch:less', function () {
    gulp.watch('src/styles/**/*.less', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running less tasks...');
        gulp.start('less');
    });
});
gulp.task('minifycss', function () {
    var stream = gulp.src(['./dist/artifacts/[MODULE].css'])
        .pipe(rename({suffix: '.min'}))
        .on('error', gulpConfigs.errorHandle)
        .pipe(minifycss())
        .on('error', gulpConfigs.errorHandle)
        .pipe(gulp.dest(gulpConfigs.moduleConfig.buildDist + '/'));

    return stream;
});

/** about test**/
gulp.task('karma-test', ['local-cdn'], function (done) {
    new Server({
        configFile: __dirname + '/test/cfg/unit/karma-unit.conf.js',
        singleRun: true,
        autoWatch: true,

        prot: gulpConfigs.testConfig.test.port,
        runnerPort: gulpConfigs.testConfig.test.port + 20,
        browsers: gulpConfigs.testConfig.test.browsers,
        preprocessors: {
            'ser/[module]/**/*.js': 'coverage'
        },
        coverageReporter: {
            dir: gulpConfigs.moduleConfig.coverageDist,
            reporters: [
                {type: 'html', dir: gulpConfigs.moduleConfig.coverageDist},
                {type: 'teamcity'},
                {type: 'text-summary'}
            ]
        },
        reporters: ['teamcity', 'coverage']
    }, done).start()
});

/** about watch **/
gulp.task('watch:html', function () {
    gulp.watch('src/[MODULE]/**/*.html', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running watch:html tasks...');
        gulp.start('requirejs');
    });
});
gulp.task('watch:js', function () {
    gulp.watch('src/scripts/**/*.js', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running requirejs tasks...');
        gulp.start(/*'webpack',*/'requirejs');
    });
});
gulp.task('watch', function () {
    gulp.start('watch:less', 'watch:html', 'watch:js');
});

gulp.task('dev', /*['webpack],*/ function () {
    gulp.start('local-cdn', 'requirejs', 'less', 'connect', 'open', 'watch');
});

gulp.task('build', function () {
    gulp.start('minifycss', 'uglify');
});
