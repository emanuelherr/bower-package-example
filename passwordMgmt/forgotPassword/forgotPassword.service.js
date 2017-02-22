/**
  * Created by FMG on 27/04/2016.
  */
angular
  .module('ocf.services')
  .service('ForgotPasswordService', ForgotPasswordService);

ForgotPasswordService.$inject = [
  '$q',
  '$resource',
  'URLManager'
];

function ForgotPasswordService($q,
                               $resource,
                               URLManager) {
  var fps = this;

  fps.recoverPassword = recoverPassword;

  return fps;

  /**
   * Calls password_change resource with required parameters
   * @param username
   * @returns {*}
   */
  function recoverPassword(username) {
    var q = $q.defer();

    var user = {
      username: username
    };

    var passwordRecover = $resource(URLManager.getUrl('passwordRecover'), {}, {
      recover: {
        method: 'POST',
        headers: {
          // removing Zest* headers from the request as to avoid errors: { "status": 500, "message": "Bad Headers" }
          //'ZestAppName': undefined,
          'ZestSessionId': undefined
        }
      }
    });

    // Call to action
    passwordRecover.recover(user, q.resolve, q.reject);

    return q.promise;
  }


}
