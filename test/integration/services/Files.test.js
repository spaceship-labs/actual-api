describe('Files service', () => {
  describe('generateFileName', () => {
    it('should camel case a stream file name', () => {
      const stream = {
        filename: '1CO18805-01-sillon blanco para exterior caneline.jpg',
      };
      Files.generateFileName(stream, function(err, filename) {
        expect(filename).to.be.equal(
          '1CO18805_01_sillon_blanco_para_exterior_caneline.jpg'
        );
      });
    });
  });
});
