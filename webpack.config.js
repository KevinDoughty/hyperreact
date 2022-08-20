var webpack = require("webpack");
var path = require("path");

module.exports = [
    {
        entry: "./source/hyperreact.js",
        output:{
            filename: "hyperreact.js",
            library: "Hyperreact",
            libraryTarget: "umd"
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: "babel-loader",
                    exclude: /node_modules/,
                    //options: { presets: [ ["es2015", { modules: false }] ] } // .babelrc is different for mocha, so this is specified there. Also now babel-preset-env not es2015
                }
            ]
        }
    }
];