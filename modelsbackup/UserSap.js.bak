module.exports = {
    schema: true,
    migrate: 'safe',
	tableName: 'usersap',
	connection: 'mysql',
	tableNameSqlServer: 'OUSR',
	attributes:{
		USERID:{type:'integer'},
		INTERNAL_K:{type:'integer'},
		USER_CODE:{type:'string',size:8},
		U_NAME:{type:'string',size:155},
		SUPERUSER:{type:'string',size:1},
		userapp:{
			model:'user',
			unique:true
		}
	}
};