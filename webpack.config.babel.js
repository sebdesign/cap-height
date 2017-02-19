export default () => ({
  entry: './src/index.js',
  output: {
    path: './dist',
    filename: 'cap-height.js',
    library: 'capHeight',
    libraryTarget: 'umd'
  },
  devtool: 'cheap-module-source-map',
  externals: {
    'lodash': {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_'
    }
  },
  module: {
    rules: [
        {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
    ]
  }
});
