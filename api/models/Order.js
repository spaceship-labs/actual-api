//APP COLLECTION
module.exports = {
  migrate:'alter',
  attributes:{
    DocEntry:{type:'integer'},
    total:{type:'float'},
    Quotation:{
      model:'Quotation'
    },
    Sale: {
      model:'Sale'
    },
  }
}
