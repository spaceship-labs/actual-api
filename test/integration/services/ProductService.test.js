describe("ProductService", function(){
  describe("isSRService", function(){
    it("should return true when product is a Service", function(){
      const product = {Service: "Y"};
      expect(ProductService.isSRService(product))
        .to.be.equal(true);
    });
    it("should return true when product is NOT a Service", function(){
      const product = {Service: "N"};
      expect(ProductService.isSRService(product))
        .to.be.equal(false);
    });
  });

  describe("getProductSA", function(){
    it("should return sa code 002(home)", function(){
      const product = {U_Empresa: '002'};
      expect(ProductService.getProductSA(product))
        .to.be.equal('002');
    });
    it("should return sa code 001(studio)", function(){
      const product = {U_Empresa: '001'};
      expect(ProductService.getProductSA(product))
        .to.be.equal('001');
    });
    it("should return sa code 001(studio) when product U_EMPRESA is 003(ambas)", function(){
      const product = {U_Empresa: '003'};
      expect(ProductService.getProductSA(product))
        .to.be.equal('001');
    });
    it("should return sa code 004(kids)", function(){
      const product = {U_Empresa: '004'};
      expect(ProductService.getProductSA(product))
        .to.be.equal('004');
    });
  });
  
});