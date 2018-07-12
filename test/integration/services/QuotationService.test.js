describe("QuotationService", function(){
  
  describe("getGroupByQuotationPayments", function(){
    it("should get the latest added payment group", function(){
      const payments = [
        {type:'cash', group: 1},        
        {type:'debit-card', group: 1},
        {type:'3-msi', group: 2}
      ];
      expect(QuotationService.getGroupByQuotationPayments(payments)).to.be.equal(2);
    });

    it("should get the latest added payment group, ignoring the canceled ones", function(){
      const payments = [
        {type:'cash', group: 1},        
        {type:'debit-card', group: 1},
        {type: 'cash', group: 1, status: 'canceled'},
        {type:'9-msi', group: 3},
        {type: 'cash', group: 1, status: 'canceled'},        
      ];
      expect(QuotationService.getGroupByQuotationPayments(payments)).to.be.equal(3);
    });

    it("should get group 1 as default if there are no payments", function(){
      expect(QuotationService.getGroupByQuotationPayments()).to.be.equal(1);
    });

  });

  describe("Calculator", function(){
    
    describe("calculateFinancingPercentage", function(){
      it("should return the financing cost percentage", function(){
        const calculator = QuotationService.Calculator();
        const totalPg1 = 400;
        const total = 900;
        expect(calculator.calculateFinancingCostPercentage(totalPg1, total)).to.be.equal(1.25);
      });
    });

    describe("calculateAfterDiscount", function(){
      it("should get the correct amount after applying a discount percentage", function(){
        const calculator = QuotationService.Calculator();
        const amount = 900;
        const discountPercentage = 50;
        expect(calculator.calculateAfterDiscount(amount, discountPercentage))
          .to.be.equal(450);
      });
    });

    describe("sumProcessedDetails", function(){
      it("should return the correct totals form processed details, adds immediateDelivery flag when every detail has that flag", function(){
        const details = [
          {
            id: "detail.id1",
            total: 4200,
            totalPg1: 4200,
            subtotal: 6000,
            subtotal2: 4200,
            discount: 1800,
            unitPrice: 6000,
            unitPriceWithDiscount: 4200,
            discountPercent: 30,
            immediateDelivery:true,
            quantity: 1
          },
          {
            id: "detail.id2",
            total: 6400,
            totalPg1: 6400,
            subtotal: 8000,
            subtotal2: 6400,
            discount: 1600,
            unitPrice: 2000,
            unitPriceWithDiscount: 1600,
            discountPercent: 20,            
            immediateDelivery:true,
            quantity: 4
          },
          {
            id: "detail.id3",
            total: 2040,
            totalPg1: 2040,
            subtotal: 2400,
            subtotal2: 2040,
            discount: 360,
            unitPrice: 1200,
            unitPriceWithDiscount: 1020,
            discountPercent: 15,            
            immediateDelivery:true,
            quantity: 2
          }          
        ];
        const options = {paymentGroup: 1};
        const calculator = QuotationService.Calculator();
        
        const expected = {
          total: 12640,
          subtotal: 16400,
          totalPg1: 12640,
          subtotal2: 12640,
          discount: 3760,
          immediateDelivery: true,
          totalProducts: 7,
          paymentGroup: 1,
          financingCostPercentage: 0,
          appliesClientDiscount: false
        };
        expect(calculator.sumProcessedDetails(details, options))
          .to.deep.equal(expected);
      });
    });

    describe("getQuotationPackagesIds", function(){
      it("should return an array of packages ids used in quotation details", function(){
        const calculator = QuotationService.Calculator();
        const details = [
          {Product: "product.id.1", PromotionPackage: "package.id1"},
          {Product: "product.id.2"},          
          {Product: "product.id.3", PromotionPackage: "package.id3"},          
        ];
        expect(calculator.getQuotationDetailsPackagesIds(details))
          .to.deep.equal(["package.id1", "package.id3"]);
      });

      it("should return an empty array of packages ids used in quotation details", function(){
        const calculator = QuotationService.Calculator();
        const details = [
          {Product: "product.id.1"},
          {Product: "product.id.2"},          
          {Product: "product.id.3"},          
        ];
        expect(calculator.getQuotationDetailsPackagesIds(details))
          .to.deep.equal([])
      });

    });

    describe("isValidPromotionPackage", function(){
      it("should return true when package is valid", function(){
        const calculator = QuotationService.Calculator();
        const package = {
          id: "package.id1",
          PackageRules: [
            {id:"rule.id1", Product:"product.id1", quantity: 2},
            {id:"rule.id2", Product:"product.id2", quantity: 4},            
          ],
        };
        const details = [
          {id:"detail.id1", Product:"product.id1", quantity: 2},
          {id:"detail.id2", Product:"product.id2", quantity: 4},            
        ];

        calculator.setLoadedStorePackages([package]);
        const result = calculator.isValidPromotionPackage(package, details);
        expect(result).to.be.equal(true);
      });

      it("should return false when package is not valid", function(){
        const calculator = QuotationService.Calculator();
        const package = {
          id: "package.id1",
          PackageRules: [
            {id:"rule.id1", Product:"product.id1", quantity: 2},
            {id:"rule.id2", Product:"product.id2", quantity: 4},            
          ],
        };
        const details = [
          {id:"detail.id1", Product:"product.id1", quantity: 2},
          {id:"detail.id2", Product:"product.id2", quantity: 4},            
        ];

        calculator.setLoadedStorePackages([]);
        const result = calculator.isValidPromotionPackage(package, details);
        expect(result).to.be.equal(false);
      });

    });

    describe("getAllPackagesRules", function(){
      it("should return all packages rules, from valid packages", function(){
        const packages = [
          {
            id: "package.id1",
            PackageRules: [
              {id:"rule.id1", Product:"product.id1", quantity: 2},
              {id:"rule.id2", Product:"product.id2", quantity: 4},            
            ],
          },
          {
            id: "package.id2",
            PackageRules: [
              {id:"rule.id3", Product:"product.id3", quantity: 1},
              {id:"rule.id4", Product:"product.id4", quantity: 6},            
            ],
          },
          {
            id: "package.id3",
            PackageRules: [
              {id:"rule.id5", Product:"product.id5", quantity: 2},
              {id:"rule.id6", Product:"product.id6", quantity: 3},            
            ],
          }                    
        ];  
        const details = [
          {id:"detail.id1", Product:"product.id3", quantity: 1},
          {id:"detail.id2", Product:"product.id4", quantity: 6},            
          {id:"detail.id4", Product:"product.id5", quantity: 2},
          {id:"detail.id5", Product:"product.id6", quantity: 3}          
        ];
        const calculator = QuotationService.Calculator();
        calculator.setLoadedStorePackages(packages);
        const result = calculator.getAllPackagesRules(packages, details);
        const expected = [
          {id:"rule.id3", Product:"product.id3", quantity: 1},
          {id:"rule.id4", Product:"product.id4", quantity: 6}, 
          {id:"rule.id5", Product:"product.id5", quantity: 2},
          {id:"rule.id6", Product:"product.id6", quantity: 3},                                   
        ];
        expect(result).to.deep.equal(expected);
      });
    });

    describe("filterPromotionPackages", function(){
      it("should filter and return only valid promotion packages", function(){
        const packages = [
          {
            id: "package.id1",
            PackageRules: [
              {id:"rule.id1", Product:"product.id1", quantity: 2},
              {id:"rule.id2", Product:"product.id2", quantity: 4},            
            ],
          },
          {
            id: "package.id2",
            PackageRules: [
              {id:"rule.id3", Product:"product.id3", quantity: 1},
              {id:"rule.id4", Product:"product.id4", quantity: 6},            
            ],
          },
          {
            id: "package.id3",
            PackageRules: [
              {id:"rule.id5", Product:"product.id5", quantity: 2},
              {id:"rule.id6", Product:"product.id6", quantity: 3},            
            ],
          }                    
        ];  
        const details = [
          {id:"detail.id1", Product:"product.id3", quantity: 1},
          {id:"detail.id2", Product:"product.id4", quantity: 6},            
        ];
        const calculator = QuotationService.Calculator();
        calculator.setLoadedStorePackages(packages);
        const result = calculator.filterPromotionPackages(packages, details);
        expect(result.length).to.be.equal(1);
        expect(result[0].id).to.be.equal(packages[1].id);              
      });

    });

    describe("isAStorePackage", function(){
      it("should return true when the package is in loaded store packages of calculator", function(){
        const packages = [
          {id:"package.id1"},
          {id:"package.id2"}          
        ];

        const calculator = QuotationService.Calculator();
        calculator.setLoadedStorePackages(packages);
        expect(calculator.isAStorePackage(packages[0].id))
          .to.be.equal(true);
      });

      it("should return false the package isnt in loaded store packages of calculator", function(){
        const packages = [
          {id:"package.id1"},
          {id:"package.id2"}          
        ];

        const calculator = QuotationService.Calculator();
        calculator.setLoadedStorePackages(packages);
        expect(calculator.isAStorePackage("random.package.id"))
          .to.be.equal(false);
      });

      it("should return false when there are no loaded store packages", function(){
        const calculator = QuotationService.Calculator();
        expect(calculator.isAStorePackage("random.package.id"))
          .to.be.equal(false);
      });

    });

    describe("validatePackageRules", function(){
      it("should return truen when all package rules are valid", function(){
        const calculator = QuotationService.Calculator();        
        const packagesRules = [
          {id: "rule.id.1", Product: "product.id.1", quantity: 2},
          {id: "rule.id.2", Product: "product.id.2", quantity: 4},
        ];
        const details = [
          {id: "detail.id1", Product: "product.id.1", quantity: 2},
          {id: "detail.id2", Product: "product.id.2", quantity: 4}
        ];

        expect(calculator.validatePackageRules(packagesRules, details))
          .to.be.equal(true);
      });

      it("should return false when all package rules are not valid, there is a detail match, but it's already set with validated to true", function(){
        const calculator = QuotationService.Calculator();        
        const packagesRules = [
          {id: "rule.id.1", Product: "product.id.1", quantity: 2},
          {id: "rule.id.2", Product: "product.id.2", quantity: 4},
        ];
        const details = [
          {id: "detail.id1", Product: "product.id.1", quantity: 2},
          {id: "detail.id2", Product: "product.id.2", quantity: 4, validated: true}
        ];

        expect(calculator.validatePackageRules(packagesRules, details))
          .to.be.equal(false);
      });

    });

    describe("getDiscountKey", function(){
      it("should return a correct discount key for group 3", function(){
        const calculator = QuotationService.Calculator();
        const group = 3;
        const expected = QuotationService.DISCOUNT_KEYS[2];
        expect(calculator.getDiscountKeyByGroup(group)).to.be.equal(expected);
      });
    });

    describe("getDetailPackageRule", function(){
      it("should return false when there arent packages rules loaded", function(){
        const calculator = QuotationService.Calculator();
        const productId = "product.id.1";
        const quantity = 2;
        const result = calculator.getDetailPackageRule(productId, quantity);
        expect(result).to.be.equal(false);
      });

      it("should return true when there is a package rule that matches the product id and quantity, also set the validated flag on the rule to true", function(){
        const calculator = QuotationService.Calculator();
        const productId = "product.id.1";
        const quantity = 4;
        const packagesRules = [
          {Product: "product.id.2", quantity: 2, validated: false},
          {Product: "product.id.1", quantity: 4, validated: false}
        ];
        calculator.setLoadedPackagesRules(packagesRules);
        const result = calculator.getDetailPackageRule(productId, quantity);
        expect(result.Product).to.be.equal(packagesRules[1].Product);
        expect(result.quantity).to.be.equal(packagesRules[1].quantity);
        expect(result.validated).to.be.equal(true);
      });

      it("should return flase when there is a package rule that matches the product id and quantity, but the rule match was already used", function(){
        const calculator = QuotationService.Calculator();
        const productId = "product.id.1";
        const quantity = 4;
        const packagesRules = [
          {Product: "product.id.2", quantity: 2, validated: false},
          {Product: "product.id.1", quantity: 4, validated: true}
        ];
        calculator.setLoadedPackagesRules(packagesRules);
        const result = calculator.getDetailPackageRule(productId, quantity);
        expect(result).to.be.equal(false);
      });

    });

    describe("getPromotionOrPackageName", function(){
      it("should get the promotion name when promotion is in the promotions loaded", function(){
        const promotion = {
          id: "promotion.id.1",
          publicName: "Promotion.Name"
        };
        const calculator = QuotationService.Calculator();
        calculator.setLoadedActivePromotions([promotion]);

        expect(calculator.getPromotionOrPackageName(promotion)).to.be.equal("Promotion.Name");
      });

      it("should return null when promotion is not in the promotions loaded", function(){
        const promotion = {
          id: "promotion.id.1",
          publicName: "Promotion.Name"
        };
        const calculator = QuotationService.Calculator();
        expect(calculator.getPromotionOrPackageName(promotion)).to.be.equal(null);
      });

      it("should get the package name when package rule parent is in the packages loaded", function(){
        const packageRule = {
          id: "rule.id.1",
          quantity: 2,
          Product: "product.id.1",
          PromotionPackage: "promotion.package.id1"
        };
        const package = {
          id: "promotion.package.id1",
          Name: "Package.Name"
        };
        const calculator = QuotationService.Calculator();
        calculator.setLoadedStorePackages([package]);

        expect(calculator.getPromotionOrPackageName(packageRule)).to.be.equal("Package.Name");
      });

      it("should return null when package rule parent is not in the packages loaded", function(){
        const packageRule = {
          id: "rule.id.1",
          quantity: 2,
          Product: "product.id.1",
          PromotionPackage: "promotion.package.id1"
        };
        const calculator = QuotationService.Calculator();
        expect(calculator.getPromotionOrPackageName(packageRule)).to.be.equal(null);
      });

    });

    describe("isValidPackageRule", function(){
      it("should return true when validating a package rule, based on quotation details", function(){
        const calculator = QuotationService.Calculator();
        var details = [
          {id:"detail.id1", Product: "product.id1", quantity: 2, validated: false},
          {id:"detail.id2", Product: "product.id2", quantity: 1, validated: false},
          {id:"detail.id3", Product: "product.id3", quantity: 4, validated: false},          
        ];
        const rule = {
          Product: "product.id1",
          quantity: 2
        };
        const result = calculator.isValidPackageRule(rule, details);
        expect(result).to.be.equal(true);
      });

      it("should return false when validating a package rule, based on quotation details that dont match", function(){
        const calculator = QuotationService.Calculator();
        var details = [
          {id:"detail.id1", Product: "product.id1", quantity: 2, validated: false},
          {id:"detail.id2", Product: "product.id2", quantity: 1, validated: false},
          {id:"detail.id3", Product: "product.id3", quantity: 4, validated: false},          
        ];
        const rule = {
          Product: "product.id4",
          quantity: 2
        };
        const result = calculator.isValidPackageRule(rule, details);
        expect(result).to.be.equal(false);
      });

      it("should return false when validating a package rule, based on quotation details when the matching detail has been previously validated", function(){
        const calculator = QuotationService.Calculator();
        var details = [
          {id:"detail.id1", Product: "product.id1", quantity: 2, validated: false},
          //NOTE that this second detail has been already validated
          {id:"detail.id2", Product: "product.id2", quantity: 1, validated: true},
          {id:"detail.id3", Product: "product.id3", quantity: 4, validated: false},          
        ];
        const rule = {
          Product: "product.id2",
          quantity: 1
        };
        const result = calculator.isValidPackageRule(rule, details);
        expect(result).to.be.equal(false);
      });

    });

  });
});