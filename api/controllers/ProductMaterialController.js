var _ = require('underscore');
var async = require('async');

module.exports = {

  getAll: function(req, res){
    ProductMaterial.find({}).exec(function getMaterials(err, materials){
      if(err) throw(err);
      res.json(materials);
    });
  },

  updateAll: function(req, res){
    var form = req.params.all();
    var editMaterials = form.materials;
    var toAdd = [];
    var toRemove = [];
    ProductMaterial.find({}).exec(function findMaterials(err, materials){

      //ADDING MATERIALS
      if(materials.length > 0){
        editMaterials.forEach(function(editMaterial){

          if( _.where(materials , {Name: editMaterial.Name}).length <= 0 ){
            toAdd.push(editMaterial);
          }
        });
      }
      else{
        editMaterials.forEach(function(editMaterial){
          toAdd.push(editMaterial);
        });
      }

      //REMOVING MATERIALS
      if(materials.length > 0){
        materials.forEach(function(material){
          if( _.where(editMaterials, {Name: material.Name}).length <= 0 ){
            toRemove.push(material.id);
          }
        });
      }

      function createMaterials(callback){
        if(toAdd.length > 0){
          ProductMaterial.create(toAdd).exec(function(errCreate, created){
            if(errCreate) throw(errCreate);
            callback();
          });
        }else{
          callback();
        }
      }

      function removeMaterials(callback){
        if(toRemove.length > 0){
          ProductMaterial.destroy({id: toRemove}).exec(function(errRemove){
            if(errRemove) throw(errRemove);
            callback();
          });
        }else{
          callback();
        }
      }

      function destroyProductMaterialRelation(callback){
        if(toRemove.length > 0){
          Product_ProductMaterial.destroy({id:toRemove}).exec(function(errDestroy){
            if(errDestroy) throw(errDestroy);
            callback();
          });
        }else{
          callback();
        }
      }

      async.waterfall([
        createMaterials,
        removeMaterials,
        destroyProductMaterialRelation
      ], function completeCb(){
        res.json({updated: true});
      })

    });
  }
}
