const moment = require('moment');
describe("Client service", function(){
  it("should map client fields", function(){
    const fields = {
      FirstName: 'test.FirstName',
      LastName: 'test.LastName',
      Birthdate: moment().toDate()
    };
    const mappedFields = ClientService.mapClientFields(fields);
    const expected = {
      FirstName: fields.FirstName,
      LastName: fields.LastName,      
      CardName: 'test.FirstName test.LastName',
      Birthdate: moment(fields.Birthdate).format(ClientService.CLIENT_DATE_FORMAT)
    };
    expect(mappedFields).to.deep.equal(expected);
  });

  it("should map fiscal fields", function(){
    const fields = {
      companyName: 'company.test'
    };
    const expected = {
      ...fields,
      Address: fields.companyName,
      AdresType: ClientService.ADDRESS_TYPE
    }
    const mappedFields = ClientService.mapFiscalFields(fields);
    expect(mappedFields).to.deep.equal(expected);
  });

  it("should filter contacts, not allowing empty FirstName field", function(){
    const contacts = [
      {id: "test.id1", FirstName: "test.fistName1", LastName:"test.lastName1"},
      {id: "test.id2", LastName:"test.lastName2"},
      {id: "test.id3", FirstName: "test.fistName3", LastName:"test.lastName3"},      
    ];
    const filteredContacts = ClientService.filterContacts(contacts);
    expect(filteredContacts.length).to.equal(2);
  });

  describe("validate fiscal address", function(){
    it("should return true when valid", function(){
      const validAddress = {companyName: "company.name"};
      expect(ClientService.isValidFiscalAddress(validAddress)).to.equal(true);
    });
    it("should return false when invalid", function(){
      const invalidAddress = {};
      expect(ClientService.isValidFiscalAddress(invalidAddress)).to.equal(false);
    });
  });

  describe("validate contact code", function(){
    it("should return true when valid", function(){
      const contactCode = 238;
      expect(ClientService.isValidContactCode(contactCode)).to.equal(true);
    });
    it("should return false when invalid", function(){
      const contactCode = "3941A";
      expect(ClientService.isValidContactCode(contactCode)).to.equal(false);
    });
  });

  describe("validate sap client create response", function(){
    it("should return true when valid, sending empty contacts params", function(){
      const sapContactParams = [];
      const responseData = {
        type: ClientService.CARDCODE_TYPE,
        result:"test.CardCode",
        pers:[]
      };
      const result = ClientService.validateSapClientCreation(responseData, sapContactParams);
      expect(result).to.equal(true);
    });
    it("should return true when valid, sending contacts params", function(){
      const sapContactParams = [
        {FistName:"first.name",LastName:"last.name"},
        {FistName:"first.name2",LastName:"last.name2"}
      ];
      const responseData = {
        type: ClientService.CARDCODE_TYPE,
        result:"test.CardCode",
        pers:["test.contactcode1", "test.contactcode2"]
      };
      const result = ClientService.validateSapClientCreation(responseData, sapContactParams);
      expect(result).to.equal(true);
    });

    it("should return and error when invalid, sending empty contacts params", function(){
      const sapContactParams = [];
      const responseData = {
        type: ClientService.CARDCODE_TYPE,
        result:"test.CardCode11111111111",
        pers: []
      };
      expect(() => ClientService.validateSapClientCreation(responseData, sapContactParams))
        .to.throw("Error al crear cliente en SAP");
    });

    it("should throw and error when invalid response type, sending empty contacts params", function(){
      const sapContactParams = [];
      const responseData = {
        type: ClientService.ERROR_TYPE,
        result:"Error message from SAP",
        pers: []
      };
      expect(() => ClientService.validateSapClientCreation(responseData, sapContactParams))
        .to.throw(responseData.result);
    });    
  });

  describe("validate sap client update response", function(){
    it("should return true when valid", function(){
      const responseData = {
        type: ClientService.CARDCODE_TYPE,
        result: "cardcode.1",
      }
      expect(ClientService.validateSapClientUpdate(responseData)).to.equal(true);
    });
    it("should throw and error when invalid", function(){
      const responseData = {
        type: ClientService.ERROR_TYPE,
        result: "Error SAP message",
      }
      expect(() => ClientService.validateSapClientUpdate(responseData))
        .to.throw("Error SAP message");

    });

  });
  
  describe("validate RFC", function(){
    it("should return false when invalid", function(){
      const invalidRFC = 'wrong.rfc';
      const result = ClientService.isValidRFC(invalidRFC);
      expect(result).to.be.equal(false);
    });

    it("should return true when valid", function(){
      const validrfc = 'ADB181230DA0';
      const result = ClientService.isValidRFC(validrfc);
      expect(result).to.be.equal(true);
    });

    it("should return false when using a date like 30/feb/18", function(){
      const validrfc = 'ADB180230DA0';
      const result = ClientService.isValidRFC(validrfc);
      expect(result).to.be.equal(false);
    });

    it("should return true when using a date like 28/feb/18 valid", function(){
      const validrfc = 'ADB180228DA0';
      const result = ClientService.isValidRFC(validrfc);
      expect(result).to.be.equal(true);
    });
    
    it("should return true when using an ampersand in the first three chars", function(){
      const validrfc = 'A&X040910HY2';
      const result = ClientService.isValidRFC(validrfc);
      expect(result).to.be.equal(true);
    });

    it("should return false when  ampersand is not in the first three chars", function(){
      const validrfc = 'ABX040&10HY2';
      const result = ClientService.isValidRFC(validrfc);
      expect(result).to.be.equal(false);
    });

    it("should return false when digit is in the first 3 chars", function(){
      const validrfc = 'A4X040510HY2';
      const result = ClientService.isValidRFC(validrfc);
      expect(result).to.be.equal(false);
    });


  })

});