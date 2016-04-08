module.exports = {
	connection: 'mysql',
	//migrate: 'alter',
	tableName: 'Product',
	tableNameSqlServer: 'OITM',
	attributes: {
		ItemCode:{
          type:'string',
          primaryKey:true
        },

        ItemName:{type:'string'},
        CodeBars:{type:'string'},
        OnHand:{type:'string'},
        IsCommited:{type:'float'},
        OnOrder:{type:'string'},
        SalUnitMsr:{type:'string'},
        U_LINEA:{type:'string',size:60},
        U_PRODUCTO:{type:'string',size:60},
        U_COLOR:{type:'string',size:60},
        U_garantia:{type:'string',size:60},
        U_disenado_en:{type:'string',size:60},
        U_ensamblado_en:{type:'string',size:60},


        //FIELDS FROM PRICE TABLE
        PriceList:{type:'integer', size: 4},
        Price:{type:'float'},
        Currency:{type:'string',size:3},

        //EXTRA FIELDS
        Name:{type:'string'},
        Description:{type:'text'},
        //CHECAR Model:{type:'string'},
        MainFeatures:{type:'text'},
        Restrictions:{type:'text'},
        Color: {type:'string'},
        DetailedColor:{type:'string'},
        GuaranteeText:{type:'text'},
        Seats:{type:'string'},
        //DesignedInCountry:{type:'string'},
        //MadeInCountry:{type:'string'},
        Ensemble:{type:'string'},
        PackageContent:{type:'text'},
        icon_filename:{type:'string'},
        icon_name:{type:'string'},
        icon_type:{type:'string'},
        icon_typebase:{type:'string'},
        icon_size:{type:'integer'},

        //RELATIONS
        files: {
          collection: 'productfile',
          via:'Product',
          //excludeSync: true
        },

        /*
        stock:{
          collection: 'itemwarehouse',
          via: 'ItemCode'
        },
        */

        Categories:{
          collection: 'ProductCategory',
          through: 'product_productcategory'
        },

        Displays:{
            collection:'ProductDisplay',
            through:'product_productdisplay'
        },

        Brand: {
            model:'ProductBrand'
        },

        UseZones: {
            collection: 'ProductUseZone',
            through: 'product_productusezone',
        },

        Materials: {
            collection: 'ProductMaterial',
            through: 'product_productmaterial'
        },

        FilterValues:{
            collection:'ProductFilterValue',
            through: 'product_productfiltervalue'

        },

        Guarantee: {
            model:'ProductGuarantee'
        },

	},

}
