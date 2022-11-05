const Promise = require('bluebird');
const ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
const COMPANY_STUDIO_CODE = '001';
const COMPANY_HOME_CODE = '002';
const COMPANY_BOTH_CODE = '003';
const COMPANY_KIDS_CODE = '004';
const COMPANY_ATELIER_CODE = '005';

module.exports = {
  COMPANY_STUDIO_CODE,
  COMPANY_HOME_CODE,
  COMPANY_BOTH_CODE,
  COMPANY_KIDS_CODE,
  COMPANY_ATELIER_CODE,
  getProductSA,
  isSRService,
  cacheProductSoldCount
};

function getProductSA(product){
  var productSA = product.U_Empresa;
  if(productSA === COMPANY_BOTH_CODE || !productSA){
    productSA = COMPANY_STUDIO_CODE;
  }  
  return productSA;
}

function isSRService(product){
  return (product.Service === 'Y');
}

function cacheProductSoldCount(){
  var group = {
    _id: '$Product',
    salesCount: {$sum:'$quantity'}
  };
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
          });
        })
        .then(function(updatedDone){
          console.log('end cache sold products', new Date());          
          resolve(updatedDone);
        });
      });
    });
  });
}

function updateProductSalesCount(productId, params){
  var findCrieria = {_id: new ObjectId(productId)};
  return Common.nativeUpdateOne(findCrieria, params, Product);
}

