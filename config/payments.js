var mangopay = require("mangopay2-nodejs-sdk");
var env = process.env.NODE_ENV || "production";

if (env === "development") {
  module.exports = new mangopay({
    clientId: "",
    clientPassword: "",
    baseUrl: "https://api.sandbox.mangopay.com"
  });
} else if (env === "production") {
  module.exports = new mangopay({
    clientId: "",
    clientPassword: "",
    baseUrl: "https://api.mangopay.com"
  });
}
