module.exports = {
  async list(req, res) {
    try {
      const { page = 1, limit = 10 } = req.allParams();
      const brokers = await BrokerSAP.find().paginate({ page, limit });
      res.ok(brokers);
    } catch (err) {
      res.negotiate(err);
    }
  }
};
