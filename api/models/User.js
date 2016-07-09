//APP COLLECTION
module.exports = {
    schema: true,
    attributes: {
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
        Quotations:{
          collection: 'Quotation',
          via:'User'
        },
        Records: {
          collection:'QuotationRecord',
          via:'User'
        },
        accessList:{
          type:'array'
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
