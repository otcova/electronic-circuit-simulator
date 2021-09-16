const path = require("path");

module.exports = mode => {
	return {
		watch: mode.production ? false : true,
		mode: mode.production ? "production" : "development",
		devtool: mode.production ? "source-map" : "source-map",
		entry: {
			index: path.resolve(__dirname, "src", "index.js")
		},
		output: {
			path: path.resolve(__dirname, "dist"),
			filename: "[name].js",
			sourceMapFilename: "[name].js.map"
		},
		module: {
			rules: [
				{
					test: /(?<!\.(off|worker))\.js$/,
					exclude: /node_modules/,
					enforce: "pre",
					use: ["babel-loader"]
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
	}
};