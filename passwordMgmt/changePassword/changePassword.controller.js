/**
 * Created by FMG on 27/04/2016.
 */
angular
  .module('ocf.changePassword')
  .controller('ChangePasswordController', ChangePasswordController);

ChangePasswordController.$inject =
  [
    '$scope',
    '$state',
    '$log',
    'navigateTo',
    'lodash',
    '$ionicViewSwitcher',
    '$ionicPlatform',
    '$translate',
    'ChangePasswordService',
    'LoadingService',
    '$window'
  ];

function ChangePasswordController($scope,
                                  $state,
                                  $log,
                                  navigateTo,
                                  lodash,
                                  $ionicViewSwitcher,
                                  $ionicPlatform,
                                  $translate,
                                  ChangePasswordService,
                                  LoadingService,
                                  $window) {
  var deregisterGoToPreviousState;
  var deregisterPasswordStrengthMeter;

  var processing;
  var legendMust;
  var legendMustNot;
  var legendUsed;
  var dynamicMinDigit;
  var dynamicMinUppercase;
  var dynamicMinLowercase;
  var dynamicMinSpecial;
  var dynamicBeAtLeastMultiple;
  var dynamicContainAtLeast;
  var dynamicAnd;
  var errorInvalidPass;
  var errorIncorrectPass;
  var errorNoMatchPass;
  var errorNoConnection;

  var defaultPasswordManagement = {
    passwordRules: {
      "minDigit": 0,
      "minLength": 0,
      "minLowercase": 0,
      "minSpecial": 0,
      "minUppercase": 0
    },
    passwordRulesErrors: {
      "digit": false,
      "length": false,
      "lowercase": false,
      "special": false,
      "uppercase": false,
      "previously": false,
      "dictionary": false,
      "dictWord": '',
      "genericError": ''
    },
    meter: {
      value: 0,
      max: 4,
      description: ["", "Weak", "Fair", "Fair", "Strong"]
    },
    labels: {
      current: 'Current Password',
      new: 'New Password',
      newConfirm: 'Confirm New Password'
    },
    passwords: {
      current: '',
      new: '',
      newConfirm: ''
    },
    hasError: {
      current: false,
      new: false,
      newConfirm: false
    },
    display: {
      current: false,
      new: false,
      newConfirm: false
    }
  };
  $scope.heightScreen = $window.screen.height;
  $scope.changePassword = changePassword;
  $scope.goToPreviousState = goToPreviousState;
  $scope.removeErrors = removeErrors;
  $scope.togglePasswordVisibility = togglePasswordVisibility;

  ///////////////
  /// Scope Events
  $scope.$on('$ionicView.beforeEnter', function () {
    $scope.dictWord = {errorMessage: ''};
    $scope.pm = angular.copy(defaultPasswordManagement);

    /**
     * Meter
     */
    $translate([
      'OCF.PASSWORD.CHANGE.STRENGTH_METER.WEAK',
      'OCF.PASSWORD.CHANGE.STRENGTH_METER.FAIR',
      'OCF.PASSWORD.CHANGE.STRENGTH_METER.STRONG'
    ]).then(function (meter) {
      $scope.pm.meter.description[1] = meter['OCF.PASSWORD.CHANGE.STRENGTH_METER.WEAK'];
      $scope.pm.meter.description[2] = meter['OCF.PASSWORD.CHANGE.STRENGTH_METER.FAIR'];
      $scope.pm.meter.description[3] = meter['OCF.PASSWORD.CHANGE.STRENGTH_METER.FAIR'];
      $scope.pm.meter.description[4] = meter['OCF.PASSWORD.CHANGE.STRENGTH_METER.STRONG'];
    });

    /**
     * Placeholders
     */
    $translate([
      'OCF.PASSWORD.CHANGE.CURRENT_PLACEHOLDER',
      'OCF.PASSWORD.CHANGE.NEW_PLACEHOLDER',
      'OCF.PASSWORD.CHANGE.CONFIRM_PLACEHOLDER'
    ]).then(function (labels) {
      $scope.pm.labels.current = labels['OCF.PASSWORD.CHANGE.CURRENT_PLACEHOLDER'];
      $scope.pm.labels.new = labels['OCF.PASSWORD.CHANGE.NEW_PLACEHOLDER'];
      $scope.pm.labels.newConfirm = labels['OCF.PASSWORD.CHANGE.CONFIRM_PLACEHOLDER'];

      // Required for resetting object model
      defaultPasswordManagement.labels.current = labels['OCF.PASSWORD.CHANGE.CURRENT_PLACEHOLDER'];
      defaultPasswordManagement.labels.new = labels['OCF.PASSWORD.CHANGE.NEW_PLACEHOLDER'];
      defaultPasswordManagement.labels.newConfirm = labels['OCF.PASSWORD.CHANGE.CONFIRM_PLACEHOLDER'];
    });

    /**
     * Loading service
     */
    $translate('OCF.PASSWORD.CHANGE.PROCESSING').then(function (loading) {
      processing = loading;
    });

    /**
     * Legends
     */
    $translate([
      'OCF.PASSWORD.CHANGE.LEGEND.MUST',
      'OCF.PASSWORD.CHANGE.LEGEND.MUST_NOT',
      'OCF.PASSWORD.CHANGE.LEGEND.USED'/*,
       'OCF.PASSWORD.CHANGE.LEGEND.DICT_WORD'*/
    ]).then(function (legend) {
      legendMust = legend['OCF.PASSWORD.CHANGE.LEGEND.MUST'];
      legendMustNot = legend['OCF.PASSWORD.CHANGE.LEGEND.MUST_NOT'];
      legendUsed = legend['OCF.PASSWORD.CHANGE.LEGEND.USED'];
      //legendDictWord = legend['OCF.PASSWORD.CHANGE.LEGEND.DICT_WORD'];
    });

    /**
     * Dynamic text
     */
    $translate([
      'OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_DIGIT',
      'OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_UPPERCASE',
      'OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_LOWERCASE',
      'OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_SPECIAL',
      'OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.CONTAIN_AT_LEAST',
      'OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.AND'
    ]).then(function (dynamic) {
      dynamicMinDigit = dynamic['OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_DIGIT'];
      dynamicMinUppercase = dynamic['OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_UPPERCASE'];
      dynamicMinLowercase = dynamic['OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_LOWERCASE'];
      dynamicMinSpecial = dynamic['OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.MIN_SPECIAL'];
      dynamicContainAtLeast = dynamic['OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.CONTAIN_AT_LEAST'];
      dynamicAnd = dynamic['OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.AND'];
    });

    /**
     * Dynamic text with variables
     */
    $translate('OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.BE_AT_LEAST_MULTIPLE', {
      number: $scope.pm.passwordRules.minLength
    }).then(function (txt) {
      dynamicBeAtLeastMultiple = txt;
    });

    /**
     * Error Messages
     */
    $translate([
      'OCF.PASSWORD.CHANGE.LEGEND.ERRORS.INVALID_PASSWORD',
      'OCF.PASSWORD.CHANGE.LEGEND.ERRORS.INCORRECT_PASSWORD',
      'OCF.PASSWORD.CHANGE.LEGEND.ERRORS.NO_MATCH_PASSWORD',
      'OCF.PASSWORD.CHANGE.LEGEND.ERRORS.NO_CONNECTION'
    ]).then(function (errors) {
      errorInvalidPass = errors['OCF.PASSWORD.CHANGE.LEGEND.ERRORS.INVALID_PASSWORD'];
      errorIncorrectPass = errors['OCF.PASSWORD.CHANGE.LEGEND.ERRORS.INCORRECT_PASSWORD'];
      errorNoMatchPass = errors['OCF.PASSWORD.CHANGE.LEGEND.ERRORS.NO_MATCH_PASSWORD'];
      errorNoConnection = errors['OCF.PASSWORD.CHANGE.LEGEND.ERRORS.NO_CONNECTION'];
    });

    // pm for PasswordManagement, shortened for readability
    $scope.pm = angular.copy(defaultPasswordManagement);
    $scope.successPasswordChange = false;
    if ($scope.heightScreen < 480){
      $("ion-content").css("height", "auto")
    }
    ChangePasswordService.getPasswordRules()
      .then(function (rules) {
        // Sets rules (removes promises related attributes)
        $scope.pm.pR = JSON.parse(angular.toJson(rules));
        $scope.pm.passwordRules = {minDigit: $scope.pm.pR.minDigit,
          minLength: $scope.pm.pR.minLength,
          minUppercase: $scope.pm.pR.minUppercase,
          minLowercase: $scope.pm.pR.minLowercase,
          minSpecial: $scope.pm.pR.minSpecial
        };
        // Builds the "MUST" message
        buildRules();
      })
      .catch(function (fail) {
        $scope.pm.passwordRulesErrors.genericError = fail.message;
        $log.error(fail.status, fail.message, fail.type);
      });

    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);

    deregisterPasswordStrengthMeter = $scope.$watch('pm.passwords.new', function (password) {
      // updates the password strength meter value based on dropbox's library
      var strength = zxcvbn(password).score;
      $scope.pm.meter.value = strength ? strength : password.length ? 1 : 0;
    });
  });

  $scope.$on('$ionicView.beforeLeave', function () {
    deregisterGoToPreviousState();
    deregisterPasswordStrengthMeter();
    $scope.pm = angular.copy(defaultPasswordManagement); // resets pm
  });


  ///////////////
  // Scope Methods
  /**
   * Request to change password
   */
  function changePassword() {
    LoadingService.show(processing);

    // Resets errors
    $scope.pm.passwordRulesErrors = angular.copy(defaultPasswordManagement.passwordRulesErrors);
    // Resets description
    $scope.pm.finalMessage = angular.copy($scope.pm.noErrorsFinalMessage);
    // newConfirm must match new
    $scope.pm.hasError.newConfirm = $scope.pm.passwords.new !== $scope.pm.passwords.newConfirm;

    if (!$scope.pm.hasError.newConfirm) {
      ChangePasswordService.setNewPassword($scope.pm.passwords.current, $scope.pm.passwords.new)
        .then(function () {
          $scope.successPasswordChange = true;
        })
        .catch(handleErrors)
        .finally(resetFormStates);

    } else {
      LoadingService.hide();
      // Error for the new Confirmation password, there's no action to validate
      $scope.pm.passwords = angular.copy(defaultPasswordManagement.passwords); // Cleans passwords
      $scope.pm.labels.newConfirm = errorNoMatchPass;
    }
    if ($scope.heightScreen < 480){
      $("ion-content").css("height", "auto")
    }
    if ($scope.heightScreen < 480){
      $("ion-content").css("height", "auto")
    }
  }

  /**
   * Error processing function to display messages accordingly.
   *
   * Expected errors:
   *  412 - Password rules failed.
   *  401 - Unauthorized. Basic Auth failed. Current username/password does not match.
   *  500 - Internal Server error (error returned when user:password basic auth isn't correct)
   *    0 - No internet connection
   *
   *  @param fail
   */
  function handleErrors(fail) {
    if (fail.status == 412) {
      $scope.pm.hasError.new = true;
      $scope.pm.labels.new = errorInvalidPass;

      var hasErrors = /length|uppercase|lowercase|digit|special|previously|dictionary.*'/g;
      var errors = fail.data.message.match(hasErrors);

      if (errors.length) {
        // Sets corresponding error flags to true
        for (var i = 0; i < errors.length; i++) {
          var error = errors[i];

          if (error.indexOf("dictionary") !== -1) {
            // extracts the dictWord from the sentence
            $scope.pm.passwordRulesErrors.dictionary = true;
            $scope.pm.passwordRulesErrors.dictWord = error.split("'")[1];
            $translate('OCF.PASSWORD.CHANGE.LEGEND.DICT_WORD', {
              dictWord: $scope.pm.passwordRulesErrors.dictWord
            }).then(function (txt) {
              $scope.dictWord.errorMessage = txt;
            });


          } else {
            $scope.pm.passwordRulesErrors[error] = true;

            if (error.indexOf("previously") == -1) {
              $scope.pm.finalMessage = $scope.pm.finalMessage.replace(error, 'error');
            }
          }
        }
      }
    }

    if (fail.status == 401 || fail.status == 500) {
      $scope.pm.hasError.current = true;
      $scope.pm.labels.current = errorIncorrectPass;
    }

    if (fail.status == 0) {
      $scope.pm.passwordRulesErrors.genericError = errorNoConnection;
    }
  }

  /**
   * Handles the goBack action triggered by menu or HW Back Button
   */
  function goToPreviousState(e) {
    if (!!e) {
      e.preventDefault();
    }

    $ionicViewSwitcher.nextDirection('back');

    if ($scope.successPasswordChange) {
      return false;

    } else {
      if ($scope.previousStateName) {
        $state.go($scope.previousStateName, $scope.previousStateParams);

      } else {
        navigateTo.home();
      }
    }
  }

  /**
   * Resets error state for the specified password
   * @param password
   */
  function removeErrors(password) {
    if ('current' == password && $scope.pm.hasError.current) {
      $scope.pm.display.current = defaultPasswordManagement.display.current;
      $scope.pm.hasError.current = defaultPasswordManagement.hasError.current;
      $scope.pm.labels.current = defaultPasswordManagement.labels.current;

    } else if ('new' == password && $scope.pm.hasError.new) {
      $scope.pm.display.new = defaultPasswordManagement.display.new;
      $scope.pm.hasError.new = defaultPasswordManagement.hasError.new;
      $scope.pm.labels.new = defaultPasswordManagement.labels.new;

    } else if ('newConfirm' == password && $scope.pm.hasError.newConfirm) {
      $scope.pm.display.newConfirm = defaultPasswordManagement.display.newConfirm;
      $scope.pm.hasError.newConfirm = defaultPasswordManagement.hasError.newConfirm;
      $scope.pm.labels.newConfirm = defaultPasswordManagement.labels.newConfirm;

    }
  }

  /**
   * Resets passwords and sets to hidden the passwords
   */
  function resetFormStates() {
    LoadingService.hide();
    $scope.pm.passwords = angular.copy(defaultPasswordManagement.passwords);
    $scope.pm.display = angular.copy(defaultPasswordManagement.display);
  }


  /**
   * Toggles password visibility
   * @param password
   */
  function togglePasswordVisibility(password) {
    if ('current' == password) {
      $scope.pm.display.current = !$scope.pm.display.current;

    } else if ('new' == password) {
      $scope.pm.display.new = !$scope.pm.display.new;

    } else if ('newConfirm' == password) {
      $scope.pm.display.newConfirm = !$scope.pm.display.newConfirm;

    }
  }


  /**
   * Builds the rules' based string to inform the user
   */
  function buildRules() {
    var rulesMessageMapper = {
      minDigit: dynamicMinDigit,
      minUppercase: dynamicMinUppercase,
      minLowercase: dynamicMinLowercase,
      minSpecial: dynamicMinSpecial
    };
    var message = [];
    var spanLength = '<span class="length">';

    // Always starts with the minimum length
    if ($scope.pm.passwordRules.minLength > 1) {
      $translate('OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.BE_AT_LEAST_MULTIPLE', {
        number: $scope.pm.passwordRules.minLength
      }).then(function (txt) {
        $scope.$broadcast('minLengthRetrieved', txt);
      });
      // spanLength += 'be at least ' + $scope.pm.passwordRules.minLength + ' characters, ';

    } else {
      $translate('OCF.PASSWORD.CHANGE.LEGEND.DYNAMIC.BE_AT_LEAST_SINGLE')
        .then(function (txt) {
          $scope.$broadcast('minLengthRetrieved', txt);
        });
      // spanLength += 'be at least one character long, ';
    }


    $scope.$on('minLengthRetrieved', finishStringBuild);


    function getPrepend(rule){
      var prepend='';

      switch ($translate.use()){
        case 'es':
          prepend = 'una ';
          if (rule === 'minDigit' || rule === 'minSpecial') {
            prepend = 'un ';
          }
          break;
        default:
        case 'en':
          prepend = 'a ';
          if (rule === 'minUppercase') {
            prepend = 'an ';
          }
          break;
      }
      return prepend;
    }

    //noinspection JSUnusedLocalSymbols
    /**
     * Builds dynamic string after retrieving i18n fragment
     * @param event
     * @param txt
     */
    function finishStringBuild(event, txt) {
      spanLength += txt;
      spanLength += '</span>';
      message.push(spanLength);

      // Recursively adds valid rules
      lodash.forEach($scope.pm.passwordRules, function (value, rule) {
        if (rule != 'minLength') {
          if (value) {
            var span = '<span class="' + rule.split("min")[1].toLocaleLowerCase() + '">';

            if (value > 1) {
              span += value + ' ' + rulesMessageMapper[rule] + 's';

            } else {
              var prepend = getPrepend(rule);
              span += prepend + rulesMessageMapper[rule];
            }

            span += '</span>';
            message.push(span);
          }
        }
      });

      message[1] = dynamicContainAtLeast + " " + message[1];
      message[message.length - 1] = dynamicAnd + " " + message[message.length - 1];

      var finalMessage = message.join(", ");
      finalMessage += ".";

      // converts it to string and copies it to the object that will be binded in the template
      $scope.pm.finalMessage = finalMessage;
      $scope.pm.noErrorsFinalMessage = angular.copy(finalMessage); // useful to recover string status on submit
    }

    // spanLength += '</span><br/>';
    // message.push(spanLength);
    //
    // // Recursively adds valid rules
    // lodash.forEach($scope.pm.passwordRules, function (value, rule) {
    //   if (rule != 'minLength') {
    //     if (value) {
    //       var span = '<span class="' + rule.split("min")[1].toLocaleLowerCase() + '">';
    //
    //       if (value > 1) {
    //         span += value + ' ' + rulesMessageMapper[rule] + 's';
    //
    //       } else {
    //         var prepend ="";
    //         if (rule != "minDigit"){
    //           prepend = 'a ';
    //
    //           if (rule === 'minUppercase') {
    //             prepend = 'an ';
    //           }
    //         }
    //         span += prepend + rulesMessageMapper[rule];
    //       }
    //       span += '</span>';
    //       message.push(span);
    //     }
    //   }
    // });
    //
    // message[1] = " " + message[1];
    // message[message.length - 1] = "and " + message[message.length - 1];
    //
    // message[0] = message[0] + message[1]+", ";
    // message.splice(1,1);
    // message[1] += ",<br/>";
    // var finalMessage = message.join(" ");
    // finalMessage += ".";
    //
    // // converts it to string and copies it to the object that will be binded in the template
    // $scope.pm.finalMessage = finalMessage;
    // $scope.pm.noErrorsFinalMessage = angular.copy(finalMessage); // useful to recover string status on submit
  }
}
