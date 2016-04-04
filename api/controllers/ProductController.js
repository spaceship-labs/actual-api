module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'product';
    var searchFields = ['ItemName','ItemCode'];
    var populateFields = ['files'];
    Common.find(model, form, searchFields, populateFields).then(function(result){
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
    Product.find({ItemCode:id})
      .populate('files')
      //.populate('stock')
      .exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        if(results.length > 0){
          res.ok({data:results[0]});
        }else{
          res.notFound();
        }
      }
    });
  },
  search: function(req, res){
    var form = req.params.all();
    var items = form.items || 10;
    var page = form.page || 1;
    var term = form.term || false;
    var query = {};
    var querySearchAux = {};
    var model = Product
    var searchFields = ['ItemName','ItemCode'];
    var color = form.color || false;
    var line = form.line || false;

    if(term){
      if(searchFields.length > 0){
        query.or = [];
        for(var i=0;i<searchFields.length;i++){
          var field = searchFields[i];
          var obj = {};
          obj[field] = {contains:term};
          query.or.push(obj);
        }
      }
      querySearchAux = _.clone(query);
    }

    query.skip = (page-1) * items;
    query.limit = items;

    if(color){
      query.U_COLOR = color;
      querySearchAux = _.clone(query);
    }
    if(line){
      query.U_LINEA = line;
      querySearchAux = _.clone(query);
    }

    //console.log(query);

    var read = model.find(query).populate('files');

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

  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Product.update({ItemCode: id}, form, function(e, product){
      if(e) throw(e);
      res.json(product);
    });
  },

  addFiles : function(req,res){
    form = req.params.all();
    Product.findOne({ItemCode:form.id}).exec(function(e,product){
      if(e) throw(e);
      product.addFiles(req,{
        dir : 'products/gallery',
        profile: 'gallery'
      },function(e,product){
        if(e){
          console.log(e);
          throw(e);
        }
        res.json(product);
      });
    });
  },

  removeFiles : function(req,res){
    var form = req.params.all();
    Product.findOne({ItemCode:form.ItemCode}).populate('files').exec(function(e,product){
      product.removeFiles(req,{
        dir : 'products/gallery',
        profile : 'gallery',
        files : form.removeFiles,
        fileModel: ProductFile
      },function(e,product){
        if(e) console.log(e);
        res.json(product);
      })
    });
  },

  updateIcon: function(req,res){
    var form = req.params.all();
    Product.updateAvatar(req,{
      dir : 'products',
      profile: 'avatar',
      id : form.id,
    },function(e,product){
      if(e) console.log(e);
      res.json(product);
    });
  },

}
