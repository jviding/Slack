/* Use the following script:
 * <script src="//localhost:35729/livereload.js"></script>
 * in the end of templates when developing with Grunt watch.
 */
module.exports = function(grunt) {

  // Use webpack for bundling and minifying React
  var webpack = require('webpack');
  // Webpack behaviour depends on dev/production mode
  var development = require('./config/settings').DEBUG;
  var webPackMinifyRoot = (development ? 'assets' : 'public');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // Check js files for correct syntax
    jshint: {
    	options: {
    		reporter: require('jshint-stylish')
    	},
    	build: ['Gruntfile', 'app/js/*.js']
    },
    // Compile JSX into JS
    babel: {
      options: {
        plugins: ['transform-react-jsx'],
        presets: ['es2015', 'react']
      },
      jsx: {
        files: [
          {expand: true, cwd: 'app/jsx/chatroom/', src: '*.jsx', dest: 'assets/js/dist/', ext: '.js'},
          {expand: true, cwd: 'app/jsx/home/', src: '*.jsx', dest: 'assets/js/dist/', ext: '.js'},
          {expand: true, cwd: 'app/jsx/login/', src: '*.jsx', dest: 'assets/js/dist/', ext: '.js'}
        ]
      }
    },
    // Bundle up React components
    webpack: {
      options: {
        loader: 'babel',
        presets: ['es2015', 'react'],
        plugins: (development ? [] : [
          new webpack.DefinePlugin({
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
          }),
          new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: true
            }
          })
        ])
      },
      chatroom: {
        entry: './assets/js/dist/chatroom.js',
        output: {
          path: webPackMinifyRoot+'/js/',
          filename: 'chatroom.js'
        }
      },
      home: {
        entry: './assets/js/dist/home.js',
        output: {
          path: webPackMinifyRoot+'/js/',
          filename: 'home.js'
        }
      },
      login: {
        entry: './assets/js/dist/login.js',
        output: {
          path: webPackMinifyRoot+'/js/',
          filename: 'login.js'
        }
      },
    },
    // Minify JS
    uglify: {
      all: {
        files: [
          {expand: true, cwd: 'app/js/', src: '*.js', dest: 'public/js/', ext: '.js'}, 
          {expand: true, cwd: 'assets/js/', src: '*.js', dest: 'public/js/', ext: '.js'}
        ]
      }
    },
    // Compile LESS into CSS
    less: {
    	build: {
    		files: [
          {expand: true, cwd: 'app/less/', src: '*.less', dest: 'assets/css/', ext: '.css'}
        ]
    	}
    },
    // Minify CSS
    cssmin: {
    	build: {
    		files: [
          {expand: true, cwd: 'app/css/', src: '*.css', dest: 'public/css/', ext: '.css'}, 
          {expand: true, cwd: 'assets/css/', src: '*.css', dest: 'public/css/', ext: '.css'}
        ]
    	}
    },
    // Run all on a change in a file
    watch: {
      options: {
        livereload: true
      },
    	stylesheets: {
    		files: ['app/less/*.less'],
    		tasks: ['less'],
    	},
    	scripts: {
    		files: ['app/jsx/*/*.jsx'],
    		tasks: ['babel', 'webpack'],
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      templates: {
        files: ['views/*.ejs']
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-webpack');

  // Create tasks
  grunt.registerTask('default', ['babel', 'webpack', 'less', 'cssmin']);

};