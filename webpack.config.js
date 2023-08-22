const path = require('path')

module.exports = {
    entry: './assets/scripts/index.js',
    output: {
            filename:'webcamFilterBundle.js',
            path: path.resolve(__dirname, 'raanga', 'static/js'),
            library: 'WebcamFilter',
            libraryTarget: 'umd',
    }
}