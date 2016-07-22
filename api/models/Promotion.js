//APP COLLECTION
module.exports = {
  migrate: 'alter',
  attributes: {
    name:{type:'string'},
    code:{type:'string',unique:true},
    handle:{type:'string'},
    type:{type:'string'},
    startDate:{type:'datetime'},
    endDate:{type:'datetime'},
    discountPg1:{type:'float'},
    discountPg2:{type:'float'},
    discountPg3:{type:'float'},
    discountPg4:{type:'float'},
    discountPg5:{type:'float'},
    //tiendas aplicables
    //productos aplicables, verificar si aplicar sobre producto o sobre filtros/categorias
    productSearchTerm: {type:'string'},
    OnStudio:{type:'boolean'},
    OnHome:{type:'boolean'},
    OnKids:{type:'boolean'},
    OnAmueble:{type:'boolean'},
    U_Empresa: {type:'string'},
    excludedProducts: {type:'array'},
    hasLM:{type:'boolean'},
    pushMoneyUnit:{type:'float'},
    pushMoneyUnitType:{
      type:'string',
      enum:['ammount','percent']
    },
    Categories:{
      collection:'ProductCategory',
      via:'Promotions'
    },
    FilterValues:{
      collection:'ProductFilterValue',
      via:'Promotions'
    },
    CustomBrands:{
      collection:'CustomBrand',
      via:'Promotions'
    },
    Groups:{
      collection:'ProductGroup',
      via:'Promotions'
    },
    Products:{
      collection:'Product',
      via:'Promotions'
    },
    Companies:{
      collection:'company',
      via:'Promotions'
    }

  }
};
