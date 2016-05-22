'use strict';
var gutil = require('gulp-util');

module.exports = {
    testConfig:{
        //Defines: Web server ports for Karma. An extra port is created by added 50 to these ports.
        //and browsers to run on. Available browsers:
        // - Chrome, ChromeCanary, Firefox, Opera, Safari (only Mac), PhantomJS, IE (only Windows)
        test: {
            port: 23000,
            browsers:['PhantomJS', 'Chrome', 'Firefox']
        },
        build: {
            port: 23100,
            browsers:['PhantomJS', 'Chrome', 'Firefox']
        },
        postBuild: {
            port: 23200,
            browsers:['PhantomJS']
        }
    },

    serverConfig:{
        web: {
            port: 23500,
            hostname: 'localhost'
        },
        e2e: {
            port: 23900,
            hostname: 'localhost'
        },
    },

    moduleConfig: {
        name: 'this.manifest().name',
        root: '.',
        dist: 'dist',
        buildDist: './dist/artifacts',
        coverageDist: './dist/coverage',
        bareDist: './dist/artifacts/bare'
    },

    mockPathsForDeps:{},
    excludeDeps:{},
    mountFolder: function(connect, dir) {
        return connect.static(require('path').resolve(dir));
    },

    errorHandle: function(error){
        if(!error){
            gutil.log(gutil.colors.red('compile error: ' + error.messate));
            //this.emit(); //submit
        }
    },

    setConfig: function(){
        var requirejs = require('requirejs'),
            allDeps,
            plugins = ['text'],
            manifest,
            self = this;

        requirejs.config({
                baseUrl:'.',
                nodeRequire: require
            });

        manifest = requirejs('./src/manifest.js');
        this.moduleConfig['name'] = manifest.name;

        allDeps = Object.keys(manifest.dependencies).concat(['angular', 'make-class', 'uui-core-utils', 'event-bus', 'jquery', 'lodash', 'q', 'evolve-feature-services']);

        this.mockPathsForDeps = {};
        this.excludeDeps = allDeps.concat(plugins);

        this.excludeDeps.map(function(item){
            self.mockPathsForDeps[item] = 'empty:';
        });
        this.mockPathsForDeps['text'] = '../node_modules/require-plugins/text/text';
        return this;
    }

};
