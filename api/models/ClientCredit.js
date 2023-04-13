module.exports = {
	tableName:'SnCredito',
	schema: true,
	attributes:{
		Code: 'string',
		Name: 'string',
		U_Vigencia: {type:'string',columnType:'datetime'},
		lastModified: {type:'string',columnType:'datetime'}
	}
};