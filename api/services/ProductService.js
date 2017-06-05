var Promise = require('bluebird');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
  isSRService: isSRService,
  cacheProductSoldCount: cacheProductSoldCount
};

function isSRService(product){
  return (product.Service === 'Y');
}

function cacheProductSoldCount(){
  var group = {
    _id: '$Product',
    //_id: '$quantity',
    salesCount: {$sum:'$quantity'}
  }

  console.log('start cache sold products', new Date());

  return new Promise(function(resolve, reject){
    OrderDetail.native(function(err, collection){
      if(err){
        console.log('err', err);
        return reject(err);
      }
      
      collection.aggregate([
        {$group:group}
      ],function(_err,results){
        if(err){
          console.log('_err', _err);
          return reject(_err);
        }

        return Promise.map(results, function(productReport){
          return updateProductSalesCount(productReport._id, {
            salesCount: productReport.salesCount
          })
        })
        .then(function(updatedDone){
        
          console.log('end cache sold products', new Date());
          
          resolve(updatedDone);
        })

      })
    })

  });
}

function updateProductSalesCount(productId, params){
  var findCrieria = {_id: new ObjectId(productId)};
  return Common.nativeUpdateOne(findCrieria, params, Product);
}

