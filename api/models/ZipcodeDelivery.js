module.exports = {
  schema: true,
  migrate:'alter',
  tableName: 'zipcode',
  attributes: {
    cp:{type:'string'},
    estado:{type:'string'},
    municipio:{type:'string'},
    asentamiento:{type:'string'},
    entrega:{
        type:'string',
        isIn: ['SI', 'NO']
    },
    sin_armado:{type:'number'},
    con_armado:{type:'number'},
    dias_ent_bigticket:{type:'number'},
    entrega_pta:{type:'number'},
    dias_ent_softline:{type:'number'},

    ZipcodeState: {model: 'ZipcodeState'}
  }
};
