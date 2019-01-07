describe('AlertController', () => {
  let token = null;
  let alerts = null;

  before(async () => {
    token = await CreateService.token();
    alerts = [
      await Alert.create({
        notificationType: 1,
        folio: 'alert.folio.1',
        link: 'alert.link.1',
        notificationID: 'alert.notificationID.1',
      }),
      await Alert.create({
        notificationType: 2,
        folio: 'alert.folio.2',
        link: 'alert.link.2',
        notificationID: 'alert.notificationID.2',
      }),
    ];
  });

  describe('index', () => {
    it('should find alerts', async () => {
      const url = '/alert';
      const { body, status } = await app.get(url).set('Authorization', token);
      expect(status).to.equal(200);
      expect(body.length).to.equal(2);
    });
  });
});
