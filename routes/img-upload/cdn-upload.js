const qiniu = require('qiniu');
const fs = require('fs');
const path = require('path');

const defaultAssetsDir = 'dist';

const cdnConfig = require('../../app.config').cdn;

const { ak, sk, bucket, host } = cdnConfig;

const mac = new qiniu.auth.digest.Mac(ak, sk);

const config = new qiniu.conf.Config();
config.zone = qiniu.zone.Zone_z0;

const doUpload = (key, file) => {
  const options = {
    scope: bucket + ':' + key
  };
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();
  const putPolicy = new qiniu.rs.PutPolicy(options);
  const uploadToken = putPolicy.uploadToken(mac);
  return new Promise((resolve, reject) => {
    formUploader.put(uploadToken, key, file, putExtra, (err, body, info) => {
      if (err) {
        return reject(err);
      }
      if (info.statusCode === 200) {
        resolve(body);
      } else {
        reject(body);
      }
    });
  });
};
const genFilesList = (dirName, fsType = fs, assetsDir = defaultAssetsDir) => {
  let set = [];
  if (!fsType.existsSync(dirName)) throw new Error('目录不存在');
  fsType.readdirSync(dirName).map(value => {
    const assetPath = path.join(dirName, value);
    var stats = fsType.statSync(assetPath);
    if (stats.isFile()) {
      let e = assetPath.replace(new RegExp(`.*${assetsDir}\/`), '');
      set.push(e);
    }
    if (stats.isDirectory()) {
      set = [...set, ...genFilesList(assetPath, fsType, assetsDir)];
    }
  });
  return set;
};

const genUploadPromiseArr = (files, dirPath, mfs) => {
  return files.map(item => {
    const filePath = path.join(dirPath, item);
    return doUpload(
      item,
      mfs ? mfs.readFileSync(filePath) : fs.readFileSync(filePath)
    );
  });
};

const startUpload = promiseArr => {
  return Promise.all(promiseArr)
    .then(resps => {
      return resps;
    })
    .catch(errs => {
      process.exit(0);
      return errs;
    });
};

module.exports = {
  genFilesList,
  genUploadPromiseArr,
  startUpload,
  host
};
