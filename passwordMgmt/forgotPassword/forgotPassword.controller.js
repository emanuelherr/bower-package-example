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
    label: '',
    hasError: false,
    genericError: '',
    successPasswordRecover: false
  };

  $scope.goToPreviousState = goToPreviousState;
  $scope.resetPassword = resetPassword;
  $scope.removeErrors = removeErrors;

  ///////////////
  /// Scope Events
  $scope.$on('$ionicView.beforeEnter', function () {


    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);

    if ($scope.heightScreen < 480) {
      document.getElementById("changePasswordInput").addEventListener('touchend', function () {
        $("#changePasswordInput").attr('readonly', 'readonly'); // Force keyboard to hide on input field.
        $("#changePasswordInput").attr('disabled', 'true');

        setTimeout(function () {
          $("#changePasswordInput").blur();  //actually close the keyboard
          // Remove readonly attribute after keyboard is hidden.
          $("#changePasswordInput").removeAttr('readonly');
          $("#changePasswordInput").removeAttr('disabled');
        }, 100);
      });
    }
    $translate('OCF.PASSWORD.FORGOT.USERNAME_PLACEHOLDER').then(function (placeholder) {
      defaultPasswordManagement.label = placeholder;
      // pm for PasswordManagement, shortened for readability
      $scope.pm = angular.copy(defaultPasswordManagement);
    });
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
      LoadingService.show("Processing username...");
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
      $scope.pm.genericError = "Server Error.";
    }

    if (fail.status == 0) {
      $scope.pm.genericError = "No connection available.";
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
