const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = mode => {
	const config = {
		entry: {
			index: path.resolve(__dirname, "src", "main.js")
		},
		output: {
			path: path.resolve(__dirname, "dist"),
			filename: "[name].js",
			sourceMapFilename: "[name].[fullhash].[chunkhash].[contenthash].js.map"
		},
		module: {
			rules: [
				{
					test: /(?<!\.(off|worker))\.js$/,
					exclude: /node_modules/,
					enforce: "pre",
					use: ["babel-loader", "source-map-loader"]
				},
				{
					test: /.+(?<!((?<!\.(off|worker))\.js))$/i,
					use: [
						{
							loader: 'raw-loader',
							options: {
								esModule: false,
							},
						},
					],
				},
			]
		},
		resolve: {
			mainFields: ['main', 'module'],
		},
		plugins: [new HtmlWebpackPlugin({
			template: path.join("src", "index.html"),
			inject: "body"
		})],
	}
	const productionConfig = {
		mode: "production",
		devtool: "source-map",
	}
	const developmentConfig = {
		mode: "development",
		devtool: "source-map",
		// watch: true,
		devServer: {
			static: {
				directory: path.join(__dirname, 'dist'),
			},
			// compress: true,
			port: 80,
			client: {
				logging: 'warn',
			},
		},
	}

	if (mode.production) return { ...config, ...productionConfig }
	else return { ...config, ...developmentConfig }
};