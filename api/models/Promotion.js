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
    discountPaymentGroup1:{type:'float'},
    discountPaymentGroup2:{type:'float'},
    discountPaymentGroup3:{type:'float'},
    discountPaymentGroup4:{type:'float'},
    discountPaymentGroup5:{type:'float'},
    //tiendas aplicables
    //productos aplicables, verificar si aplicar sobre producto o sobre filtros/categorias
    productSearchTerm: {type:'string'},
    Categories:{
      collection:'ProductCategory',
      via:'Promotions'
    },
    FilterValues:{
      collection:'FilterValue',
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
    OnStudio:{type:'boolean'},
    OnHome:{type:'boolean'},
    OnKids:{type:'boolean'},
    OnAmueble:{type:'boolean'},

  }
};
