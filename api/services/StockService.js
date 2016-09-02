var Promise = require('bluebird');
var _ = require('underscore');				
var productWarehouseCollection 	= [];
var productStoreMap				= {};

/*
	Array of objects
	productWarehouseCollection example:
		{
			productId: <productid>,
			ItemCode : <itemcode>,
			01			 : <stock>,
			83			 : <stock>
		}

	Object with nested objects
	ProductStoreMap example:
		'<productId>':
			{
				productId 						: <productid>,
				ItemCode 							: <itemcode>,
				actual_studio_malecon	: <stock>,
				actual_studio_merida	: <stock>,
				....
			}


*/

module.exports = {
	cacheStoresStock: cacheStoresStock
};

function cacheStoresStock(){
	var store = [];
	return Store.find({})
		.then(function(storesResult){
			stores = storesResult;
			return createProductWarehouseCollection();
		})
		.then(function(){
			sails.log.info('created product warehouses collection');
			return Promise.each(stores,getStockByStore);
		})
		.then(function(){
			sails.log.info('Finished store stock cache');
			return productStoreMap;
		});
}

function generateStoreStockPromises(stores){
	var promises = [];
	for(var i=0;i<stores.length;i++){
		promises.push( getStockByStore(stores[i]) );
	}
	return promises;
}

function getStockByStore(store){
	var storeId = store.id;
	sails.log.info('getStockByStore : ' + store.name);
	return getStoreWarehouses(storeId)
		.then(function(warehouses){
			sails.log.info('warehouses');
			sails.log.info(warehouses);
			mapProductsByStore(store, warehouses);
			sails.log.info('termino getStockByStore : ' + store.name);
			return true;
		});
}

function mapProductsByStore(store, warehouses){
	var storeCode 					= store.code;
	var warehousesCodes 		= getWarehousesCodes(warehouses);
	for(var i = 0; i < productWarehouseCollection.length; i++){
		var pwm = productWarehouseCollection[i];
		var productId = pwm.productId;
		var stock 		= sumProductStockByWarehouses(warehousesCodes, pwm);
		productStoreMap[productId] = productStoreMap[productId] || {};
		productStoreMap[productId].ItemCode = pwm.ItemCode;
		productStoreMap[productId][storeCode] = stock;
	}
}

function sumProductStockByWarehouses(warehousesCodes, productMap){
	var stock = 0;
	for(var i=0; i<warehousesCodes.length; i++){
		for(var whsCode in productMap){
			//sails.log.info('productMap');
			//sails.log.info(productMap);
			//sails.log.info('warehousesCodes[i] = ' + warehousesCodes[i]);
			if(whsCode == warehousesCodes[i]){
				stock += productMap[whsCode]; 
			}
		}
	}
	return stock;
}

function getWarehousesCodes(warehouses){
	var warehousesCodes = warehouses.map(function(w){
		return w.WhsCode;
	});
	return warehousesCodes;
}

function getProductsIds(products){
	var productsIds = products.map(function(p){
		return p.id;
	});
	return productsIds;
}

function getAllWarehouses(){
	return Company.find();
}

function createProductWarehouseCollection(){
	var productsQuery = getDefaultProductQuery();
	var products      = [];
	var promises    	= [];
	return Product.find(productsQuery)
		.then(function(products){
			sails.log.info('products: ' + products.length);
			/*
			for(var i = 0;i< products.length; i++){
				promises.push(
					createSingleProductWarehouseMap(products[i])
				);
			}
			return Promise.all(promises);
			*/
			return Promise.each(products, createSingleProductWarehouseMap);
		})
		.then(function(maps){
			productWarehouseCollection = maps;
			sails.log.info('Termino el product stock map');
			return true;
		});				
}

function createSingleProductWarehouseMap(product){
	//sails.log.info('createSingleProductWarehouseMap');
	var ItemCode = product.ItemCode
	return ItemWarehouse.find({
		ItemCode: ItemCode,
	})
	.then(function(itemWarehouses){
		//sails.log.info('itemWarehouses: ' + itemWarehouses.length);
		var productWarehouseMap = createWarehouseMapFromArray(itemWarehouses, product.id);
		return productWarehouseMap;
	});
}

function createWarehouseMapFromArray(itemWarehouses, productId){
	var stockMap = {
		productId: productId,
		ItemCode : itemWarehouses[0].ItemCode || false
	};
	for(var i=0; i<itemWarehouses.length;i++){
		var iw = itemWarehouses[i];
		stockMap[iw.WhsCode] = iw.Available; 
	}
	return stockMap;
}

function getStoreWarehouses(storeId){
  return Store.findOne({id:storeId}).populate('Warehouse')
    .then(function(store){
      if(!store || !store.Warehouse){
        return Promise.reject([]);
      }
      return Delivery.find({ToCode: store.Warehouse.WhsCode, Active:'Y' });
    });
}

function getDefaultProductQuery(){
  var priceQuery  = {
    '>=': 0,
    '<=': Infinity
  };    
  var query       = {
    Price: priceQuery,
    Active: 'Y',
    Available: {'>':0},
    select:['ItemCode']
  };	
  return query;
}