var path = require("path");
var webpack = require("webpack");

// plugins: [
//     new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js")
//   ]
//   

var chunkName = "React";
var chunkFile = "vendor.js";
// var chunkDescription = {name:chunkName,filename:chunkFile, minChunks: Infinity};
var plugins = [
// 	new webpack.optimize.CommonsChunkPlugin(chunkDescription),
	//new webpack.LoaderOptionsPlugin({ minimize: true }),
	new webpack.optimize.UglifyJsPlugin({
		compress: false,
		mangle: false,
		beautify: true,
		comments: true,
		sourceMap: true
	})
];
if (process.env.WEBPACK_ENV === "build") {
	plugins = [
// 		new webpack.optimize.CommonsChunkPlugin(chunkDescription),
		//new webpack.LoaderOptionsPlugin({ minimize: true }),
		new webpack.optimize.UglifyJsPlugin({
			compress: true,
			mangle: true,
			beautify: false,
			comments: false,
			sourceMap: false
		})
	];
}

module.exports = {
	entry: "./index.js",
	output: {
		filename: "bundle.js"
	},
	externals: {
		"react": "React",
		"react-dom" : "ReactDOM"
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: "babel-loader",
				exclude: /node_modules/,
				query: {
					presets: [
						["es2015", { "modules": false }],
						"react"
					]
				}
			}
		]
	},
	plugins: plugins
}