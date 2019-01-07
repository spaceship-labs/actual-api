describe('AlertController', () => {
  let token = null;
  let alerts = null;

  before(async () => {
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
});
