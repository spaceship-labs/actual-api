var request = require('request');
var alegraUser = 'emmanuelyupit08@gmail.com';
var alegraToken = '21ff41b7fdd163d8be00';
var alegraURL = 'https://app.alegra.com/api/v1/invoices';

module.exports = {
  //Obtiene token de autorizacion  ej: base_64('ejemploapi@alegra.com:tokenejemploapi12345') http://developer.alegra.com/docs/autenticacion
  getAuthToken : function(){
    return new Buffer(alegraUser + ":" + alegraToken).toString("base64");
  },
  //Crea una factura apartir de un ID de carrito primero recuperar el registro y poblar la informacion de productos, total etc  a
  createFactura : function(id){

  }
}

