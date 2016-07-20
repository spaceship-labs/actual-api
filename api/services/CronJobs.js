var cron = require('cron').CronJob;
var async = require('async');

module.exports.init = function(){
  var cronJobs = [
    {
      fn: function(d){
        getPromos();
      }
      , time:'0 */2 * * * *'
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
        async.forEachSeries(promos ,updatePromo, function(err){
          if(err){
            console.log(err);
          }else{
            sails.log.info('Termino update de todas las promos');
          }

        });
      }else{
        console.log('No habia promos por actualizar');
        return null;
      }
    });
}


function updatePromo(promo, callback){
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
  Search.promotionCronJobSearch(opts).then(function(res){
    if(res && _.isArray(res)){
      var products = res.map(function(p){return p.id});
      sails.log.info('Actualizando con ' + products.length + ' products' );
      Promotion.update({id: promo.id}, {Products: products})
        .then(function(updated){
          callback();
          return null;
        })
        .catch(function(err){
          console.log(err);
          callback();
          return null;
        });
    }else{
      callback();
      return null;
    }
    //return res;
  }).catch(function(err){
    console.log(err);
    callback();
    //return err;
  });
}
