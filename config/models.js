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
  connection: 'mysql',

  attributes : {
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
              object.files = objectFiles;
              //console.log('object.files');
              //console.log(object.files);
              object.save(cb);
              return objectFiles;
          });
      });
    }
  }

};


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
