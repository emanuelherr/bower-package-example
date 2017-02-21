/**
 * Created by FMG on 27/04/2016.
 */
angular.module('ocf.changePassword', ['ui.router'])

  .config(function config($stateProvider) {
    $stateProvider
      .state('ocf.changePassword', {
        url: '/changePassword',
        views: {
          "ocf": {
            controller: 'ChangePasswordController',
            templateUrl: 'ocf/passwordMgmt/changePassword/changePassword.html'
          }
        }
      })
  });
