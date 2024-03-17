var cron = require('cron').CronJob;
var Promise = require('bluebird');

module.exports.init = function(){
  var cronJobs = [
    {
      fn: function(d){
        CategoryService.cacheCategoriesProducts();
      },
      time:'0 7 * * * *'
    },
    {
      fn: function(d){
        ProductService.cacheProductSoldCount();
      },
      time: '00 00 04 * * 0-6' //Runs everyday at 4am (0-6 is sunday to saturday)

    }

  ].forEach(function(v){
    
    if(process.env.NODE_ENV === 'production'){
      console.log('initing cronJobs');
      new cron(v.time,v.fn, true, true);
    }
  
  });
};



