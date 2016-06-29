var request = require('request');
var fs = require('fs');
var async = require('async');
var pathService = require('path');
var productsList = [];
var photosUploaded = 0;
var waitingTime = 0;
var prodCount = 0;

module.exports = {
  importImagesSap: function(req, res){
    var form = req.params.all();
    var limit = form.limit || 10;
    //var skip = 2477;
    var skip = 0;
    productsList = [];
    photosUploaded = 0;
    prodCount = 0;
    waitingTime = 0;
    sails.log.debug('limit : ' + limit);
    Product.find({},{select:['ItemCode','PicturName','icon_filename']}).sort('Available DESC').skip(skip).limit(limit).exec(function(err, prods){
      if(err){
        console.log(err);
        //throw(err);
      }
      updateIcons(prods, function(result){
        console.log(result);
        res.json(productsList);
      });

    });
  }
}


function updateIcon(prod, callback){
  var itemCode = prod.ItemCode;
  var icon = prod.icon_filename;
  var imgName = prod.PicturName;
  prodCount++;

  var excludes = ['CO32166','CO10438','CO31751','CO32938','CO43242','CO44544','CO44540','CO44849','CO46687','CO46688','CO47735','CO03412','CO24328','ST01203','ST01312','ST02342','ST07239','ST09227'];

  //sails.log.warn('Articulo: ' + itemCode +' | Icono : ' + icon);

  if(typeof imgName!= 'undefined' && imgName && imgName != '' && icon == null && excludes.indexOf(itemCode) < 0 ){
    var rootDir = '/home/luis/Pictures/ImagenesSAP/';
    var path = rootDir  + imgName;
    //path = path.replace(/ /g, '\\');
    var rsfile = fs.createReadStream(path);
    var internalFile = streamToFile( rsfile, imgName );
    sails.log.debug('Articulo a subir : ' + itemCode  + ' , Prod index: ' + prodCount + ' imagen:' + imgName + ' | icon: ' + icon);
    sails.log.info('Fotos subidas: ' + photosUploaded + ' | Tiempo de espera: ' + waitingTime);

    if(photosUploaded%5 == 0 && photosUploaded != 0){
      waitingTime = 60000;
    }else{
      waitingTime = 0;
    }

    setTimeout(function(){

      Product.updateAvatarSap(internalFile,{
        dir : 'products',
        profile: 'avatar',
        id : itemCode,
      },function(e,product){
        if(e){
          console.log(e);
          callback();
        }else{
          sails.log.info('Articulo Subido: ' + itemCode);
          productsList.push({ItemCode: itemCode, status: 'con imagen SAP'});
          photosUploaded++;
          callback();
        }
      });

    }, waitingTime);
  }
  else if( excludes.indexOf(itemCode) > -1 ){
    sails.log.warn('Producto excluido ' + itemCode);
    productsList.push({ItemCode: itemCode, status: 'verificar imagen'});
    callback();
  }

  else if(icon && icon!='' && imgName && imgName != ''){
    //sails.log.warn('callback else');
    productsList.push({ItemCode: itemCode, status: 'con imagen SAP'});
    callback();

  }
  else if(icon && icon!='' && !imgName){
    //sails.log.warn('callback else');
    productsList.push({ItemCode: itemCode, status: 'con imagen'});
    callback();

  }
  else{
    //sails.log.warn('callback else');
    sails.log.warn('Sin imagen');
    productsList.push({ItemCode: itemCode, status: 'faltante'});
    callback();
  }
}


function updateIcons(prods,callback){
  async.forEachSeries(prods ,updateIcon, function(err){
    if(err){
      console.log(err);
      callback({done:false});
    }

    callback({done:true});

  })
}

function streamToFile(inStream, filename) {

  var Upstream = require('skipper/standalone/Upstream');
  var stream = require('stream');
  var imgName = filename;

  /**
   * A transform stream that counts the bytes flowing through it
   *
   * The byte count can be read from this.byteCount property on the class' instance.
   */
  function ByteCountStream(opts){
    stream.Transform.call(this, opts);
    this.byteCount = 0;
    var extension = Common.getImgExtension(imgName);
    this.filename = 'generico.' + extension;
    this.type = 'image/' + extension;
    this._transform = function(chunk, encoding, done){
      this.byteCount += chunk.length
      return done(null, chunk)
    }
  }
  ByteCountStream.prototype = Object.create(stream.Transform.prototype);
  //ByteCountStream.prototype.constructor = ByteCountStream;


  // An Upstream is basically what we get when we call `req.file()` on an incoming request
  var file = new Upstream()
  // Because Skipper uses the stream's fd attribute to save the location information on the remote
  // filesystem's storage, we must pipe the stream through an intermediary. Why? Because an fs
  // read stream uses that same fd attribute to store it's file descriptor, which, when changed
  // during data transfer, will silently stop the flow of bytes.
  // As a nice side-effect, we can use this intermediary to count the bytes being uploaded, so we
  // have this information available just like when we would upload a file through http upload.
      , intermediary = new ByteCountStream()

  inStream.pipe(intermediary)

  // file.upload() only prepares the uploader to start receiving files - the .writeFile() actually
  // sends a file to the receiver. And, we must also tell the upstream that there are no more
  // files to be received, otherwise it will just keep waiting for more files to come
  file.writeFile(intermediary)
  file.noMoreFiles()

  // The `req.file()` is now fully simulated - continue as if http upload occured
  return file
}


