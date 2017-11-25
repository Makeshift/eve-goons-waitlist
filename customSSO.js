module.exports = function(refresh, setup, request, url){
    var module = {};
    //Some custom ESI stuff because our swagger library oddly doesn't support the verify endpoint - Probably beacuse it's technically part of SSO and not ESI
    module.verifyReturnCharacterDetails = function(refreshToken, callback) {
        refresh.requestNewAccessToken('provider', refreshToken, function(err, AccessToken, newRefreshToken) {
            // Build URL for verify request:
            var urlObj = {
                protocol: 'https',
                host: setup.oauth.baseSSOUrl,
                pathname: '/oauth/verify',
            }
            var ssoVerifyUrl = url.format(urlObj);
            // Build the auth header from recently acquired token:
            var verifyAuthHeaderString = "Bearer " + AccessToken;
            // Set up options for the get request:
            var getOptions = {
                url: ssoVerifyUrl,
                headers: {
                    "Authorization": verifyAuthHeaderString,
                    "User-Agent": setup.oauth.userAgent,
                }
            }
            // Send response:
            request.get(getOptions, function(err, response, body) {
                if (!err && response.statusCode == 200) {
                    var bodyObj = JSON.parse(body);
                    callback(true, response, bodyObj)
                } else {
                    callback(false, bodyObj);
                }
            });
        });
    }

    return module;
}