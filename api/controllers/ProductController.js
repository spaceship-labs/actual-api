var _ = require('underscore');
var Promise = require('bluebird');

module.exports = {
  find: function(req, res) {
    var form = req.params.all();
    var model = 'product';
    var populateFields = form.noimages ? [] : ['files'];
    if (form.populate_fields) {
      populateFields = form.populate_fields;
    }
    populateFields.push('CustomBrand');
    if (form.getAll) {
      sails.log.info('Exportando productos');
    }

    var extraParams = {
      searchFields: ['ItemName', 'ItemCode', 'Name'],
      populateFields: populateFields,
      selectFields: ['ItemName', 'ItemCode', 'Name'],
    };
    Common.find(model, form, extraParams)
      .then(function(result) {
        if (form.getAll) {
          sails.log.info('Termino exportacion de productos');
        }
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },
  findById: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    //Product.find({id:id}).exec(function(err, results){
    var currentDate = new Date();
    var populateFields = form.populateFields;

    var findPromise = Product.findOne({
      or: [{ ItemCode: id }, { ItemName: id }],
    })
      .populate('files')
      .populate('Categories')
      .populate('FilterValues')
      .populate('Sizes')
      .populate('Groups');

    if (populateFields && populateFields.length > 0) {
      populateFields.forEach(function(populateF) {
        findPromise = findPromise.populate(populateF);
      });
    }

    findPromise
      .then(function(product) {
        res.ok({ data: product });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  multipleFindByIds: function(req, res) {
    var form = req.params.all();
    var ids = form.ids;
    var populateFields = form.populate_fields;
    var read = Product.find({ id: ids });

    if (populateFields.length > 0) {
      populateFields.forEach(function(populateF) {
        read = read.populate(populateF);
      });
    }

    read
      .then(function(products) {
        res.json(products);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  search: function(req, res) {
    var form = req.params.all();
    var items = form.items || 10;
    var page = form.page || 1;
    var term = form.term || false;
    var autocomplete = form.autocomplete || false;
    var query = {};
    var querySearchAux = {};
    var model = Product;
    var keywords = form.keywords || false;
    var searchFields = ['ItemName', 'Name', 'ItemCode'];

    if (term || true) {
      if (searchFields.length > 0 && term) {
        query.or = [];
        for (var i = 0; i < searchFields.length; i++) {
          var field = searchFields[i];
          var obj = {};
          obj[field] = { contains: term };
          query.or.push(obj);
        }
      }

      if (keywords && searchFields.length > 0) {
        query.or = [];
        searchFields.forEach(function(field) {
          keywords.forEach(function(keyword) {
            var obj = {};
            obj[field] = { contains: keyword };
            query.or.push(obj);
          });
        });
      }

      querySearchAux = _.clone(query);

      query.skip = (page - 1) * items;
      query.limit = items;

      var read;
      if (autocomplete) {
        read = model.find(query);
      } else {
        read = model.find(query).populate('files');
      }

      var resultsRead;
      read.sort('Available DESC');
      read
        .then(function(results) {
          resultsRead = results;
          return model.count(querySearchAux);
        })
        .then(function(count) {
          return res.ok({ data: resultsRead, total: count });
        })
        .catch(function(err) {
          console.log(err);
          res.negotiate(err);
        });
    } else {
      return res.ok({ data: [], total: 0 });
    }
  },

  update: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    Product.update({ ItemCode: id }, form)
      .then(function(product) {
        res.json(product);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  addFiles: function(req, res) {
    process.setMaxListeners(0);
    var form = req.params.all();

    var options = {
      dir: 'products/gallery',
      profile: 'gallery',
    };

    sails.log.info('uploading image: ' + new Date() + ' ', form.id);
    Product.findOne({ ItemCode: form.id })
      .then(function(product) {
        return product.addFiles(req, options);
      })
      .then(function(updatedProduct) {
        return Product.findOne({ ItemCode: form.id }).populate('files');
      })
      .then(function(foundProduct) {
        sails.log.info('uploaded image: ' + new Date() + ' ', form.id);
        res.json(foundProduct);
      })
      .catch(function(err) {
        console.log('addFiles err', err);
        res.negotiate(err);
      });
  },

  removeFiles: function(req, res) {
    process.setMaxListeners(0);
    var form = req.params.all();
    Product.findOne({ ItemCode: form.ItemCode })
      .populate('files')
      .then(function(product) {
        var options = {
          dir: 'products/gallery',
          profile: 'gallery',
          files: form.removeFiles,
          fileModel: ProductFile,
        };

        return product.removeFiles(req, options);
      })
      .then(function(product) {
        return Product.findOne(
          { ItemCode: form.ItemCode },
          { select: ['ItemCode'] }
        ).populate('files');
      })
      .then(function(updatedProduct) {
        res.json(updatedProduct.files);
      })
      .catch(function(err) {
        console.log('err removeFiles', err);
        res.negotiate(err);
      });
  },

  updateIcon: function(req, res) {
    process.setMaxListeners(0);
    var form = req.params.all();
    var options = {
      dir: 'products',
      profile: 'avatar',
      id: form.id,
    };

    Product.updateAvatar(req, options)
      .then(function(product) {
        res.json(product);
      })
      .catch(function(err) {
        console.log('updateIcon err', err);
        res.negotiate(err);
      });
  },

  removeIcon: function(req, res) {
    process.setMaxListeners(0);
    var form = req.params.all();
    var options = {
      dir: 'products',
      profile: 'avatar',
      id: form.id,
    };

    Product.destroyAvatar(req, options)
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        console.log('err removeIcon', err);
        res.negotiate(err);
      });
  },

  getProductsbySuppCatNum: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    Product.find({ SuppCatNum: id }, { select: ['ItemCode'] })
      .then(function(prods) {
        res.json(prods);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  addSeenTime: function(req, res) {
    var form = req.params.all();
    var ItemCode = form.ItemCode;
    Product.findOne({
      select: ['id', 'ItemCode', 'seenTimes'],
      ItemCode: ItemCode,
    })
      .then(function(product) {
        product.seenTimes = product.seenTimes || 0;
        product.seenTimes++;
        product.save(function(err, p) {
          if (err) {
            return Promise.reject(err);
          }
          res.json(p);
        });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getProductMainPromo: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var activeQuotationId = form.activeQuotationId;
    PromotionService.getProductMainPromo(id, activeQuotationId)
      .then(function(mainPromo) {
        res.json(mainPromo);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  getSpotlightProducts: function(req, res) {
    Product.find({ spotlight: true })
      .then(function(products) {
        res.json(products);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  setSpotlightProducts: function(req, res) {
    var form = req.allParams();
    var itemCodes = form.itemCodes;

    Common.nativeUpdate({}, { spotlight: false }, Product)
      .then(function() {
        var query = {
          ItemCode: { $in: itemCodes },
        };

        return Common.nativeUpdate(query, { spotlight: true }, Product);
      })
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  getSlowMovementProducts: function(req, res) {
    Product.find({ slowMovement: true })
      .then(function(products) {
        res.json(products);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  setSlowMovementProducts: function(req, res) {
    var form = req.allParams();
    var itemCodes = form.itemCodes;

    Common.nativeUpdate({}, { slowMovement: false }, Product)
      .then(function() {
        var query = {
          ItemCode: { $in: itemCodes },
        };

        return Common.nativeUpdate(query, { slowMovement: true }, Product);
      })
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  testSold: function(req, res) {
    ProductService.cacheProductSoldCount()
      .then(function(results) {
        res.ok();
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate('err', err);
      });
  },
};
