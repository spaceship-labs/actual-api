const Promise = require('bluebird');
const S3 = require('aws-sdk/clients/s3');
const s3 = new S3();

module.exports = {
  saveFiles: saveFiles,
  removeFile: removeFile,
};

function saveFiles(req, opts) {
  const dirName = 'uploads/' + opts.dir + '/';
  const uploadOptions = {
    saveAs: generateFileName,
    adapter: require('skipper-s3'),
    key: process.env.AWS_ACCESS_KEY_ID,

    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_BUCKET,
    dirname: dirName,
  };

  return new Promise((resolve, reject) => {
    req.file('file').upload(uploadOptions, (err, filesUploaded) => {
      console.log('err', err);
      if (err) reject(err);
      console.log('filesUploaded', filesUploaded);
      resolve(filesUploaded);
    });
  });
}

function generateFileName(_stream, callback) {
  var error = null;
  var fileName = _stream.filename;
  callback(error, fileName);
}

//Deletes a File and Crops if profile is specified;
function removeFile(opts) {
  console.log('running removeFile');
  var dirSave = 'uploads/' + opts.dir + '/';
  var sizes = opts.profile ? sails.config.images[opts.profile] : [];
  var filename = opts.file.filename;
  var routes = [dirSave + filename];
  //Gets routes for different sizes
  sizes.forEach(function(size) {
    routes.push(dirSave + size + '/webp/' + filename);
  });
  const clientConfig = getAdapterConfig();
  const client = require('pkgcloud').storage.createClient(clientConfig);
  //const container = getContainer(client);

  return removeFilesPromise(client, process.env.AWS_BUCKET, routes);
}

function removeFilesPromise(client, bucket, routes) {
  console.log('to remove', routes);
  return new Promise((resolve, reject) => {
    const objects = routes.map(r => ({ Key: r }));
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Delete: {
        Objects: objects,
      },
    };
    s3.deleteObjects(params, (err, data) => {
      if (err) {
        console.log('err remove', err);
        reject(err);
        return;
      }
      console.log('resolve', data);
      resolve();
    });
  });
}

function getAdapterConfig() {
  if (process.env.AWS_SECRET_ACCESS_KEY) {
    var config = {
      provider: 'amazon',
      keyId: process.env.AWS_ACCESS_KEY_ID,

      key: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    };
    return config;
  }
  return false;
}

//Runs in bootstrap
//or '' if not setting
function replaceUrlImageSizes(url) {
  const regexDimensions = new RegExp('(\\d{3,4}[x]\\d{3,4})');
  const regexResult = url.match(regexDimensions);
  var matchDimensions;

  if (regexResult && regexResult.length > 0) {
    matchDimensions = regexResult[0];
    url = url.replace(matchDimensions, '');
    url += '?d=' + matchDimensions;
  }

  return url;
}

module.exports.getContainerLink = function(next) {
  if (next) {
    return next(null, process.env.AWS_CLOUDFRONT_URL);
  }
};

module.exports.middleware = function(req, res, next) {
  if (req.url.indexOf('/uploads/') !== 0 || !process.env.AWS_CLOUDFRONT_URL) {
    next();
  } else {
    var redirectUrl = replaceUrlImageSizes(req.url);
    console.log('redirectUrl', redirectUrl);
    res.redirect(301, process.env.AWS_CLOUDFRONT_URL + redirectUrl);
  }
};
