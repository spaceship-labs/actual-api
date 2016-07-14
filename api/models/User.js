//APP COLLECTION
module.exports = {
    migrate:'alter',
    schema: true,
    attributes: {
        password: {
            type: 'string'
        },
        email: {
            type: 'email',
            required: true,
            unique:true
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
        accessList: {
          type:'array'
        },

        dialCode: {type:'string'},
        phone:{type:'string'},
        mobileDialCode:{type:'string'},
        mobilePhone: {type:'string'},

        externalNumber:{type:'string'},
        internalNumber:{type:'string'},
        neighborhood: {type:'string'},
        municipality: {type:'string'},
        city:{type:'string'},
        entity:{type:'string'},
        zipCode: {type:'string'},
        street: {type:'string'},
        street2: {type:'string'},
        references:{type:'text'},

        bussinessLegalName: {type:'string'},
        bussinessName: {type:'string'},
        rfc:{type:'string'},

        invoiceEmail: {type:'string'},
        invoiceDialCode: {type:'string'},
        invoicePhone: {type:'string'},
        invoiceStreet: {type:'string'},
        invoiceExternalNumber:{type:'string'},
        invoiceInternalNumber:{type:'string'},
        invoiceNeighborhood: {type:'string'},
        invoiceMunicipality: {type:'string'},
        invoiceCity:{type:'string'},
        invoiceEntity:{type:'string'},
        invoiceZipCode: {type:'string'},

        bussinessLegalName: {type:'string'},
        bussinessName: {type:'string'},
        rfc:{type:'string'},
        legalRepresentative: {type:'string'},
        bank:{type:'string'},
        bankAccount:{type:'string'},
        interbankClabe: {type:'string'},

        //relations - permissions
        permissions: {
          collecion: 'permission',
          via: 'owners'
        },

        Commission:{
          model:'Commission'
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
