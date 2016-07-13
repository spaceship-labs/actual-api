//APP COLLECTION
module.exports = {
  migrate: 'alter',
  attributes: {
    name:{type:'string'},
    handle:{type:'string'},
    type:{type:'string'},
    startDate:{type:'datetime'},
    endDate:{type:'datetime'},
    //tiendas aplicables
    //productos aplicables, verificar si aplicar sobre producto o sobre filtros/categorias
  }
};
