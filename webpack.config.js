// module.exports = {
//   devServer: {
//     historyApiFallback: true,
//   },
//   entry: './src/index.js',
//   output: {
//     path: __dirname + '/public',
//     publicPath: '/public/',
//     filename: '[name].js'
//   },
//   module: {
//     loaders: [
//       {
//         test: /\.js$/,
//         loader: 'babel-loader',
//         exclude: [
//           /node_modules/,
//           /pdfmake.js$/
//         ]
//       },
//       {
//         test: /\.json$/,
//         loader: 'json-loader'
//       },
//     ]
//   }
// };
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
module.exports = {
  devServer: {
    historyApiFallback: true
  },
  entry: {
    app: ['babel-polyfill', "./src/index.js"],
    vendor: [
      "babel-polyfill",
      "axios",
      "react",
      "react-dom",
      "react-redux",
      "react-router",
      "react-router-dom",
      "redux"
    ]
  },
  output: {
    path: __dirname + '/public/views',
    filename: '[name].js',
    chunkFilename: '[chunkhash].chunk.js',
    publicPath: "/views/"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: [/node_modules/, /pdfmake.js$/]
      },
      {
        test: /\.json$/,
        loader: "json-loader"
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development")
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      minChunks: Infinity
    }),
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      filename:  __dirname + "/views/index.ejs",
      template: __dirname + "/views/template.ejs",
      inject: 'body',
      chunks: ['vendor', 'app'],
      chunksSortMode: 'manual'
    }),
    new PreloadWebpackPlugin({
      rel: "preload",
      include: ["vendor", "app"]
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      deleteOriginalAssets: true,
      threshold: 0,
      minRatio: 1
    })
  ]
};
