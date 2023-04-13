//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema: true,
  attributes: {
    role: {
      type: 'string',
      isIn: ['admin', 'client']
    },
    password: {
      type: 'string'
    },
    email: {
      type: 'string',
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
    lastLogin: {
      type:'string', columnType:'datetime'
    },
    active: {
      type: 'boolean',
      defaultsTo: true
    },

    CardCode: { type: 'string' },

    dialCode: { type: 'string' },
    phone: { type: 'string' },
    mobileDialCode: { type: 'string' },
    mobilePhone: { type: 'string' },

    externalNumber: { type: 'string' },
    internalNumber: { type: 'string' },
    neighborhood: { type: 'string' },
    municipality: { type: 'string' },
    city: { type: 'string' },
    entity: { type: 'string' },
    zipCode: { type: 'string' },
    street: { type: 'string' },
    street2: { type: 'string' },
    references: { type: 'string' },

    bussinessLegalName: { type: 'string' },
    bussinessName: { type: 'string' },
    rfc: { type: 'string' },

    invoiceEmail: { type: 'string' },
    invoiceDialCode: { type: 'string' },
    invoicePhone: { type: 'string' },
    invoiceStreet: { type: 'string' },
    invoiceExternalNumber: { type: 'string' },
    invoiceInternalNumber: { type: 'string' },
    invoiceNeighborhood: { type: 'string' },
    invoiceMunicipality: { type: 'string' },
    invoiceCity: { type: 'string' },
    invoiceEntity: { type: 'string' },
    invoiceZipCode: { type: 'string' },

    legalRepresentative: { type: 'string' },
    bank: { type: 'string' },
    bankAccount: { type: 'string' },
    interbankClabe: { type: 'string' },

    brokerCode: { type: 'string' },
    brokerName: { type: 'string' },

    //relations - permissions
  },
  toJSON: function () {
    var obj = this.toObject();
    obj.name = obj.firstName + ' ' + obj.lastName;
    delete obj.password;
    return obj;
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
