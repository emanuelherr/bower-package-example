/**
 * Created by PC040 on 03/05/2016.
 */

angular.module('ocf.interceptors', [])

  .factory('httpRequestInterceptor', function ($q, $rootScope) {
    return {
      'responseError': function (rejection) {
        if (rejection && rejection.data) {
          if (rejection.data.message == 'Session Expired') { // Session expired
            $rootScope.$emit('logout', true);
            rejection = 'Session Expired';

          } else { // An error returned by the server
            $rootScope.noInternet = 0; // It means there's internet connection anyway
          }
        } else if (rejection.status === 0) {
          $rootScope.noInternet++;
        }

        return $q.reject(rejection);
      },

      'response': function (response) {
        var localHostResponse = new RegExp(/127\.0\.0\.1|localhost/);
        var src = response.config.url;

          if (response.config && src && src.indexOf("http") != -1 && src.match(localHostResponse) === null) {
          $rootScope.noInternet = 0; // There's internet connection
        }

        return response;
      }
    };
  });
