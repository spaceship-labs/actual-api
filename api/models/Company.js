/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  tableName: 'Warehouse',
  schema: true,
  migrate:'alter',
  attributes: {
    //sap fields
    WhsCode:{
      type:'string',
    },
		WhsName:{
      type:'string',
    },
		IntrnalKey:{
      type:'integer'
    },
		U_Calle:{
      type:'string',
    },
		U_noExterior:{
      type:'string',
    },
		U_noInterior:{
      type:'string',
    },
		U_Colonia:{
      type:'string',
    },
		U_Localidad:{
      type:'string',
      
    },
		U_Municipio:{
      type:'string',
      
    },
		U_Estado:{
      type:'string',
      
    },
		U_Pais:{
      type:'string',
      
    },
		U_CodigoPostal:{
      type:'string',
      
    },
		U_Serie_FCP:{
      type:'string',
      
    },
		U_Serie_ND:{
      type:'string',
      
    },
		U_Serie_NC:{
      type:'string',
      
    },
		U_Serie_FR:{
      type:'string',
      
    },
		U_Serie_FA:{
      type:'string',
      
    },
		U_EsTransito:{
      type:'integer'
    },
		U_Bodega:{
      type:'integer'
    },
		U_InfoWhs:{
      type:'integer'
    },
		U_Procesado:{
      type:'integer'
    },

    //relations
    Stores:{
      collection:'store',
      via:'Warehouse'
    }
    /*
    users: {
      collection: 'user',
      via: 'companies'
    },
    Promotions:{
      collection: 'promotion',
      via: 'Companies'
    },
    Payments: {
      collection:'Payment',
      via:'Store'
    },
    Quotations: {
      collection:'Quotation',
      via:'Store'
    },
    Orders: {
      collection:'Order',
      via:'Store'
    },
    ProductsPackages:{
      collection:'ProductGroup',
      via:'Stores'
    }
    */
  }
};

