/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */
var async = require('async');
var Promise = require('bluebird');
var _ = require('underscore');

module.exports.models = {
  /***************************************************************************
   *                                                                          *
   * Your app's default connection. i.e. the name of one of your app's        *
   * connections (see `config/connections.js`)                                *
   *                                                                          *
   ***************************************************************************/
  // connection: 'localDiskDb',

  /***************************************************************************
   *                                                                          *
   * How and whether Sails will attempt to automatically rebuild the          *
   * tables/collections/etc. in your schema.                                  *
   *                                                                          *
   * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html  *
   *                                                                          *
   ***************************************************************************/
  // migrate: 'alter'
  migrate: 'safe',
  datastore: 'mongodb',
  updateAvatar: function(req, opts) {
    var query = { id: opts.id };
    if (opts.dir == 'products') {
      query = { ItemCode: opts.id };
    }
    return this.findOne(query).then(function(obj) {
      return obj.updateAvatar(req, opts);
    });
  },
  destroyAvatar: function(req, opts, cb) {
    var query = { id: opts.id };
    if (opts.dir == 'products') {
      query = { ItemCode: opts.id };
    }
    return this.findOne(query).then(function(obj) {
      return obj.destroyAvatar(req, opts);
    });
  },

  updateAvatarSap: function(req, opts, cb) {
    var query = { id: opts.id };
    if (opts.dir == 'products') {
      query = { ItemCode: opts.id };
    }
    this.findOne(query).exec(function(e, obj) {
      if (e) return cb && cb(e, obj);
      obj.updateAvatarSap(req, opts, cb);
    });
  },
  attributes: {
    hash: { type: 'string' },
  },
};

function getFileIndex(file, files) {
  fileIndex = false;
  for (var i = 0; i < files.length; i++) {
    if (files[i].filename == file.filename) {
      fileIndex = i;
    }
  }
  return fileIndex;
}

function mapIconFields(obj) {
  var icon = {};
  icon = {
    filename: obj.icon_filename,
    type: obj.icon_type,
    typebase: obj.icon_typebase,
    size: obj.icon_size,
  };
  return icon;
}

function getOnProgress(req) {
  var salt = 5;
  var uid = req.param('uid');
  var index = req.param('index');
  var indice = 1;
  //console.log( '---- uid: ' + uid + ' ---- index: ' + index );
  return {
    fileProgress: function(progress) {
      var written = progress.written,
        total = progress.stream.byteCount * 2, //time crops.
        porcent = (written * 100 / total).toFixed(2);
      if (porcent >= salt) {
        salt += salt;
        sails.io.sockets.emit(uid, { porcent: porcent, index: index });
      }
    },
    nextElement: function(files, cb) {
      //de a 1
      var size = files && files.length;
      return function(err) {
        if (size) {
          var porcent = 100;
          sails.io.sockets.emit(uid, {
            porcent: porcent,
            index: index,
            file: files[0],
          });
          indice++;
        }
        cb(err);
      };
    },
  };
}
