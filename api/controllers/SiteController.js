var Promise = require('bluebird');

module.exports = {
  update: function(req, res){
    var form = req.params.all();
    //@param {Object Site} form
    //@param {string} form.handle
    var handle = form.handle;
    Site.update({handle:handle}, form).then(function(updated){
      res.json(updated);
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  },

  findByHandle: function(req, res){
    var form = req.params.all();
    var handle = form.handle;
    //@param {string} form.handle
    Site.findOne({handle:handle})
      .populate('Banners')
      .then(function(site){
        res.json(site);
      }).catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getAll: function(req, res){
    //TODO: Remover form var, no necesaria
    var form = req.params.all();
    Site.find({}).then(function(sites){
      res.json(sites);
    })
    .catch(function(err){
      console.log('err',err);
      res.negotiate(err);
    });
  },

  find: function(req, res){
    var form = req.params.all();
    var model = 'site';
    var extraParams = {
      searchFields: ['name']
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    })
    .catch(function(err){
      console.log(err);
      res.notFound();
    });
  },  

  generateSitesCashReport: function(req, res){
    var form = req.allParams();
    /*
      @param {Object} form
      Example:
      {
        startDate: "Thu Jan 04 2018 10:04:16 GMT-0500 (EST)",
        endDate: "Thu Jan 04 2018 11:04:16 GMT-0500 (EST)"
      } 
    */

    var ADMIN_ROLE_NAME = 'admin';
    
    if(req.user.role.name !== ADMIN_ROLE_NAME){
      return res.negotiate(new Error('No autorizado'));
    }

    SiteService.getSitesCashReport(form)
      .then(function(report){
        res.json(report);
      })
      .catch(function(err){
        console.log('err',err);
        res.negotiate(err);
      });

  },

  addBanner : function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();

    //@param {id/hexadecimal} form.id

    var options = {
      dir : 'sites/banners',
      profile: 'gallery',
      filesAssociationName: 'Banners'
    };

    sails.log.info('uploading image: ' + new Date() + ' ', form.id);
    Site.findOne({id:form.id})
      .then(function(site){
        return site.addFiles(req, options);
      })
      .then(function(updatedProduct){
        return Site.findOne({id:form.id}).populate('Banners');
      })
      .then(function(foundSite){
        sails.log.info('uploaded image: ' + new Date() + ' ', form.id);
        res.json(foundSite);
      })
      .catch(function(err){
        console.log('addFiles err', err);
        res.negotiate(err);
      });     
  },

  removeFiles : function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();

    //@param {id/hexadecimal} form.id

    Site.findOne({id:form.id})
      .populate('Banners')
      .then(function(site){
        var options = {
          dir : 'sites/banners',
          profile : 'gallery',
          files : form.removeFiles,
          fileModel: SiteBanner,
          filesAssociationName: 'Banners'
        };

        return site.removeFiles(req,options);
      })
      .then(function(product){
        return Site.findOne({id:form.id}, {select:['id']})
            .populate('Banners');
      }) 
      .then(function(updatedProduct){
        res.json(updatedProduct.Banners);
      })
      .catch(function(err){
        console.log('err removeFiles',err);
        res.negotiate(err);
      });        
   
  },


};
