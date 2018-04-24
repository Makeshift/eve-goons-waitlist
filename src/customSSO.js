const log = require('./logger');

const logger = log(module);

module.exports = function customSSO(refresh, setup, request, url) {
  const module = {};
  // Some custom ESI stuff because our swagger library oddly doesn't support the verify endpoint - Probably beacuse it's
  // technically part of SSO and not ESI
  module.verifyReturnCharacterDetails = function verifyReturnCharacterDetails(refreshToken, callback) {
    refresh.requestNewAccessToken('provider', refreshToken, (err, AccessToken, newRefreshToken) => {
      logger.debug(newRefreshToken);
      // Build URL for verify request:
      const urlObj = {
        protocol: 'https',
        host: setup.oauth.baseSSOUrl,
        pathname: '/oauth/verify',
      };
      const ssoVerifyUrl = url.format(urlObj);
      // Build the auth header from recently acquired token:
      const verifyAuthHeaderString = `Bearer ${AccessToken}`;
      // Set up options for the get request:
      const getOptions = {
        url: ssoVerifyUrl,
        headers: {
          Authorization: verifyAuthHeaderString,
          'User-Agent': setup.oauth.userAgent,
        }
      };
      // Send response:
      request.get(getOptions, (err, response, body) => {
        if (!err && response.statusCode === 200) {
          const bodyObj = JSON.parse(body);
          callback(true, response, bodyObj);
        } else {
          callback(false);
        }
      });
    });
  };

  return module;
};
