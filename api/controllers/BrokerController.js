module.exports = {
  async list(req, res) {
    try {
      const { page = 0, limit = 0 } = req.allParams();
      const brokers = await BrokerSAP.find().paginate({ page, limit });
      res.ok(brokers);
    } catch (err) {
      res.negotiate(err);
    }
  }
};
