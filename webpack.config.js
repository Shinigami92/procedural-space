const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProvidePlugin = require('webpack').ProvidePlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: { main: './src/index.ts' },
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist'
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(['dist']),
		new ProvidePlugin({ THREE: 'three' }),
		new HtmlWebpackPlugin({
			title: 'Procedural Space - by Shinigami',
			meta: {
				viewport: 'width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0'
			},
			template: 'src/index.html'
		})
	],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
};
