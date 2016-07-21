var cron = require('cron').CronJob;
var async = require('async');
var Promise = require('bluebird')

module.exports.init = function(){
  console.log('initing cronJobs');
  var cronJobs = [
    {
      fn: function(d){
        getPromos();
      }
      , time:'0 0 */1 * * *'
      //s,m,h,d del mes,m,d de la semana
    }
  ].forEach(function(v){
    new cron(v.time,v.fn, true, true);
  });
};

function getPromos(){
  //Excluding expired promotions
  var query = {
    endDate: {'>=': new Date()}
  };
  Promotion.find(query)
    .populate('FilterValues')
    .populate('Categories')
    .populate('Groups')
    .populate('CustomBrands')
    .then(function(promos){
      if(promos){
        Promise.each(promos,updatePromo).then(function(){
          sails.log.info('Termino update de todas las promos');
        });
      }else{
        console.log('No habia promos por actualizar');
        return null;
      }
    });
}


function updatePromo(promo){
  var categories = promo.Categories.map(function(c){return c.id});
  var filtervalues = promo.FilterValues.map(function(fv){return fv.id});
  var groups = promo.Groups.map(function(g){return g.id});
  var excluded = [];
  if(promo.excludedProducts && promo.excludedProducts.length > 0){
    excluded = promo.excludedProducts.map(function(p){return p.id});
  }
  var opts = {
    OnStudio: promo.OnStudio || false,
    OnHome: promo.OnHome || false,
    OnKids: promo.OnKids || false,
    OnAmueble: promo.OnAmueble || false,
    categories: categories,
    filtervalues: filtervalues,
    groups: groups,
    excluded: excluded
  };
  sails.log.info('Searching:');
  return Search.promotionCronJobSearch(opts).then(function(res){
    if(res && _.isArray(res)){
      var products = res.map(function(p){return p.id});
      sails.log.info('Actualizando con ' + products.length + ' products' );
      return Promotion.update({id: promo.id}, {Products: products})
        .then(function(updated){
          return null;
        })
        .catch(function(err){
          console.log(err);
          return null;
        });
    }else{
      return null;
    }
    //return res;
  }).catch(function(err){
    console.log(err);
    //return err;
  });
}