describe('AuthController', () => {
  describe('homeStatus', () => {
    it('should return a valid response', async () => {
      const url = '/';
      const { status } = await app.get(url);
      console.log(branch);
      expect(status).to.equal(200);
    });
  });
});
// 	describe('login process', function(){
// 		it('should return a token after a valid login', async function(){
// 			var url = '/auth/signin';
// 			try{
// 				const {body} = await app.post(url)
// 					.send({
// 						email: process.env.SAMPLE_ADMIN_USER_EMAIL,
// 						password: process.env.SAMPLE_ADMIN_USER_PASSWORD,
// 					})
// 					.set('accept', 'json');
// 				expect(body).to.have.property("token");
// 			}catch(e){
// 				console.log('e', e);
// 			}
// 		});
// 	});
