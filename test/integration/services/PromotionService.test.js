describe("PromotionService", function(){
  describe("getPromotionWithHighestDiscount", function(){
    it("should get the promotion with the highest discount", function(){
      const promotions = [
        {name: 'promotion.1', sa: '001', discountPg1: 25},
        {name: 'promotion.2', sa: '002', discountPg1: 30},
        {name: 'promotion.3', sa: '001', discountPg1: 15},          
      ];
      const result = PromotionService.getPromotionWithHighestDiscount(promotions);
      expect(result.name).to.be.equal('promotion.2');
    });

    it("should get the promotion with the highest discount, if it has 2 or more with the same discount, returns the last evaluated", function(){
      const promotions = [
        {name: 'promotion.1', sa: '001', discountPg1: 30},
        {name: 'promotion.2', sa: '002', discountPg1: 30},
        {name: 'promotion.3', sa: '001', discountPg1: 15},          
      ];
      const result = PromotionService.getPromotionWithHighestDiscount(promotions);
      expect(result.name).to.be.equal('promotion.2');
    });
    
  });
  /*
  describe("getProductActivePromotions", function(){
    const activePromotions = [
      {name: 'promotion.1', sa: '001', discountPg1: 25},
      {name: 'promotion.2', sa: '002', discountPg1: 20},
      {name: 'promotion.3', sa: '001', discountPg1: 15},
    ];
    const product = {ItemCode: '333111', U_Empresa: '001'};
    const quotationId = "quotation.id";
  });
  */

});