/**
 * 200 (OK) Response
 *
 * Usage:
 * return res.ok();
 * return res.ok(data);
 * return res.ok(data, 'auth/login');
 *
 * @param  {Object} data
 * @param  {String|Object} options
 *          - pass string to render specified view
 */

module.exports = function ok(data) {
  const req = this.req;
  const res = this.res;
  const sails = req._sails;
  sails.log.silly('res.ok() :: Sending 200 ("OK") response');
  res.status(200);
  res.jsonx(data);
};
