var cron = require('cron').CronJob;
var Promise = require('bluebird');

module.exports.init = function(){
  var cronJobs = [
    {
      fn: function(d){
        CategoryService.cacheCategoriesProducts();
      },
      time:'0 */30 * * * *'
    },

  ].forEach(function(v){
    
    if(process.env.NODE_ENV === 'production'){
      console.log('initing cronJobs');
      new cron(v.time,v.fn, true, true);
    }
  
  });
};



