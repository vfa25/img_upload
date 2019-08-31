const express = require('express');
const util = require('util');
const fs = require('fs');
const formidable = require('formidable');
const webpack = require('webpack');
const MemoryFs = require('memory-fs');
const webpackConfig = require('./webpack.config.img.js');
const cdnUpload = require('./cdn-upload');

var router = express.Router();

const winPath = path => path.replace(/\\/g, '/');
const reg = /\.(gif|png|jpe?g|svg)$/i;

router.post('/', function(req, res, next) {
  const mfs = new MemoryFs();
  var form = new formidable.IncomingForm();
  form.multiples = true;
  form.keepExtensions = true;

  form.parse(req, function(err, fields, files) {
    if (err || (!Array.isArray(files.upload) && !files.upload.name)) {
      res.status(400).send(err || '您必须先选择上传的图片文件');
    }
    try {
      // 文件改名，返回元素为路径的数组，后者赋值给webpack配置的入口entry字段
      const filesArr = Array.isArray(files.upload)
        ? files.upload
        : [files.upload];
      const filesPaths = filesArr.map(v => {
        const newPath = ''.replace.call(
          winPath(v.path),
          /^(.*\/).*\.(gif|png|jpe?g|svg)$/i,
          `$1${v.name}`
        );
        fs.renameSync(v.path, newPath);
        return newPath;
      });

      const newConfig = Object.assign(webpackConfig, { entry: filesPaths });
      const imgCompiler = webpack(newConfig);
      imgCompiler.outputFileSystem = mfs;

      imgCompiler.watch({}, (err, stats) => {
        if (err) throw err;
        stats = stats.toJson();
        stats.errors.forEach(err => console.error(err));
        stats.warnings.forEach(warn => console.warn(warn));

        const outputPath = webpackConfig.output.path;
        const files = cdnUpload.genFilesList(outputPath, mfs, 'dist');
        const promiseArr = cdnUpload.genUploadPromiseArr(
          files,
          outputPath,
          mfs
        );
        cdnUpload
          .startUpload(promiseArr)
          .then(info => {
            res.writeHead(200, { 'content-type': 'text/plain;charset=utf-8' });
            res.write('上传CDN成功，文件名为:\n\n');
            const result = files.reduce((total, item) => {
              if (reg.test(item)) {
                total.push(cdnUpload.host + item);
              }
              return total;
            }, []);
            res.end(util.inspect({ files: result }));
          })
          .catch(err => {
            res.writeHead(200, { 'content-type': 'text/plain;charset=utf-8' });
            res.write('上传CDN失败:\n\n');
            res.end(
              util.inspect({
                files,
                err
              })
            );
          });
      });
    } catch (err) {
      res.writeHead(200, { 'content-type': 'text/plain;charset=utf-8' });
      res.write('Error:\n\n');
      res.end(
        util.inspect({
          success: false,
          err: err
        })
      );
    }
  });
});

router.get('/', function(req, res, next) {
  res.status(200).setHeader('content-type', 'text/html');
  const html = [
    '<div style="margin: 50px auto; width: max-content;">',
    '<form action="/upload" enctype="multipart/form-data" method="post">',
    '<h3>请上传图片资源，webpack压缩后，将上传CDN并返回访问路径</h3>',
    '<input type="file" name="upload" multiple="multiple"><br><br>',
    '<input type="submit" value="点击批量上传">',
    '</form>',
    '</div>'
  ].join('');
  res.send(html);
});

module.exports = router;
