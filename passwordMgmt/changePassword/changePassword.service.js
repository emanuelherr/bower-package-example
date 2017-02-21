/**
 * Created by FMG on 27/04/2016.
 */
angular
  .module('ocf.services')
  .factory('ChangePasswordService', ChangePasswordService);

ChangePasswordService.$inject = [
  '$q',
  '$resource',
  '$rootScope',
  'EnvironmentConfig',
  'URLManager',
  'encode'
];

function ChangePasswordService($q,
                               $resource,
                               $rootScope,
                               EnvironmentConfig,
                               URLManager,
                               encode) {
  var cps = this;

  cps.info = {
    currentUser: $rootScope.user.username || '',
    organizationId: $rootScope.user.organizationId || 0
  };

  cps.getPasswordRules = getPasswordRules;
  cps.setNewPassword = setNewPassword;

  return cps;

  /**
   * Retrieves password rules for current organization
   */
  function getPasswordRules() {
    var q = $q.defer();
    var passwordChange = $resource(URLManager.getUrl('passwordChange'), {}, {
      passwordChangeRules: {
        method: 'GET',
        timeout: EnvironmentConfig.requestTimeout
      }
    });

    // Call to action
    passwordChange.passwordChangeRules({organizationId: cps.info.organizationId}, q.resolve, passRulesFail);

    function passRulesFail(passwordRulesFail) {
      var failMessage = {
        status: passwordRulesFail.status,
        message: passwordRulesFail.message,
        type: 'passwordRules'
      };

      if (passwordRulesFail.status !== 0) {
        // net::ERR_CONNECTION_TIMED_OUT
        failMessage.message = "No internet connection.";
      }

      q.reject(failMessage);
    }

    return q.promise;

  }

  /**
   * Calls password_change resource with required parameters
   * @param currentPassword
   * @param newPassword
   * @returns {*}
   */
  function setNewPassword(currentPassword, newPassword) {
    var q = $q.defer();

    var encodedCredentials = encode.encodeCredentials({username: cps.info.currentUser, password: currentPassword});
    var userPassword = {
      username: cps.info.currentUser,
      password: newPassword
    };

    var passwordChange = $resource(URLManager.getUrl('passwordChange'), {}, {
      setPassword: {
        method: 'POST',
        headers: {
          'Authorization': "Basic " + encodedCredentials, // Credentials based on password entered by the user
          // removing Zest* headers from the request as to avoid errors: { "status": 500, "message": "Bad Headers" }
          //'ZestAppName': undefined,
          'ZestSessionId': undefined
        }
      }
    });

    // Call to action
    passwordChange.setPassword(userPassword, q.resolve, q.reject);

    return q.promise;
  }
}
