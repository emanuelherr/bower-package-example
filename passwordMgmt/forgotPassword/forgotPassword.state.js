/**
  * Created by FMG on 27/04/2016.
  */
angular.module('ocf.forgotPassword', ['ui.router'])

  .config(function config($stateProvider) {
    $stateProvider.state('ocf.forgotPassword', {
      url: '/forgotPassword',
      views: {
        "ocf": {
          controller: 'ForgotPasswordController',
          templateUrl: 'ocf/passwordMgmt/forgotPassword/forgotPassword.html'
        }
      }
    })
  });
