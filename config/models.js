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
  connection: 'mongodb',
  //connection: 'mysql',

  updateAvatar : function(req,opts,cb){
    var query = {id: opts.id};
    if(opts.dir == 'products'){
      query = {ItemCode: opts.id};
    }
    this.findOne(query).exec(function(e,obj){
      if(e) return cb && cb(e,obj);
      obj.updateAvatar(req,opts,cb);
    });
  },
  destroyAvatar : function(req,opts,cb){
    var query = {id:opts.id};
    if(opts.dir == 'products'){
      query = {ItemCode: opts.id};
    }
    this.findOne(query).exec(function(e,obj){
      if(e) return cb && cb(e,obj);
      obj.destroyAvatar(req,opts,cb);
    });
  },

  updateAvatarSap : function(req,opts,cb){
    var query = {id: opts.id};
    if(opts.dir == 'products'){
      query = {ItemCode: opts.id};
    }
    this.findOne(query).exec(function(e,obj){
      if(e) return cb && cb(e,obj);
      obj.updateAvatarSap(req,opts,cb);
    });
  },

  attributes : {
    hash: {type:'string'},
    updateAvatar : function(req,opts,cb){
      var object = this;
      //opts.file = object.icon;
      opts.file = mapIconFields(object);
      if(process.env.CLOUDUSERNAME){
        opts.avatar = true;
        opts.filename = object.icon_filename?object.icon_filename : null;
        Files.saveFiles(req,opts,function(err,files){
            if(err) return cb(err);
            //object.icon = files[0];
            object.icon_filename = files[0].filename;
            object.icon_name = files[0].name;
            object.icon_type = files[0].type;
            object.icon_typebase = files[0].typebase;
            object.icon_size = files[0].size;

            object.save(cb);
            if(opts.file && opts.file.filename)
                Files.removeFile(opts,function(err){
            });
        });
        return;
      }

      async.waterfall([
        function(callback){
            //console.log('save files');
            Files.saveFiles(req,opts,callback);
        },
        function(files,callback){
          //console.log('crops');
          object.icon_filename = files[0].filename;
          object.icon_name = files[0].name;
          object.icon_type = files[0].type;
          object.icon_typebase = files[0].typebase;
          object.icon_size = files[0].size;
          opts.filename = object.icon_filename;
          Files.makeCrops(req,opts,callback)
        },
        function(crops,callback){
          console.log('remove',opts.file);
          if(opts.file && opts.file.filename) Files.removeFile(opts,callback);
          else callback(null,crops);
        },
      ],function(e,results){
        if(e) console.log(e);
        object.save(cb);
      });
    },
    destroyAvatar : function(req,opts,cb){
      object = this;
      opts.file = mapIconFields(object);
      Files.removeFile(opts, function(){
        console.log('llego al callback');
        object.icon_filename = null;
        object.icon_name = null;
        object.icon_type = null;
        object.icon_typebase = null;
        object.icon_size = null;

        object.save(cb);

      })

    },
    addFiles : function(req,opts,cb){
      var object = this,
      objectFiles = object.files ? object.files : [];
      req.onProgress = getOnProgress(req);
      if(process.env.CLOUDUSERNAME){
          opts.avatar = true;
      }
      Files.saveFiles(req,opts,function(e,files){
          if(e) return cb(e,files);
          object.files = objectFiles;
          async.mapSeries(files,function(file,async_callback){
              var callback = req.onProgress.nextElement(files,async_callback);
              objectFiles.push(file);
              opts.filename = file.filename;
              if(file.typebase == 'image' && !opts.avatar)
                  Files.makeCrops(req,opts,callback);
              else
                  callback(null,file);
          },function(e,crops){
              if(e) return cb(e,crops);
              /*object.files = objectFiles;
              */
              object.files.add(objectFiles);
              object.save(cb);
              return objectFiles;
          });
      });
    },
    removeFiles : function(req,opts,cb){
      //var async = require('async');
      var object = this;
      var files = opts.files ? opts.files : [];
      var FileModel = opts.fileModel;
      files = Array.isArray(files) ? files : [files];
      filesToDelete = [];
      async.map(files,function(file,callback){
        opts.file = file;
        for(var i = 0;i<object.files.length;i++){
          if(object.files[i].filename == opts.file.filename){
            object.files.remove(object.files[i].id);
            FileModel.destroy({id:object.files[i].id}).exec(function(e, _file){
              if(e) {console.log(e);}
              else{
                object.files.splice(i,1);
                Files.removeFile(opts,callback);
              }
            });
          }
        }
      },function(e,files){
        object.save(cb);
      });
    },
    updateAvatarSap : function(internalFiles,opts,cb){
      sails.log.debug('updateAvatarSap');
      var object = this;
      //opts.file = object.icon;
      opts.file = mapIconFields(object);
      if(process.env.CLOUDUSERNAME){
        opts.avatar = true;
        opts.filename = object.icon_filename?object.icon_filename : null;
        Files.saveFilesSap(internalFiles,opts,function(err,files){
            if(err) return cb(err);
            //object.icon = files[0];
            object.icon_filename = files[0].filename;
            object.icon_name = files[0].name;
            object.icon_type = files[0].type;
            object.icon_typebase = files[0].typebase;
            object.icon_size = files[0].size;

            object.save(cb);
            if(opts.file && opts.file.filename)
                Files.removeFile(opts,function(err){
            });
        });
        return;
      }

      async.waterfall([
        function(callback){
            //console.log('save files');
            Files.saveFilesSap(internalFiles,opts,callback);
        },
        function(files,callback){
          //console.log('crops');
          object.icon_filename = files[0].filename;
          object.icon_name = files[0].name;
          object.icon_type = files[0].type;
          object.icon_typebase = files[0].typebase;
          object.icon_size = files[0].size;
          opts.filename = object.icon_filename;
          Files.makeCrops(internalFiles,opts,callback)
        },
        function(crops,callback){
          console.log('remove',opts.file);
          if(opts.file && opts.file.filename) Files.removeFile(opts,callback);
          else callback(null,crops);
        },
      ],function(e,results){
        if(e) console.log(e);
        object.save(cb);
      });
    },

  }


};

function mapIconFields(obj){
  var icon = {};
  icon = {
    filename: obj.icon_filename,
    type: obj.icon_type,
    typebase: obj.icon_typebase,
    size: obj.icon_size
  };
  return icon;
}


function getOnProgress(req){
    var salt = 5,
    uid = req.param('uid'),
    index = req.param('index')
    indice = 1;
    //console.log( '---- uid: ' + uid + ' ---- index: ' + index );
    return{
        fileProgress:function(progress){
            var written = progress.written,
            total = progress.stream.byteCount*2,//time crops.
            porcent = (written*100/total).toFixed(2);
            //console.log('porcent: ' + porcent + ' salt: ' + salt);
            //console.log('written');console.log(written);
            if(porcent >= salt){
                salt += salt;
                sails.io.sockets.emit(uid, {porcent: porcent,index:index});
            }
        }
        ,nextElement:function(files,cb){//de a 1
            var size = files && files.length;
            return function(err){
                if(size){
                    var porcent =  100;
                    sails.io.sockets.emit(uid, {
                        porcent:porcent,
                        index:index,
                        file:files[0]
                    });
                    indice++;
                }
                cb(err);
            }
        }
    };
}
