module.exports = {
  log: function(message, action, references) {
    sails.log(action + ': ' + message, references);
    return Logging.create({message: message, action: action, references: references});
  }
};
