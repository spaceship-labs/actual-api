describe('Category service', function(){
  it('should detect if is a web store code', async function(){
    const store = {code:'actual_studio'};
    expect(CategoryService.isAWebStoreCode(store.code)).to.equal(true);
  });

  it('should get all stores codes', async function(){
    const codes = await CategoryService.getAllStoresCodes();
    expect(codes).to.be.an('array');
    assert.isAbove(codes.length, 0);
  });
});