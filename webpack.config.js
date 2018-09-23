const path = require('path');

module.exports = {
    entry: './resources/js/index.js',
    output: {
        path: path.resolve(__dirname, 'public/includes/js'),
        filename: 'waitlist-app.min.js'
    },
    devtool: 'source-map'
    // module: {
    //     rules: [
    //       { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
    //       { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ },
    //     ]
    // }
};