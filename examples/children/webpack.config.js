var webpack = require("webpack");
var path = require("path");


module.exports = [
    {
        entry: "./index.js",
        output:{
            filename: "bundle.js"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    exclude: /node_modules/,
                }
            ]
        }
    }
];