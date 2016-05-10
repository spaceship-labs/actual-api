/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': {
    controller: 'auth',
    action: 'homeStatus'
  },

  '/auth/signin':{
    controller: 'auth',
    action: 'signin'
  },

  '/user/create':{
    controller: 'user',
    action: 'create'
  },

  '/user/findbyid/:id':{
    controller: 'user',
    action: 'findById'
  },

  '/user/find/:page':{
    controller: 'user',
    action: 'find'
  },

  '/user/update/:id':{
    controller: 'user',
    action: 'update'
  },

  '/product/find/:page':{
    controller: 'product',
    action: 'find'
  },

  '/product/search':{
    controller: 'product',
    action: 'search'
  },

  '/product/addfiles':{
    controller: 'product',
    action: 'addFiles'
  },

  '/product/removefiles':{
    controller: 'product',
    action: 'removeFiles'
  },

  '/product/updateicon':{
    controller: 'product',
    action: 'updateIcon'
  },

  '/product/removeicon':{
    controller: 'product',
    action: 'removeIcon'
  },


  '/product/findbyid/:id':{
    controller: 'product',
    action: 'findById'
  },

  '/product/update/:id':{
    controller: 'product',
    action: 'update'
  },

  '/saleopportunity/find/:page':{
    controller: 'saleopportunity',
    action: 'find'
  },

  '/invoice/find/:page':{
    controller: 'invoice',
    action: 'find'
  },

  '/line/get':{
    controller: 'line',
    action: 'get'
  },

  '/color/get':{
    controller: 'color',
    action: 'get'
  },

  '/usersap/get':{
    controller:'usersap',
    action:'get'
  },


  '/productcategory/find/:page':{
    controller: 'productcategory',
    action: 'find'
  },

  '/productcategory/create':{
    controller: 'productcategory',
    action: 'create'
  },

  '/productcategory/getallcategories':{
    controller: 'productcategory',
    action: 'getAllCategories'
  },

  '/productcategory/getcategoriesgroups':{
    controller: 'productcategory',
    action: 'getCategoriesGroups'
  },

  '/productcategory/getmaincategories':{
    controller: 'productcategory',
    action: 'getMainCategories'
  },

  '/productcategory/findbyid/:id':{
    controller: 'productcategory',
    action: 'findById'
  },

  '/productcategory/destroy/:id':{
    controller: 'productcategory',
    action: 'destroy'
  },

  '/productcategory/update/:id':{
    controller: 'productcategory',
    action: 'update'
  },

  '/productfilter/find/:page':{
    controller: 'productfilter',
    action: 'find'
  },

  '/productfilter/list':{
    controller:'productfilter',
    action: 'list'
  },

  '/productfilter/create':{
    controller: 'productfilter',
    action: 'create'
  },

  '/productfilter/findbyid/:id':{
    controller: 'productfilter',
    action: 'findById'
  },

  '/productfilter/destroy/:id':{
    controller: 'productfilter',
    action: 'destroy'
  },

  '/productfiltervalue/create':{
    controller: 'productfiltervalue',
    action:'create'
  },

  '/productfiltervalue/update/:id':{
    controller: 'productfiltervalue',
    action:'update'
  },

  '/productfiltervalue/destroy/:id':{
    controller: 'productfiltervalue',
    action:'destroy'
  },

  '/productcolor/getall':{
    controller: 'productcolor',
    action:'getAll'
  },

  '/productbrand/getall':{
    controller: 'productbrand',
    action:'getAll'
  },

  '/productsize/create':{
    controller: 'productsize',
    action:'create'
  },

  '/productsize/update/:id':{
    controller: 'productsize',
    action:'update'
  },

  '/productsize/destroy/:id':{
    controller: 'productsize',
    action:'destroy'
  },

  '/productgroup/find/:page':{
    controller: 'productgroup',
    action: 'find'
  },

  '/productgroup/findbyid/:id':{
    controller: 'productGroup',
    action: 'findById'
  },

  '/productgroup/getVariantGroupProducts':{
    controller: 'productgroup',
    action: 'getvariantgroupproducts'
  },

  '/productgroup/findbyid/:id':{
    controller: 'productGroup',
    action: 'findById'
  },

  '/productgroup/create':{
    controller: 'productgroup',
    action:'create'
  },

  '/productgroup/update/:id':{
    controller: 'productgroup',
    action:'update'
  },

  '/productgroup/destroy/:id':{
    controller: 'productgroup',
    action:'destroy'
  },

  '/productgroup/addproducttogroup':{
    controller: 'productgroup',
    action:'addProductToGroup'
  },


  '/productgroup/removeproductfromgroup':{
    controller: 'productgroup',
    action:'removeProductFromGroup'
  },

  '/productgroup/search':{
    controller: 'productgroup',
    action: 'search'
  },

  '/productgroup/updateicon':{
    controller: 'productgroup',
    action: 'updateIcon'
  },

  '/productgroup/removeicon':{
    controller: 'productgroup',
    action: 'removeIcon'
  },

  '/productgroup/getgroupvariants/:id':{
    controller: 'productgroup',
    action: 'getGroupVariants'
  }





  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the custom routes above, it   *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

};
