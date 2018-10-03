describe('EwalletService', () => {
  describe('validateExpirationDate', () => {
    it('should vertufy if expirationDate is equal to the current date and restart ewallets amounts', async () => {
      const result = await EwalletService.validateExpirationDate();
      console.log(result);
    });
  });
});
