describe('AuthController', () => {
  let token = null;
  let email = null;
  let password = null;
  let user = null;

  before(async () => {
    await User.destroy();
    user = await CreateService.user({
      password: 'user.name.1',
      email: 'user1@email.com',
      firstName: 'user.firstName.1',
      lasteName: 'user.lastName.1',
    });
  });

  describe('homeStatus', () => {
    it('should return a valid response', async () => {
      console.log(user);
      const url = '/';
      const { status } = await app.get(url);
      expect(status).to.equal(200);
    });
  });

  // describe('login process', function() {
  //   it('should return a token after a valid login', async function() {
  //     var url = '/auth/signin';
  //     try {
  //       const { body } = await app
  //         .post(url)
  //         .send({
  //           email,
  //           password,
  //         })
  //         .set('accept', 'json');
  //       expect(body).to.have.property('token');
  //     } catch (e) {
  //       console.log('e', e);
  //     }
  //   });
  // });
});
