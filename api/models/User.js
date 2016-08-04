//APP COLLECTION
module.exports = {
    migrate:'alter',
    schema: true,
    attributes: {
        ewallet:{
          type: 'float',
          required: true,
          defaultsTo: 0
        },
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
        lastLogin : {
          type: 'datetime'
        },
        company: {
            type:'string'
        },
        SlpCode: {
          collection: 'Seller',
          via: 'User'
        },
        Quotations:{
          collection: 'Quotation',
          via:'User'
        },
        Orders:{
          collection:'Order',
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
        companies: {
          collection: 'company',
          via: 'users'
        },
        companyMain: {
          model: 'company'
        },
        companyActive: {
          model: 'company'
        },
        permissions: {
          collection: 'permission',
          via: 'owners'
        },
        Commission:{
          model:'Commission'
        },
        role: {
          collection: 'role',
          via: 'owner'
        },
        toJSON: function () {
          var obj = this.toObject();
          if (obj.SlpCode && isArray(obj.SlpCode) && obj.SlpCode.length > 0) {
            obj.SlpCode = obj.SlpCode[0];
          }
          delete obj.password;
          delete obj.socialProfiles;
          return obj;
        }
    },
    beforeUpdate: function (values, next) {
        if (values.new_password) {
          values.password = CipherService.hashPassword(values.new_password);
        }
        next();
    },
    beforeCreate: function (values, next) {
        if (values.password) {
          values.password = CipherService.hashPassword(values.password);
        }
        next();
    }
};

function isArray(o) {
  return o.constructor === Array;
}
