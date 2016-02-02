module.exports = {
    schema: true,
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
