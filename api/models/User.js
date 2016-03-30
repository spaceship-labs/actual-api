module.exports = {
    schema: true,
    migrate: 'alter',
    connection: 'mysql',
    attributes: {
        /*username: {
            type: 'string',
            required: true,
            unique: true,
            alphanumericdashed: true
        },*/
        id: {
          type: 'integer',
          unique: true,
          primaryKey: true
        },
        password: {
            type: 'string'
        },
        email: {
            type: 'email',
            required: true,
            unique: true
        },
        firstName: {
            type: 'string',
            defaultsTo: '',
        },
        lastName: {
            type: 'string',
            defaultsTo: ''
        },
        lastLogin : 'datetime',
        isAdmin : {
            type : 'boolean',
            defaultsTo : false,
            //required : true
        },
        userType: {
            type:'string',
            defaultsTo: 'seller'
        },
        userSap:{
            model:'userSap',
            unique:true
        },
        toJSON: function () {
            var obj = this.toObject();
            delete obj.password;
            delete obj.socialProfiles;
            return obj;
        }
    },
    beforeUpdate: function (values, next) {
        CipherService.hashPasswordUser(values);
        next();
    },
    beforeCreate: function (values, next) {
        CipherService.hashPasswordUser(values);
        next();
    }
};
