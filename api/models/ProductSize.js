module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
    Length:{type:'string'},
    Width:{type:'string'},
    Height:{type:'string'},
    Volume:{type:'string'},
    Weight:{type:'string'},

    Product:{
      model:'product',
      columnName:'ItemCode',
      type:'string',
      size:20,
    }
	}
}
