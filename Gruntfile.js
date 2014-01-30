/*jshint smarttabs:true */
/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* https://github.com/TranscendComputing/StackStudio\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
      'Transcend Computing; Licensed APL2 */'
    },
    source: {
      files: ['js/interpreters/**/*.js',
      'js/models/**/*.js',
      'js/views/**/*.js',
      'js/collections/**/*.js',
      'js/aws/**/*.js',
      'js/openstack/**/*.js']
    },
    spec: {
      files: ['spec/**/*.js']
    },
    lint: {
      files: ['Gruntfile.js',
      'js/stackplace.build.js',
      '<%= source.files %>']
    },
    concat: {
      options: {
        stripBanners: true,
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: ['js/main.js', 'js/plugins.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        stripBanners: true,
        banner: '<%= meta.banner %>'
      },
      misc: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= source.files %>', '<%= concat.dist.dest %>']
        }
      }
    },
    // Download some CDN assets to serve as backups (served locally as last resort)
    curl: {
      'js/vendor/require.js': 'http://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.5/require.min.js',
      'js/vendor/jquery.js': 'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js',
      'js/vendor/jquery.dataTables.js': 'http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/jquery.dataTables.js',
      'js/vendor/dataTables.bootstrap.js': 'https://raw.github.com/DataTables/Plugins/master/integration/bootstrap/3/dataTables.bootstrap.js',
      'css/dataTables.bootstrap.css': 'https://raw.github.com/DataTables/Plugins/master/integration/bootstrap/3/dataTables.bootstrap.css',
      'js/vendor/ace/ace.js': 'https://github.com/ajaxorg/ace-builds/blob/master/src-min/ace.js',
      'js/vendor/backbone.js': 'http://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min.js',
      'js/vendor/lodash.js': 'http://cdnjs.cloudflare.com/ajax/libs/lodash.js/1.1.0/lodash.min.js',
      'js/vendor/jquery-ui.js': 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js',
      'js/vendor/jquery.jstree.js': 'http://cdn.jsdelivr.net/jquery.jstree/pre1.0/jquery.jstree.js',
      'js/vendor/jquery.terminal.js': 'http://cdn.jsdelivr.net/jquery.terminal/0.7.8/jquery.terminal-min.js',
      'js/vendor/ICanHaz.js': 'https://raw.github.com/HenrikJoreteg/ICanHaz.js/master/ICanHaz.js',
      'js/vendor/twitter/typeahead.js': 'http://cdn.jsdelivr.net/typeahead.js/0.9.3/typeahead.min.js',
      'js/vendor/URI/URI.js': 'http://cdn.jsdelivr.net/uri.js/1.10.2/URI.js',
      'js/vendor/URI/punycode.js': 'http://cdn.jsdelivr.net/uri.js/1.10.2/punycode.js',
      'js/vendor/URI/IPv6.js': 'http://cdn.jsdelivr.net/uri.js/1.10.2/IPv6.js',
      'js/vendor/URI/SecondLevelDomains.js': 'http://cdn.jsdelivr.net/uri.js/1.10.2/SecondLevelDomains.js'
    },
    clean: ['js/vendor/require.js',
      'js/vendor/jquery.js',
      'js/vendor/jquery.dataTables.js',
      'js/vendor/ace/ace.js',
      'js/vendor/backbone.js',
      'js/vendor/lodash.js',
      'js/vendor/jquery-ui.js',
      'js/vendor/jquery.jstree.js',
      'js/vendor/jquery.terminal.js',
      'js/vendor/ICanHaz.js',
      'js/vendor/twitter/typeahead.js',
      'js/vendor/URI/URI.js',
      'js/vendor/URI/punycode.js',
      'js/vendor/URI/IPv6.js',
      'js/vendor/URI/SecondLevelDomains.js'
    ],
    watch: {
      files: '<%= lint.files %>',
      tasks: 'default'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        smarttabs: true,
        devel:true,
        globals: {
          jQuery: true,
          console: true,
          require: true,
          requirejs: true
        }
      },
      source_files: '<%= lint.files %>',
      spec_files: {
        options: {
          globals: {
            describe: true,
            it: true,
            expect: true
          }
        },
        files: {
          src: '<%= spec.files %>'
        }
      }
    },
    server: {
      port: 9002
    },
    connect: {
      sstudio: {
        options: {
          port: 9001,
          hostname: "*"
        }
      },
      test : {
        port : 9002
      }
    },
    selenium: {
      options: {
        startURL: 'http://localhost:9001/',
        browsers: ['firefox']
      },
      suite: {
        files: {
          'StackStudio': ['test/*.suite']
        }
      }
    },
    jasmine: {
      test: {
        options: {
          specs: '<%= spec.files %>',
          template: require('grunt-template-jasmine-requirejs'),
          templateOptions: {
            requireConfig: {
              baseUrl: '',
                        // The shim config allows us to configure dependencies for
                        // scripts that do not call define() to register a module
                        shim: {
                          'jquery-ui': {
                            deps: ['jquery']
                          },
                          'underscore': {
                            exports: '_'
                          },
                          'backbone': {
                            deps: [
                            'underscore',
                            'jquery'
                            ],
                            exports: 'Backbone'
                          },
                          'icanhaz': {
                            deps: ['jquery'],
                            exports: 'ich'
                          },
                          'jquery.terminal': {
                            deps: ['jquery', 'jquery.mousewheel'],
                            exports: 'jQuery.fn.terminal'
                          },
                          'jquery.dataTables': {
                            deps: ['jquery'],
                            exports: 'jQuery.fn.dataTable'
                          },
                          'jquery.purr': {
                            deps: ['jquery'],
                            exports: 'jQuery.fn.purr'
                          },
                          'jquery.mousewheel': {
                            deps: ['jquery'],
                            exports: 'jQuery.fn.mousewheel'
                          }
                        },
                        paths: {
                          collections: 'js/collections',
                          models: 'js/models',
                          routers: 'js/routers',
                          views: 'js/views',
                          interpreters: 'js/interpreters',
                          'jquery': 'js/vendor/jquery-1.9.1.min',
                          'jquery-ui': 'js/vendor/jquery-ui',
                          'underscore': 'js/vendor/lodash',
                          'backbone': 'js/vendor/backbone',
                          'icanhaz': 'js/vendor/ICanHaz',
                          'jquery.terminal': 'js/vendor/jquery.terminal-0.7.3',
                          'jquery.mousewheel': 'js/vendor/jquery.mousewheel-min'
                        }
                      }
                    }
                  }
                }
              },
              less: {
                "2.0.0-rc1": {
                  options: {
                    paths: ["css"],
                    compress: true
                  },
                  files: {
                    "css/main.css": "css/main.less",
                    "css/jquery.dataTables.css": "css/jquery.dataTables.less",
                    "css/jquery.terminal.css": "css/jquery.terminal.less",
                    "css/jquery.multiselect.css": "css/jquery.multiselect.less",
                    "css/jquery.multiselect.filter.css": "css/jquery.multiselect.filter.less",
                    "css/jquery-ui.css": "css/jquery-ui.less",
                    "css/morris.css": "css/morris.less",
                    "css/opentip.css": "css/opentip.less"
                  }
                }
              }
            });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-selenium');
  grunt.loadNpmTasks('grunt-curl');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Default task.
  grunt.registerTask('test', ['jshint', 'less', 'curl', 'jasmine']);
  grunt.registerTask('default', ['jshint', 'less', 'curl', 'jasmine']);
  grunt.registerTask('run', ['jshint', 'less', 'curl', 'connect:sstudio', 'watch']);
  grunt.registerTask('build', ['jshint', 'curl', 'jasmine', 'concat', 'uglify']);
  grunt.registerTask('uncurl', ['clean']);

};
