var _ = require('underscore');

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'product';
    var populateFields = form.noimages ? [] : ['files'];
    if(form.populate_fields){
      populateFields = form.populate_fields;
    }
    populateFields.push('CustomBrand');
    if(form.getAll){
      sails.log.info('Exportando productos');
    }
    var extraParams = {
      searchFields: ['ItemName','ItemCode','Name'],
      populateFields: populateFields,
      selectFields:  ['ItemName','ItemCode','Name']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        if(form.getAll){
          sails.log.info('Termino exportacion de productos');
        }
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });

  },
  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //Product.find({id:id}).exec(function(err, results){
    var currentDate = new Date();
    var queryPromo = {
      //select: ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'],
      startDate: {'<=': currentDate},
      endDate: {'>=': currentDate},
    };
    Product.findOne({or: [ {ItemCode:id}, {ItemName:id} ]  })
      .populate('files')
      .populate('Categories')
      .populate('FilterValues')
      .populate('Sizes')
      .populate('Groups')
      .populate('Promotions', queryPromo)
      //.populate('stock')
      .then(function(product){
        res.ok({data:product});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });

  },
  search: function(req, res){
    var form = req.params.all();
    var items = form.items || 10;
    var page = form.page || 1;
    var term = form.term || false;
    var autocomplete = form.autocomplete || false;
    var query = {};
    var querySearchAux = {};
    var model = Product;
    var keywords = form.keywords || false;
    var searchFields = ['ItemName', 'Name','ItemCode'];

    if(term || true){
      if(searchFields.length > 0 && term){
        query.or = [];
        for(var i=0;i<searchFields.length;i++){
          var field = searchFields[i];
          var obj = {};
          obj[field] = {contains:term};
          query.or.push(obj);
        }
      }

      if(keywords && searchFields.length > 0){
        query.or = [];
        searchFields.forEach(function(field){
          keywords.forEach(function(keyword){
            var obj = {};
            obj[field] = {contains:keyword};
            query.or.push(obj);
          });
        });
      }

      querySearchAux = _.clone(query);

      query.skip = (page-1) * items;
      query.limit = items;

      var read;
      if(autocomplete){
        read = model.find(query);
      }else{
        read = model.find(query).populate('files');
      }

      var resultsRead;
      read.sort('Available DESC');
      read.then(function(results){
        resultsRead = results;
        return model.count(querySearchAux);
      })
      .then(function(count){
        return res.ok({data:resultsRead, total:count});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
    }

    else{
      return res.ok({data:[], total: 0});
    }



  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Product.update({ItemCode: id}, form)
      .then(function(product){
        res.json(product);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  addFiles : function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.findOne({ItemCode:form.id})
      .then(function(product){
        product.addFiles(req,{
          dir : 'products/gallery',
          profile: 'gallery'
        },function(e,product){
          if(e){
            console.log(e);
            res.json(false);
          }
          else{
            //TODO check how to retrieve images instead of doing other query
            Product.findOne({ItemCode:form.id}, {select:['ItemCode']}).populate('files').exec(function(e, updatedProduct){
              return res.json(updatedProduct.files);
            });
          }
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  removeFiles : function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.findOne({ItemCode:form.ItemCode}).populate('files')
      .then(function(product){

        product.removeFiles(req,{
          dir : 'products/gallery',
          profile : 'gallery',
          files : form.removeFiles,
          fileModel: ProductFile
        },function(e,product){
          if(e){
            console.log(e);
            res.json(false);
          }
          else{
            //TODO check how to retrieve images instead of doing other query
            Product.findOne({ItemCode:form.ItemCode}, {select:['ItemCode']}).populate('files').exec(function(e, updatedProduct){
              return res.json(updatedProduct.files);
            });
          }
        });

      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  updateIcon: function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.updateAvatar(req,{
      dir : 'products',
      profile: 'avatar',
      id : form.id,
    },function(e,product){
      if(e){
        console.log(e);
        return res.json(false);
      }else{
        //TODO check how to retrieve images instead of doing other query
        var selectedFields = ['icon_filename','icon_name','icon_size','icon_type','icon_typebase'];
        Product.findOne({ItemCode:form.id}, {select: selectedFields}).exec(function(e, updatedProduct){
          return res.json(updatedProduct);
        });

      }
      //res.json(product);
    });
  },

  removeIcon: function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.destroyAvatar(req,{
      dir : 'products',
      profile: 'avatar',
      id : form.id,
    },function(e,product){
      if(e) {
        console.log(e);
        res.json(false);
      }else{
        res.json(product);
      }
    });
  },

  getProductsbySuppCatNum: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Product.find( {SuppCatNum: id}, {select: ['ItemCode']} )
      .then(function(prods) {
        res.json(prods);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  addSeenTime: function(req, res){
    var form = req.params.all();
    var ItemCode = form.ItemCode;
    Product.findOne({
      select:['id','ItemCode','seenTimes'],
      ItemCode: ItemCode
    })
    .then(function(product){
      product.seenTimes = product.seenTimes || 0;
      product.seenTimes++;
      product.save(function(err,p){
        if(err){
          return Promise.reject(err);
        }
        res.json(p);
      });
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  },

};
