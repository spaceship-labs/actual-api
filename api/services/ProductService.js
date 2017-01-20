module.exports = {
	mapProductsMainPromo: mapProductsMainPromo
};

function mapProductsMainPromo(products){
	return products.map(assignProductMainPromo);
}

function assignProductMainPromo(product){
  if(product.Promotions && product.Promotions.length > 0){
    var indexMaxPromo = 0;
    var maxPromo = 0;

    for(var i = 0; i< product.Promotions.length; i++){
      if(product.Promotions[i].discountPg1 >= maxPromo){
        maxPromo = product.Promotions[i].discountPg1;
        indexMaxPromo = i;
      }    	
    }
    product.mainPromo =  product.Promotions[indexMaxPromo];
  }

  return product;
}