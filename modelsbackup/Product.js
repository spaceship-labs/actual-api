module.exports = {
    //connection: 'mysql',
    //migrate: 'alter',
    //tableName: 'Product',
    //tableNameSqlServer: 'OITM',
    attributes: {
        /*----------------/
            #SAP FIELDS
        /*---------------*/

        ItemCode:{
          type:'string',
          primaryKey:true
        },

        ItemName:{type:'string'},
        ItmsGrpCod:{ //Brand
            type:'integer',
            model:'productbrand'
        },
        SuppCatNum:{type:'string',size:17},
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
        U_importador: {type:'string',size:60},
        U_pctPuntos:{type:'float'},
        U_FAMILIA:{type:'string', size:30},


        //FIELDS FROM PRICE TABLE
        PriceList:{type:'integer', size: 4},
        Price:{type:'float'},
        Currency:{type:'string',size:3},

        /*----------------/
            #EXTRA FIELDS
        /*---------------*/
        Name:{type:'string'},
        Handle:{type:'string'},
        Description:{type:'text'},
        //CHECAR Model:{type:'string'},
        Brand:{ //BrandExtra
            type:'integer',
            model:'productbrand'
        },
        Grouper:{type:'string',size:17},
        SA:{type:'text'},
        MainFeatures:{type:'text'},
        Restrictions:{type:'text'},
        Color: {type:'string'},
        DetailedColor:{type:'string'},
        GuaranteeText:{type:'text'},
        GuaranteeUnit:{type:'integer'},
        GuaranteeUnitMsr: {type:'string',size:30},
        Seats:{type:'string'},
        DesignedInCountry:{type:'string'},
        MadeInCountry:{type:'string'},
        EnsembleTime:{type:'string'},
        Ensemble:{type:'string'},
        PackageContent:{type:'text'},
        CommercialPieces:{type:'integer'},
        DeliveryPieces:{type:'integer'},
        Length:{type:'float'},
        LengthUnitMsr:{type:'string'},
        Width:{type:'float'},
        WidthUnitMsr:{type:'string'},
        Height:{type:'float'},
        HeightUnitMsr:{type:'string'},
        Volume:{type:'float'},
        VolumeUnitMsr:{type:'string'},
        Weight:{type:'float'},
        WeightUnitMsr:{type:'string'},
        icon_filename:{type:'string'},
        icon_name:{type:'string'},
        icon_type:{type:'string'},
        icon_typebase:{type:'string'},
        icon_size:{type:'integer'},
        icon_description:{type:'string'},
        Video:{type:'text'},
        Characteristics:{type:'text'},
        OnOffline:{type:'boolean'},
        OnStudio:{type:'boolean'},
        OnHome:{type:'boolean'},
        OnKids:{type:'boolean'},
        OnAmueble:{type:'boolean'},
        ImagesOrder:{type:'string'},
        Conservation: {type:'text'},

        //RELATIONS
        files: {
          collection: 'productfile',
          via:'Product',
          //excludeSync: true
        },

        Sizes: {
          collection: 'productsize',
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

        FilterValues:{
            collection:'ProductFilterValue',
            through: 'product_productfiltervalue'
        },

        Colors:{
            collection:'ProductColor',
            through: 'product_productcolor'

        },

        Groups: {
          collection: 'ProductGroup',
          through: 'product_productgroup'
        }

    },

}
