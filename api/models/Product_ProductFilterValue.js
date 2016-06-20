module.exports = {
  tableName: 'product_filtervalues__productfiltervalue_products',
  attributes:{
    value : 'integer'
    ,productfiltervalue_Products : { //product filter value
      model : 'productfiltervalue'
    }
    ,product_FilterValues : { //product
      model : 'product'
    }

  }
}
