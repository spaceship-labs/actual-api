describe('AuthController', () => {
  let email = null;
  let password = null;

  before(async () => {
    await User.destroy();
    email = 'user1@email.com';
    password = 'user.name.1';
    user = await CreateService.user({
      password,
      email,
      firstName: 'user.firstName.1',
      lasteName: 'user.lastName.1',
    });
  });

  describe('homeStatus', () => {
    it('should return a valid response', async () => {
      const url = '/';
      const { status } = await app.get(url);
      expect(status).to.equal(200);
    });
  });

  describe('login process', () => {
    it('should return a token after a valid login', async () => {
      var url = '/auth/signin';
      const { body } = await app.post(url).send({
        email,
        password,
      });
      expect(body).to.have.property('token');
    });
  });
});
