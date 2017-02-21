/**
 * Created by FMG on 27/04/2016.
 */
angular
  .module('ocf.forgotPassword')
  .controller('ForgotPasswordController', ForgotPasswordController);

ForgotPasswordController.$inject =
  [
    '$scope',
    'navigateTo',
    '$ionicPlatform',
    'ForgotPasswordService',
    'LoadingService',
    '$translate'
  ];

function ForgotPasswordController($scope,
                                  navigateTo,
                                  $ionicPlatform,
                                  ForgotPasswordService,
                                  LoadingService,
                                  $translate) {
  var deregisterGoToPreviousState;
  var defaultPasswordManagement = {
    username: '',
    label: 'Username',
    hasError: false,
    genericError: '',
    successPasswordRecover: false
  };

  var errorServerError;
  var errorNoConnection;
  var processing;

  $scope.goToPreviousState = goToPreviousState;
  $scope.resetPassword = resetPassword;
  $scope.removeErrors = removeErrors;

  ///////////////
  /// Scope Events
  $scope.$on('$ionicView.beforeEnter', function () {
    // pm for PasswordManagement, shortened for readability

    /**
     * Placeholders
     */
    $translate('OCF.PASSWORD.FORGOT.USERNAME_PLACEHOLDER')
      .then(function (usernamePlaceholder) {
        defaultPasswordManagement.label = usernamePlaceholder;
        $scope.pm = angular.copy(defaultPasswordManagement);
      });

    /**
     * Loading service
     */
    $translate('OCF.PASSWORD.FORGOT.PROCESSING').then(function (loading) {
        processing = loading;
      });

    /**
     * Error Messages
     */
    $translate([
      'OCF.PASSWORD.FORGOT.ERRORS.SERVER_ERROR',
      'OCF.PASSWORD.FORGOT.ERRORS.NO_CONNECTION'
    ]).then(function (errors) {
        errorServerError = errors['OCF.PASSWORD.FORGOT.ERRORS.SERVER_ERROR'];
        errorNoConnection = errors['OCF.PASSWORD.FORGOT.ERRORS.NO_CONNECTION'];
      });

    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);
  });

  //noinspection JSUnusedAssignment
  $scope.$on('$destroy', deregisterGoToPreviousState);


  ///////////////
  /**
   * Handles the goBack action triggered by menu or HW Back Button
   */
  function goToPreviousState(e) {
    if (!!e) {
      e.preventDefault();
    }

    navigateTo.login();

  }

  /**
   * Sends the request for a password reset
   */
  function resetPassword() {
    if ($scope.pm.username) {
      LoadingService.show(processing);

      ForgotPasswordService.recoverPassword($scope.pm.username)
        .then(function () {
          $scope.pm.successPasswordRecover = true;
        })
        .catch(handleErrors)
        .finally(resetFormStates);
    }
  }

  /**
   * Error processing function to display messages accordingly.
   *
   * Expected errors:
   *  412 - Password rules failed.
   *  500 - Internal Server error (error returned when user:password basic auth isn't correct)
   *    0 - No internet connection
   *
   *  @param fail
   */
  function handleErrors(fail) {
    if (fail.status == 412) {
      // TODO: due to the type of successful message, to inform of an invalid user is not necessary. Success screen will be displayed instead.
      //$scope.pm.label = fail.data.message;
      //$scope.pm.hasError = true;
      $scope.pm.successPasswordRecover = true;
    }

    if (fail.status == 500) {
      $scope.pm.genericError = errorServerError;
    }

    if (fail.status == 0) {
      $scope.pm.genericError = errorNoConnection;
    }
  }


  /**
   * Resets error state
   */
  function removeErrors() {
    $scope.pm.hasError = defaultPasswordManagement.hasError;
    $scope.pm.label = defaultPasswordManagement.label;
  }


  /**
   * Resets passwords and sets to hidden the passwords
   */
  function resetFormStates() {
    $scope.pm.username = defaultPasswordManagement.username;
    LoadingService.hide();
  }
}
