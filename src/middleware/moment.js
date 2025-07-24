const moment = require("moment-timezone");

module.exports = function (req, res, next) {
  moment.tz.setDefault("America/Argentina/Buenos_Aires");
  next();
};
