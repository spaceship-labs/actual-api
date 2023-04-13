var _ = require('underscore');
var Promise = require('bluebird');

module.exports = {
  find: function(req, res) {
    var form = req.allParams();
    var model = 'productcategory';
    var extraParams = {
      searchFields: ['Name', 'Handle'],
    };
    Common.find(model, form, extraParams)
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getAllCategories: function(req, res) {
    ProductCategory.find()
      .sort('CategoryLevel ASC')
      .populate('Childs')
      .populate('Parents')
      .populate('FeaturedProducts')
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        res.negotiate(err);
      });
  },

  getCategoriesTree: function(req, res) {
    Promise.join(
      ProductCategory.find({ CategoryLevel: 1 }).populate('Childs'),
      ProductCategory.find({ CategoryLevel: 2 }).populate('Childs'),
      ProductCategory.find({ CategoryLevel: 3 }).populate('Parents')
    )
      .then(function(groups) {
        var categoriesLv1 = groups[0] || [];
        var categoriesLv2 = groups[1] || [];
        var categoriesLv3 = groups[2] || [];
        var categoryTree = CategoryService.buildCategoriesTree(
          categoriesLv1,
          categoriesLv2,
          categoriesLv3
        );
        res.json(categoryTree);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getCategoriesGroups: function(req, res) {
    Promise.join(
      ProductCategory.find({ CategoryLevel: 1 }).populate('Childs'),
      ProductCategory.find({ CategoryLevel: 2 }).populate('Childs'),
      ProductCategory.find({ CategoryLevel: 3 }).populate('Parents')
    )
      .then(function(categoriesGroups) {
        res.json(categoriesGroups);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getMainCategories: function(res, res) {
    ProductCategory.find({ IsMain: true })
      .then(function(categories) {
        res.json(categories);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  findById: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    ProductCategory.findOne({ id: id })
      .populate('Childs')
      .populate('Parents')
      .populate('FeaturedProducts')
      .then(function(category) {
        res.json(category);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  //TODO: Check why .add() doesnt work for ProductCategory.Parents
  create: function(req, res) {
    var form = req.allParams();
    var parents = form.Parents;
    var relationRecords = [];
    ProductCategory.create(form)
      .then(function(result) {
        if (result) {
          res.json(result);
        } else {
          res.json(false);
        }
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  destroy: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    ProductCategory.destroy({ id: id })
      .then(function() {
        return res.json({ destroyed: true });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  //TODO: Check better way to add/remove ProductCategory.Parent relation
  update: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    ProductCategory.update({ id: id }, form)
      .then(function(updatedCategory) {
        res.json(updatedCategory);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getCategory: function(req, res) {
    var form = req.allParams();
    var handle = form.handle;
    ProductCategory.findOne({ Handle: handle })
      .populate('Products')
      .then(function(category) {
        res.json(category);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  findByHandle: function(req, res) {
    var form = req.allParams();
    var handle = form.handle;
    ProductCategory.findOne({ Handle: handle })
      .populate('Childs')
      .populate('Filters')
      .then(function(category) {
        res.json(category);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  async getCategoryChildsRelations(req, res) {
    const { handle } = req.allParams();
    const category = await ProductCategory.findOne({ Handle: handle });
    const relations = await CategoryParent_CategoryChild.find({
      parent: category.id,
    }).populate('child');
    return res.json(relations);
  },

  setCategoryChildsRelations: function(req, res) {
    const { handle, relations } = req.allParams();
    //console.log('relations', relations);
    Promise.mapSeries(relations, relation => {
      return CategoryParent_CategoryChild.update(
        { id: relation.id },
        { position: relation.position }
      );
    }).then(function(results) {
      //console.log('results', results);
      res.json({ ok: true });
    });
  },

  async addFeaturedProduct(req, res) {
    try {
      const id = req.param('id');
      const productId = req.param('productId');
      const category = await ProductCategory.findOne({ id }).populate(
        'FeaturedProducts'
      );
      category.FeaturedProducts.addToCollection(productId);
      await category.update();
      const categoryUpdated = await ProductCategory.findOne({ id })
        .populate('Childs')
        .populate('Parents')
        .populate('FeaturedProducts');
      res.ok(categoryUpdated);
    } catch (err) {
      res.negotiate(err);
    }
  },

  async removeFeaturedProduct(req, res) {
    try {
      const id = req.param('id');
      const productId = req.param('productId');
      const category = await ProductCategory.findOne({ id }).populate(
        'FeaturedProducts'
      );
      category.FeaturedProducts.removeFromCollection(productId);
      const categoryUpdated = await ProductCategory.findOne({ id })
        .populate('Childs')
        .populate('Parents')
        .populate('FeaturedProducts');
      res.ok(categoryUpdated);
      await category.update();
    } catch (err) {
      res.negotiate(err);
    }
  },
};
