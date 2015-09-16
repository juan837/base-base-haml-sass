'use strict';

var gulp = require('gulp');
var path = require('path');
var sass = require('gulp-sass');
var $ = require('gulp-load-plugins')();

var paths = {
    src: 'src',
    tmp: '.tmp',
    dist: 'entregable',
    coffee: 'src/coffee/**/*.coffee',
    componentes: 'src/componentes/',
    sass: 'src/stylesheets/**/*.scss',
    stylesheets: 'src/stylesheets/**/*.{sass,scss,css}',
    pagesdefault : 'src/templates/pages/default/*.haml',
    pagesothers: 'src/templates/pages/others/*.haml',
    partials: 'src/templates/partials/**/*.haml',
    layouts: 'src/templates/layouts/*.haml',
    images: 'src/images/**/*',
    fonts: 'src/fonts/**/*.{eot,svg,ttf,woff}'
};

gulp.task('connect', function() {
    $.connect.server({
        root: [paths.tmp, paths.src],
        livereload: true,
        port: 9000,
    });
});

gulp.task('sass', function () {
    return gulp.src(paths.stylesheets)
        .pipe(sass())
        .pipe(gulp.dest(path.join(paths.tmp, 'stylesheets')))
        .pipe($.connect.reload());
});

gulp.task('coffee', function() {
    gulp.src(paths.coffee)
        .pipe($.coffee({bare: true}).on('error', $.util.log))
        .pipe(gulp.dest(path.join(paths.componentes, 'javascripts')))
        .pipe($.connect.reload());
});

//tareas de creacion de paginas a partir de un layout y parciales

//asi se compilaran los layouts
gulp.task('armar:layouts', function(){
    return gulp.src(paths.layouts)
        .pipe($.plumber())
        .pipe($.rubyHaml())
        .pipe($.prettify())
        .pipe(gulp.dest(path.join(paths.tmp, 'layouts')))
});

//asi se compilaran las parciales
gulp.task('armar:partials', function(){
    return gulp.src(paths.partials)
        .pipe($.plumber())
        .pipe($.rubyHaml())
        .pipe($.prettify())
        .pipe(gulp.dest(path.join(paths.tmp,'partials')))
});

// aca se mezclaran los elementos del layouts y parciales con gulp-assemble
gulp.task('armar-default',['armar:layouts', 'armar:partials'], function() {
    return gulp.src(paths.pagesdefault)
        .pipe($.plumber())
        .pipe($.rubyHaml())
        .pipe($.prettify())
        .pipe($.assemble({
            partials: path.join(paths.tmp, 'partials', '**/*.html'),
            layoutdir: path.join(paths.tmp, 'layouts'),
            layout: 'default',
            layoutext: '.html',
        }))
        .pipe(gulp.dest(paths.tmp))
        .pipe($.connect.reload());
});

gulp.task('armar-otras',['armar:layouts', 'armar:partials'], function() {
    return gulp.src(paths.pagesothers)
        .pipe($.plumber())
        .pipe($.rubyHaml())
        .pipe($.prettify())
        .pipe($.assemble({
            partials: path.join(paths.tmp, 'partials', '**/*.html'),
            layoutdir: path.join(paths.tmp, 'layouts'),
            layout: 'others',
            layoutext: '.html',
        }))
        .pipe(gulp.dest(paths.tmp))
        .pipe($.connect.reload());
});

// aca se coloca la tarea de compresion de imagenes
gulp.task('images', function(){
    return gulp.src(paths.images)
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true,
        })))
        .pipe(gulp.dest(path.join(paths.dist, 'images')));
});

gulp.task('html', ['armar-default','armar-otras', 'sass'], function() {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src(path.join(paths.tmp, '*.html'))
        .pipe($.plumber())
        .pipe($.useref.assets({searchPath: [paths.tmp, paths.src]}))
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest(paths.dist));
});

// aca se coloca la tarea de limpiar elimina la carpeta .tmp y entregable
gulp.task('limpiar', require('del').bind(null, [paths.tmp, paths.dist]));


// aca se coloca la tarea de armar toda la informacion del entregable
gulp.task('entregar', ['html', 'images', 'fonts']);

// aca se coloca la tarea de crear la carpeta de fuentes
gulp.task('fonts', function() {
    return gulp.src(paths.fonts)
        .pipe(gulp.dest(path.join(paths.dist, 'fonts')));
});

gulp.task('watch', function() {
    gulp.watch([paths.pagesdefault,paths.pagesothers, paths.partials, paths.layouts], ['armar-default','armar-otras']);
    //gulp.watch([paths.pagesothers, paths.partials, paths.layouts], ['armar-otras']);
    gulp.watch([paths.sass], ['sass']);
    gulp.watch([paths.coffee], ['coffee']);
});

gulp.task('default', ['connect', 'watch','armar-default','armar-otras','sass','coffee']);