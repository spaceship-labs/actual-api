var _ = require('underscore');

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'product';
    var searchFields = ['ItemName','ItemCode','Name'];
    var selectFields = form.fields;
    var populateFields = form.noimages ? [] : ['files'];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },
  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //Product.find({id:id}).exec(function(err, results){
    Product.findOne({or: [ {ItemCode:id}, {ItemName:id} ]  })
      .populate('files')
      .populate('Categories')
      .populate('FilterValues')
      .populate('Sizes')
      .populate('Groups')
      .populate('Price')
      //.populate('stock')
      .exec(function(err, product){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        res.ok({data:product});
      }
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
    var model = Product
    var searchFields = ['ItemName','ItemCode'];
    var color = form.color || false;
    var line = form.line || false;

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
      querySearchAux = _.clone(query);

      query.skip = (page-1) * items;
      query.limit = items;

      var read;
      if(autocomplete){
        read = model.find(query);
      }else{
        read = model.find(query).populate('files');
      }

      read.sort('Available DESC');

      read.exec(function(err, results){
        model.count(querySearchAux).exec(function(err,count){
          if(err){
            console.log(err);
            return res.notFound();
          }else{
            return res.ok({data:results, total:count});
          }
        })
      });

    }else{
      return res.ok({data:[], total: 0});
    }



  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Product.update({ItemCode: id}, form).exec(function updatedProduct(e, product){
      if(e){
        console.log(e);
        throw(e);
      }
      res.json(product);
    });
  },

  addFiles : function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.findOne({ItemCode:form.id}).exec(function(e,product){
      if(e){
        //throw(e);
        console.log(e);
      }
      product.addFiles(req,{
        dir : 'products/gallery',
        profile: 'gallery'
      },function(e,product){
        if(e){
          console.log(e);
          res.json(false);
          //throw(e);
        }
        else{
          //TODO check how to retrieve images instead of doing other query
          Product.findOne({ItemCode:form.id}, {select:['ItemCode']}).populate('files').exec(function(e, updatedProduct){
            return res.json(updatedProduct.files);
          });
        }
      });
    });
  },

  removeFiles : function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.findOne({ItemCode:form.ItemCode}).populate('files').exec(function(e,product){
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
      })
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
        sails.log.info('todo mal');
        return res.json(false);
      }else{
        sails.log.info('todo bien');
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
    Product.find( {SuppCatNum: id}, {select: ['ItemCode']} ).exec(function( e, prods ) {
      if(e){
        console.log(e);
        res.json(false);
      }else{
        res.json(prods);
      }
    });
  }

}
