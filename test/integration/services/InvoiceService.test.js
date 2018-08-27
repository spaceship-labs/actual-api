describe('InvoiceService migration', () => {
  describe('structuredItems', () => {
    it('should return the correct structured items', () => {
      const discount = 250;
      const detail = {
        id: 'id.1',
        quantity: 1,
        discount: -250,
        discountPercent: 25,
        unitPrice: 1000,
      };
      const product = {
        id: 'id.1',
        quantity: 1,
        discount: -250,
        discountPercent: 25,
        unitPrice: 1000,
      };

      const result = InvoiceService.structuredItems(discount, detail, product);
      expect(result.cantidad).to.be.equal(1);
      expect(result.Unidad).to.be.equal('Pieza');
      expect(result.valorUnitario).to.be.equal(862.0689655172414);
      expect(result.importe).to.be.equal(862.07);
      expect(result.descuento).to.be.equal(250);
      console.log('result', JSON.stringify(result));
    });
  });
});
