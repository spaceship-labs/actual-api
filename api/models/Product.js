//APP/SAP COLLECTION
module.exports = {
  schema: true,
  migrate: 'alter',
  tableName: 'Product',
  attributes: {
    /*----------------/
          #SAP FIELDS
      /*---------------*/
    ItemCode: {
      type: 'string',
      //primaryKey:true
    },
    ItemName: { type: 'string' },
    ItmsGrpCod: {
      //Brand
      model: 'productbrand',
    },
    SuppCatNum: { type: 'string',  },
    CodeBars: { type: 'string' },
    OnHand: { type: 'float' },
    IsCommited: { type: 'float' },
    OnOrder: { type: 'float' },
    Available: { type: 'float' },
    PicturName: { type: 'string' },
    SalUnitMsr: { type: 'string' },
    U_LINEA: { type: 'string',  },
    U_PRODUCTO: { type: 'string',  },
    U_COLOR: { type: 'string',  },
    U_garantia: { type: 'string',  },
    U_disenado_en: { type: 'string',  },
    U_ensamblado_en: { type: 'string',  },
    U_importador: { type: 'string',  },
    U_pctPuntos: { type: 'float' },
    U_FAMILIA: { type: 'string',  },
    U_Empresa: { type: 'string' },
    nameSA: { type: 'string', columnName: 'EmpresaName' },
    Active: { type: 'string' },
    U_ClaveProdServ: { type: 'string' },
    U_ClaveUnidad: { type: 'string' },

    //FIELDS FROM PRICE TABLE
    PriceList: { type: 'number',  },
    Price: { type: 'float' },
    Currency: { type: 'string',  },
    Discount: { type: 'float' },
    DiscountPrice: { type: 'float' },

    /*----------------/
          #EXTRA FIELDS
      /*---------------*/
    Name: { type: 'string' },
    Handle: { type: 'string' },
    Description: { type: 'text' },
    //CHECAR Model:{type:'string'},

    Brand: {
      //BrandExtra
      model: 'productbrand',
    },

    Service: { type: 'string' },
    Grouper: { type: 'string',  },
    SA: { type: 'text' },
    MainFeatures: { type: 'text' },
    Restrictions: { type: 'text' },
    Color: { type: 'string' },
    DetailedColor: { type: 'string' },
    GuaranteeText: { type: 'text' },
    GuaranteeUnit: { type: 'number' },
    GuaranteeUnitMsr: { type: 'string',  },
    Seats: { type: 'string' },
    DesignedInCountry: { type: 'string' },
    MadeInCountry: { type: 'string' },
    EnsembleTime: { type: 'string' },
    Ensemble: { type: 'string' },
    PackageContent: { type: 'text' },
    CommercialPieces: { type: 'number' },
    DeliveryPieces: { type: 'number' },
    Length: { type: 'float' },
    LengthUnitMsr: { type: 'string' },
    Width: { type: 'float' },
    WidthUnitMsr: { type: 'string' },
    Height: { type: 'float' },
    HeightUnitMsr: { type: 'string' },
    Volume: { type: 'float' },
    VolumeUnitMsr: { type: 'string' },
    Weight: { type: 'float' },
    WeightUnitMsr: { type: 'string' },
    icon_filename: { type: 'string' },
    icon_name: { type: 'string' },
    icon_type: { type: 'string' },
    icon_typebase: { type: 'string' },
    icon_size: { type: 'number' },
    icon_description: { type: 'string' },
    Video: { type: 'text' },
    Characteristics: { type: 'text' },
    OnOffline: { type: 'boolean' },
    OnStudio: { type: 'boolean' },
    OnHome: { type: 'boolean' },
    OnKids: { type: 'boolean' },
    OnAmueble: { type: 'boolean' },
    ImagesOrder: { type: 'string' },
    Conservation: { type: 'text' },

    CheckedPhotos: { type: 'boolean' },
    CheckedStructure: { type: 'boolean' },
    CheckedDescription: { type: 'boolean' },
    CheckedPackage: { type: 'boolean' },
    CheckedFeatures: { type: 'boolean' },

    ChairBackHeight: { type: 'float' },
    ChairBackHeightUnitMsr: { type: 'string' },
    SeatHeight: { type: 'float' },
    SeatHeightUnitMsr: { type: 'string' },
    ArmRestHeight: { type: 'float' },
    ArmRestHeightUnitMsr: { type: 'string' },
    Depth: { type: 'float' },
    DepthUnitMsr: { type: 'string' },

    freeSale: { type: 'boolean' },
    freeSaleStock: {
      type: 'number',
      defaultsTo: 0,
    },
    freeSaleDeliveryDays: {
      type: 'number',
      defaultsTo: 0,
    },
    salesCount: {
      type: 'number',
      defaultsTo: 0,
    },
    slowMovement: { type: 'boolean' },
    seenTimes: { type: 'number' },
    immediateDelivery: { type: 'boolean' },
    ShopDelivery: { type: 'boolean' },
    WeekendDelivery: { type: 'boolean' },
    deliveryType: {
      type: 'string',
      isIn: ['bigticket', 'softline'],
    },
    spotlight: { type: 'boolean' },

    actual_studio_merida: { type: 'number' },
    actual_studio_malecon: { type: 'number' },
    actual_studio_playa_del_carmen: { type: 'number' },
    actual_studio_cumbres: { type: 'number' },
    actual_isla_merida: {type: 'number'},
    actual_atelier: { type: 'number' },
    actual_home_xcaret: { type: 'number' },
    actual_home_merida: { type: 'number' },
    actual_home: { type: 'number' },
    actual_studio: { type: 'number' },
    actual_kids: { type: 'number' },
    actual_puerto_cancun: { type: 'number' },
    actual_marketplace: { type: 'number' },

    proyectos: { type: 'number' },
    actual_proyect: { type: 'number' },

    excludeWeb: { type: 'boolean' },

    //CACHE DISCOUNT PRICES BY STORE
    discountPrice_actual_studio_merida: { type: 'float' },
    discountPrice_actual_studio_malecon: { type: 'float' },
    discountPrice_actual_studio_playa_del_carmen: { type: 'float' },
    discountPrice_actual_studio_cumbres: { type: 'float' },
    discountPrice_actual_isla_merida: { type: 'float' },
    discountPrice_actual_atelier: { type: 'float' },
    discountPrice_actual_home_xcaret: { type: 'float' },
    discountPrice_actual_home_merida: { type: 'float' },
    discountPrice_proyectos: { type: 'float' },
    discountPrice_actual_proyect: { type: 'float' },
    discountPrice_actual_marketplace: { type: 'float' },

    //RELATIONS
    files: {
      collection: 'productfile',
      via: 'Product',
      //excludeSync: true
    },
    Sizes: {
      collection: 'productsize',
      via: 'Product',
    },
    Categories: {
      collection: 'ProductCategory',
      via: 'Products',
      dominant: true,
    },
    FeaturedCategories: {
      collection: 'ProductCategory',
      via: 'FeaturedProducts',
    },
    FilterValues: {
      collection: 'ProductFilterValue',
      via: 'Products',
      dominant: true,
    },
    Groups: {
      collection: 'ProductGroup',
      via: 'Products',
    },
    CustomBrand: {
      model: 'CustomBrand',
    },
    QuotationDetails: {
      collection: 'QuotationDetail',
      via: 'Product',
    },
    PackageRules: {
      collection: 'PackageRule',
      via: 'Product',
    },
  },
};
