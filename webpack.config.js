var webpack = require("webpack");
var path = require("path");

var modulesPlugins = [
	new webpack.LoaderOptionsPlugin({ minimize: true }),
	new webpack.optimize.UglifyJsPlugin({
		compress: false,
		mangle: false,
		beautify: true,
		comments: true,
		sourceMap: true
	})
];
if (process.env.HYPERREACT === "build") modulesPlugins = [
	new webpack.LoaderOptionsPlugin({ minimize: true }),
	new webpack.optimize.UglifyJsPlugin({
		compress: true,
		mangle: true,
		beautify: false,
		comments: false,
		sourceMap: true
	})
];

module.exports = [
	{
		entry: "./source/hyperreact.js",
		output: {
			path: __dirname,
			filename: "hyperreact.js",
			library: "Hyperreact",
			libraryTarget: "umd"
		},
		module: {
			loaders: [
				{
					test: /\.js$/,
					loader: "babel-loader",
					exclude: /node_modules/,
					query: {
						presets: [
							["es2015", { "modules": false }]
						]
					}
				}
			]
		},
		plugins: modulesPlugins
	}
];