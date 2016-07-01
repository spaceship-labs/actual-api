module.exports = {
    schema: true,
    //migrate: 'safe',
    migrate: 'alter',
    attributes: {
        /*username: {
            type: 'string',
            required: true,
            unique: true,
            alphanumericdashed: true
        },*/
        /*
        id: {
          type: 'integer',
          unique: true,
          primaryKey: true
        },
        */
        password: {
            type: 'string'
        },
        email: {
            type: 'email',
            required: true
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
        company: {
            type:'string'
        },

        SlpCode: {
          type:'integer',
          columnName:'SlpCode',
          model:'Seller'
        },

        Records: {
          collection:'QuotationRecord',
          via:'User'
        },
        /*
        Clients :{
          collection: 'client',
          via: 'seller'
        },*/

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
