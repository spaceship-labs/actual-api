module.exports = {
  async list(req, res) {
    try {
      const { page = 1, limit = 1000 } = req.allParams();
      const brokers = await BrokerSAP.find().paginate({ page, limit });
      res.ok(brokers);
    } catch (err) {
      res.negotiate(err);
    }
  }
};
