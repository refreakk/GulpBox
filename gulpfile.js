let gulp = require('gulp');
let gulpLoadPlugins = require('gulp-load-plugins');
let yargs = require('yargs');
let path = require('path');
let webpackConfig = require('./webpack.config');
//-- replace image dependence start (Gnatko Dima)
let rename = require("gulp-rename");
let replaces = require('gulp-replace');
let through = require('through2');
let del = require('del');
let debug = require('gulp-debug')
//-- replace image dependence end (Gnatko Dima)
let emittyPug;
let errorHandler;

//-- replace image vars start (Gnatko Dima)
let source = 'build', // директория в которую идет билд
    sourceImages = source+'/images', // директория в которой лежат картинки
    numberLetters = 50,
    thisimageList = [],
    thisnewImageList = [],
    thisImageReal = [],
    saveMassive = [],
    possibles = 'abcdefghijklmnopqrstuvwxyz0123456789';
//-- replace image vars end (Gnatko Dima)

let argv = yargs.default({
	cache: true,
	ci: false,
	debug: true,
	fix: false,
	minify: false,
	minifyHtml: null,
	minifyCss: null,
	minifyJs: null,
	minifySvg: null,
	notify: true,
	open: true,
	port: 3000,
	spa: false,
	throwErrors: false,
}).argv;

argv.minify = !!argv.minify;
argv.minifyHtml = argv.minifyHtml !== null ? !!argv.minifyHtml : argv.minify;
argv.minifyCss = argv.minifyCss !== null ? !!argv.minifyCss : argv.minify;
argv.minifyJs = argv.minifyJs !== null ? !!argv.minifyJs : argv.minify;
argv.minifySvg = argv.minifySvg !== null ? !!argv.minifySvg : argv.minify;

if (argv.ci) {
	argv.cache = false;
	argv.notify = false;
	argv.open = false;
	argv.throwErrors = true;
}

if (argv.minifyJs) {
	webpackConfig.mode = 'production';
} else {
	webpackConfig.mode = webpackConfig.mode || 'development';
}

let $ = gulpLoadPlugins({
	overridePattern: false,
	pattern: [
		'autoprefixer',
		'browser-sync',
		'connect-history-api-fallback',
		'cssnano',
		'emitty',
		'imagemin-mozjpeg',
		'merge-stream',
		'postcss-reporter',
		'postcss-scss',
		'stylelint',
		'uglifyjs-webpack-plugin',
		'vinyl-buffer',
		'webpack',
		'webpack-stream',
	],
	scope: [
		'dependencies',
		'devDependencies',
		'optionalDependencies',
		'peerDependencies',
	],
});

if (argv.throwErrors) {
	errorHandler = false;
} else if (argv.notify) {
	errorHandler = $.notify.onError('<%= error.message %>');
} else {
	errorHandler = null;
}

function svgoConfig(minify = argv.minifySvg) {
	return (file) => {
		let filename = path.basename(file.relative, path.extname(file.relative));

		return {
			js2svg: {
				pretty: !minify,
				indent: '\t',
			},
			plugins: [
				{
					cleanupIDs: {
						minify: true,
						prefix: `${filename}-`,
					},
				},
				{
					removeTitle: true,
				},
				{
					removeViewBox: false,
				},
				{
					sortAttrs: true,
				},
			],
		};
	};
}
//-- replace image start (Gnatko Dima)
function replaceArray(searchArray) {
    return through.obj(function(file, encoding, callback) {
        if (file.isStream()) {
            file.contents = searchArray.reduce(function (contents, search) {
                return contents.pipe(rs(search[0], search[1]));
            }, file.contents);
            return callback(null, file);
        }
        if (file.isBuffer()) {
            var result = searchArray.reduce(function (contents, search) {
                return contents
                .split(search[0])
                .join(search[1]);
            }, String(file.contents));
            file.contents = new Buffer(result);
            return callback(null, file);
        }
        callback(null, file);
    });
}

gulp.task('askallimagesreal', () => {
	return gulp.src(sourceImages+'/**/*.{jpg,png,jpeg,svg,gif}')
			.pipe(through.obj(function (file, enc, cb) {
				var arrayPath = sourceImages.split('/'),
					imgadr;
				arrayPath.shift();
				imgadr = file.path.split(arrayPath.join("/")+"/")[1];
				if( imgadr === undefined ){  // для windows путей
					imgadr = file.path.split(arrayPath.join("\\")+"\\")[1];
					imgadr = imgadr.replace(/\\/g,'/')
				}
				thisimageList.push(imgadr);
				thisImageReal.push(file.path);
				cb(null);
			}));
});

gulp.task('askallimages', () => {
    return gulp.src(sourceImages+'/**/*.{jpg,png,jpeg,svg,gif}')
        .pipe(rename(function (path) {
            var cache = '',
                fileCache = '';
            for( var i=0; i<Number(numberLetters); i++ ){
                cache += possibles.charAt(Math.floor(Math.random() * possibles.length));
            }
            path.basename = "img."+cache;
            fileCache += ( path.dirname!='.' ) ? path.dirname+"/" : '';
            fileCache += path.basename+path.extname;
            fileCache = fileCache.replace(/\\/g,'/'); // для windows путей
            thisnewImageList.push(fileCache);
        }))
        .pipe(gulp.dest(sourceImages))
        .on('end', function(){
            del(thisImageReal);
            for( var i=0; i<thisimageList.length; i++ ){
				saveMassive.push([thisimageList[i], thisnewImageList[i]])
			}
			console.log(saveMassive);
        });
});

gulp.task('replacehtmlimg', () => {
    return gulp.src(source+'/**/*.html')
            .pipe(debug())
            .pipe(replaceArray(saveMassive))
            .pipe(gulp.dest(source));
});

gulp.task('replacecssimg', () => {
    return gulp.src(source+'/**/*.css')
            .pipe(debug())
            .pipe(replaceArray(saveMassive))
            .pipe(gulp.dest(source));
});

gulp.task('replacejsimg', () => {
    return gulp.src(source+'/**/*.js')
            .pipe(debug())
            .pipe(replaceArray(saveMassive))
            .pipe(gulp.dest(source));
});
//-- replace image end (Gnatko Dima)
gulp.task('copy', () => {
	return gulp.src([
		'src/resources/**/*.*',
		'src/resources/**/.*',
		'!src/resources/**/.keep',
	], {
		base: 'src/resources',
		dot: true,
	})
		.pipe($.if(argv.cache, $.newer('build')))
		.pipe($.if(argv.debug, $.debug()))
		.pipe(gulp.dest('build'));
});

gulp.task('images', () => {
	return gulp.src('src/images/**/*.*')
		.pipe($.if(argv.cache, $.newer('build/images')))
		.pipe($.if(argv.debug, $.debug()))
		.pipe(gulp.dest('build/images'));
});

gulp.task('sprites:png', () => {
	const spritesData = gulp.src('src/images/sprites/png/*.png')
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.if(argv.debug, $.debug()))
		.pipe($.spritesmith({
			cssName: '_sprites.scss',
			cssTemplate: 'src/scss/_sprites.hbs',
			imgName: 'sprites.png',
			retinaImgName: 'sprites@2x.png',
			retinaSrcFilter: 'src/images/sprites/png/*@2x.png',
			padding: 2,
		}));

	return $.mergeStream(
		spritesData.img
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.vinylBuffer())
			.pipe($.imagemin())
			.pipe(gulp.dest('build/images')),
		spritesData.css
			.pipe(gulp.dest('src/scss'))
	);
});

gulp.task('sprites:svg', () => {
	return gulp.src('src/images/sprites/svg/*.svg')
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.if(argv.debug, $.debug()))
		.pipe($.svgmin(svgoConfig()))
		.pipe($.svgstore())
		.pipe($.if(!argv.minifySvg, $.replace(/^\t+$/gm, '')))
		.pipe($.if(!argv.minifySvg, $.replace(/\n{2,}/g, '\n')))
		.pipe($.if(!argv.minifySvg, $.replace('?><!', '?>\n<!')))
		.pipe($.if(!argv.minifySvg, $.replace('><svg', '>\n<svg')))
		.pipe($.if(!argv.minifySvg, $.replace('><defs', '>\n\t<defs')))
		.pipe($.if(!argv.minifySvg, $.replace('><symbol', '>\n<symbol')))
		.pipe($.if(!argv.minifySvg, $.replace('></svg', '>\n</svg')))
		.pipe($.rename('sprites.svg'))
		.pipe(gulp.dest('build/images'));
});

gulp.task('pug', () => {
	if (!emittyPug) {
		emittyPug = $.emitty.setup('src', 'pug', {
			makeVinylFile: true,
		});
	}

	if (!argv.cache) {
		gulp.src('src/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build'));

		gulp.src('src/ru/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build/ru'));

		gulp.src('src/es/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build/es'));

		gulp.src('src/de/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build/de'));

		gulp.src('src/fr/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build/fr'));

		gulp.src('src/it/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build/it'));

		gulp.src('src/zh/*.pug')
			.pipe($.plumber({
				errorHandler,
			}))
			.pipe($.if(argv.debug, $.debug()))
			.pipe($.pug({
				pretty: argv.minifyHtml ? false : '\t',
			}))
			.pipe(gulp.dest('build/zh'));

		return;

	}

	return new Promise((resolve, reject) => {
		emittyPug.scan(global.emittyPugChangedFile).then(() => {
			gulp.src('src/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build'))
				.on('end', resolve)
				.on('error', reject);

			gulp.src('src/ru/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build/ru'))
				.on('end', resolve)
				.on('error', reject);

			gulp.src('src/es/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build/es'))
				.on('end', resolve)
				.on('error', reject);

			gulp.src('src/de/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build/de'))
				.on('end', resolve)
				.on('error', reject);

			gulp.src('src/fr/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build/fr'))
				.on('end', resolve)
				.on('error', reject);

			gulp.src('src/it/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build/it'))
				.on('end', resolve)
				.on('error', reject);

			gulp.src('src/zh/*.pug')
				.pipe($.plumber({
					errorHandler,
				}))
				.pipe(emittyPug.filter(global.emittyPugChangedFile))
				.pipe($.if(argv.debug, $.debug()))
				.pipe($.pug({
					pretty: argv.minifyHtml ? false : '\t',
				}))
				.pipe(gulp.dest('build/zh'))
				.on('end', resolve)
				.on('error', reject);
		});
	});
});

gulp.task('scss', () => {
	return gulp.src([
		'src/scss/*.scss',
		'!src/scss/_*.scss',
	])
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.if(argv.debug, $.debug()))
		.pipe($.sourcemaps.init())
		.pipe($.sass().on('error', $.sass.logError))
		.pipe($.postcss([
			argv.minifyCss ?
				$.cssnano({
					autoprefixer: {
						add: true,
						browsers: ['> 0%'],
					},
					calc: true,
					discardComments: {
						removeAll: true,
					},
					zindex: false,
				})
				:
				$.autoprefixer({
					add: true,
					browsers: ['> 0%'],
				}),
		]))
		.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('build/css'));
});

gulp.task('js', () => {
	return gulp.src(webpackConfig.entry)
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.webpackStream(webpackConfig))
		.pipe(gulp.dest(webpackConfig.output.path));
});

gulp.task('lint:pug', () => {
	return gulp.src([
		'src/*.pug',
		'src/pug/**/*.pug',
		'src/ru/*.pug',
		'src/es/*.pug',
		'src/de/*.pug',
		'src/fr/*.pug',
		'src/it/*.pug',
		'src/zh/*.pug',
	])
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.pugLinter({
			failAfterError: !!argv.throwErrors,
		}));
});

gulp.task('lint:scss', () => {
	return gulp.src([
		'src/scss/**/*.scss',
		'!src/scss/vendor/**/*.scss',
	])
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.postcss([
			$.stylelint(),
			$.postcssReporter({
				clearReportedMessages: true,
				throwError: argv.throwErrors,
			}),
		], {
			parser: $.postcssScss,
		}));
});

gulp.task('lint:js', () => {
	return gulp.src([
		'*.js',
		'src/js/**/*.js',
		'!src/js/vendor/**/*.js',
	], {
		base: '.',
	})
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.eslint({
			fix: argv.fix,
		}))
		.pipe($.eslint.format())
		.pipe($.if((file) => file.eslint && file.eslint.fixed, gulp.dest('.')));
});

gulp.task('optimize:images', () => {
	return gulp.src('src/images/**/*.*')
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.if(argv.debug, $.debug()))
		.pipe($.imagemin([
			$.imagemin.gifsicle({
				interlaced: true,
			}),
			$.imagemin.optipng({
				optimizationLevel: 3,
			}),
			$.imageminMozjpeg({
				progressive: true,
				quality: 80,
			}),
		]))
		.pipe(gulp.dest('src/images'));
});

gulp.task('optimize:svg', () => {
	return gulp.src('src/images/**/*.svg', {
		base: 'src/images',
	})
		.pipe($.plumber({
			errorHandler,
		}))
		.pipe($.if(argv.debug, $.debug()))
		.pipe($.svgmin(svgoConfig(false)))
		.pipe(gulp.dest('src/images'));
});

gulp.task('watch', () => {
	gulp.watch([
		'src/resources/**/*.*',
		'src/resources/**/.*',
	], gulp.series('copy'));

	gulp.watch('src/images/**/*.*', gulp.series('images'));

	gulp.watch([
		'src/images/sprites/png/*.png',
		'src/scss/_sprites.hbs',
	], gulp.series('sprites:png'));

	gulp.watch('src/images/sprites/svg/*.svg', gulp.series('sprites:svg'));

	gulp.watch([
		'src/*.pug',
		'src/pug/**/*.pug',
		'src/ru/*.pug',
		'src/es/*.pug',
		'src/de/*.pug',
		'src/fr/*.pug',
		'src/it/*.pug',
		'src/zh/*.pug',
	], {
		delay: 0,
	}, gulp.series('pug'))
		.on('all', (event, file) => {
			if (event === 'unlink') {
				global.emittyPugChangedFile = undefined;
			} else {
				global.emittyPugChangedFile = file;
			}
		});

	gulp.watch('src/scss/**/*.scss', gulp.series('scss'));

	gulp.watch('src/js/**/*.js', gulp.series('js'));
});

gulp.task('serve', () => {
	let middleware = [];

	if (argv.spa) {
		middleware.push($.connectHistoryApiFallback());
	}

	$.browserSync
		.create()
		.init({
			notify: false,
			open: argv.open,
			port: argv.port,
			files: [
				'./build/**/*',
			],
			server: {
				baseDir: './build',
				middleware,
			},
			// proxy: "domain.com",
		});
});

gulp.task('zip', () => {
	// eslint-disable-next-line global-require
	let name = require('./package').name;
	let now = new Date();
	let year = now.getFullYear().toString().padStart(2, '0');
	let month = (now.getMonth() + 1).toString().padStart(2, '0');
	let day = now.getDate().toString().padStart(2, '0');
	let hours = now.getHours().toString().padStart(2, '0');
	let minutes = now.getMinutes().toString().padStart(2, '0');

	return gulp.src([
		'build/**',
		'src/**',
		'.babelrc',
		'.editorconfig',
		'.eslintignore',
		'.eslintrc',
		'.gitignore',
		'.npmrc',
		'.stylelintignore',
		'.stylelintrc',
		'*.js',
		'*.json',
		'*.md',
		'*.yml',
		'!package-lock.json',
		'!zip/**',
	], {
		base: '.',
		dot: true,
	})
		.pipe($.zip(`${name}_${year}-${month}-${day}_${hours}-${minutes}.zip`))
		.pipe(gulp.dest('zip'));
});

gulp.task('lint', gulp.series(
	'lint:pug',
	'lint:scss',
	'lint:js'
));

gulp.task('build', gulp.parallel(
	'copy',
	'images',
	'sprites:png',
	'sprites:svg',
	'pug',
	'scss',
	'js'
));
//-- replace image task start (Gnatko Dima)
gulp.task('build:release', gulp.series(
	'build',
	'askallimagesreal',
	'askallimages',
	gulp.parallel(
		'replacehtmlimg',
		'replacecssimg',
		'replacejsimg'
	)
));
//-- replace image task end (Gnatko Dima)
gulp.task('default', gulp.series(
	'build',
	gulp.parallel(
		'watch',
		'serve'
	)
));
