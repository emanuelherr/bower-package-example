/**
* Created by PC-055 on 03/05/2016.
*/
angular
  .module('ocf.changePassword.success')
  .controller('ChangePasswordSuccessController', ChangePasswordSuccessController);

ChangePasswordSuccessController.$inject =
  [
    '$scope',
    '$state',
    '$log',
    'navigateTo',
    '$window',
    '$timeout',
    'toaster',
    '$ionicViewSwitcher',
    '$ionicSideMenuDelegate',
    '$ionicPlatform',
    'ChangePasswordService'
  ];

//noinspection JSUnusedLocalSymbols
function ChangePasswordSuccessController($scope,
                                  $state,
                                  $log,
                                  navigateTo,
                                  $window,
                                  $timeout,
                                  toaster,
                                  $ionicViewSwitcher,
                                  $ionicSideMenuDelegate,
                                  $ionicPlatform,
                                  ChangePasswordService) {
  var deregisterGoToPreviousState;

  //$scope.pm = {
  //  passwordRules: {
  //    "minDigit": 1,
  //    "minLength": 8,
  //    "minLowercase": 1,
  //    "minSpecial": 1,
  //    "minUppercase": 1
  //  },
  //  meter: {
  //    value: 0,
  //    max: 4,
  //    description: ["", "Weak", "Moderate", "Moderate", "Strong"]
  //  },
  //  showNewPassword: false,
  //  showConfirmPassword: false,
  //  newError: false,
  //  confirmError: false,
  //  current: '',
  //  new: '',
  //  newConfirm: ''
  //};

  //$scope.changePassword = changePassword;
  $scope.goToPreviousState = goToPreviousState;
  //$scope.togglePasswordVisibility = togglePasswordVisibility;

  ///////////////
  /// Scope Events
  $scope.$on('$ionicView.beforeEnter', function () {
    ChangePasswordService.getPasswordRules()
      .then(function (rules) {
        $scope.pm.passwordRules = rules;
      })
      .catch(function (fail) {
        $log.error(fail.status, fail.message, fail.type);
      });

    $ionicSideMenuDelegate.canDragContent(true);
    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);
  });

  //noinspection JSUnusedAssignment
  $scope.$on('$destroy', deregisterGoToPreviousState);

  //$scope.$watch('pm.new', function (password) {
  //  // updates the password strength meter value based on dropbox's library
  //  $scope.pm.meter.value = zxcvbn(password).score;
  //});

  ///////////////
  /**
   * Request to change password
   */
  function changePassword() {
    ChangePasswordService.setNewPassword($scope.pm.current, $scope.pm.new)
      .then(function (s) {
        $log.debug(s);
      })
      .catch(function (f) {
        // Show errors
        $log.debug(f);
      });
  }


  /**
   * Handles the goBack action triggered by menu or HW Back Button
   */
  function goToPreviousState() {
    $ionicViewSwitcher.nextDirection('back');

    if ($scope.cameFromStateName) {
      $state.go($scope.cameFromStateName);

    } else {
      navigateTo.home();

    }
  }

  /**
   * Toggles password visibility
   * @param password
   */
  function togglePasswordVisibility(password) {
    if ('new' == password) {
      $scope.pm.showNewPassword = !$scope.pm.showNewPassword;

    } else if ('confirm' == password) {
      $scope.pm.showConfirmPassword = !$scope.pm.showConfirmPassword;

    }
  }
}
