var request = require('request');
var fs = require('fs');
var async = require('async');

module.exports = {
  importImagesSap: function(req, res){
    var form = req.params.all();

    //sails.log.debug('req');
    //sails.log.debug(req);

    Product.find({select:['ItemCode']}).limit(5).exec(function(err, prods){
      if(err){
        console.log(err);
        throw(err);
      }
      sails.log.debug(prods.length);
      //res.json(prods);

      updateIcons(prods, function(result){
        console.log(result);
        res.json(result);
      });

    });
  }
}


function updateIcon(prod, callback){
  var itemCode = prod.ItemCode;
  var rootDir = process.cwd();
  var path = rootDir + '/images-sap/' + itemCode + '.png';
  var rsfile = fs.createReadStream(path);
  var internalFile = streamToFile( rsfile );

  Product.updateAvatarSap(internalFile,{
    dir : 'products',
    profile: 'avatar',
    id : itemCode,
  },function(e,product){
    if(e) console.log(e);
    var selectedFields = ['icon_filename','icon_name','icon_size','icon_type','icon_typebase'];
    Product.findOne({ItemCode: itemCode}, {select: selectedFields}).exec(function(e, updatedProduct){
      callback();
      //return res.json(updatedProduct);
    });
  });


}


function updateIcons(prods,callback){
  async.each(prods ,updateIcon, function(err){
    if(err){
      console.log(err);
      callback({done:false});
    }

    callback({done:true});

  })
}

function streamToFile(inStream) {

  var Upstream = require('skipper/standalone/Upstream');
  var stream = require('stream')

  /**
   * A transform stream that counts the bytes flowing through it
   *
   * The byte count can be read from this.byteCount property on the class' instance.
   */
  function ByteCountStream(opts){
    stream.Transform.call(this, opts);
    this.byteCount = 0;
    this.filename = 'generico.png';
    this.type = 'image/png';
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
