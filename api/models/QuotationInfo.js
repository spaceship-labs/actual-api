module.exports = {
  //migrate: 'alter',
  attributes: {
    isClosed: {type:'boolean'},
    notes: {type:'text'},
    isClosedReason: {type:'string'},
    Quotation:{
      model:'Quotation',
      //collection:'Quotation'
      //columnName: 'DocEntry',
      unique:true
      //via: 'Info'
    }
  }
};
