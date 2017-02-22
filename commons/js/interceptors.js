/**
 * Created by PC040 on 03/05/2016.
 */

angular.module('ocf.interceptors', [])

.factory('httpRequestInterceptor', function ($q, $rootScope) {
  return {
    'responseError': function(rejection) {
      // do something on error
      if(rejection && rejection.data && rejection.data.message == 'Session Expired') {
        $rootScope.$broadcast('logout', true);
        rejection = 'Session Expired';
      }

      return $q.reject(rejection);
    }
  };
});
