const path = require('path');

const config = {
  mode: process.env.NODE_ENV || 'production',
  output: {
    path: path.join(__dirname, './dist')
  },
  module: {
    rules: [
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash:8].[ext]'
            }
          },
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 65
              },
              // optipng.enabled: false will disable optipng
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: '65-90',
                speed: 4
              },
              gifsicle: {
                interlaced: false
              }
              // 暂不考虑webp格式
              // webp: {
              //   quality: 75
              // }
            }
          }
        ]
      }
    ]
  }
};
module.exports = config;
