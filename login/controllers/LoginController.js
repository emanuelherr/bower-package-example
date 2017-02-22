angular.module('ocf.login', [
  'ui.router'
])

  .config(function config($stateProvider) {
    $stateProvider.state('ocf.login', {
      url: '/login',
      views: {
        "ocf": {
          controller: 'LoginController',
          templateUrl: 'ocf/login/templates/login.html'
        }
      },
      resolve: {},
      data: {}
    })
  })

  .controller('LoginController', [
    '$scope',
    '$timeout',
    '$rootScope',
    'SessionService',
    'navigateTo',
    'ReplicationService',
    'LoadingService',
    'MessageService',
    'CouchDbConfig',
    'encode',
    'URLManager',
    '$resource',
    '$q',
    '$http',
    'DataLayerService',
    'StagingConfigurationService',
    '$ionicPlatform',
    'AutoLogoutPopupService',
    '$log',
    '$window',
    'lodash',
    'LoggingService',
    'OCFConfigurationService',
    'UserPreferenceService',
    '$translate',
    function ($scope,
              $timeout,
              $rootScope,
              SessionService,
              navigateTo,
              ReplicationService,
              LoadingService,
              MessageService,
              CouchDbConfig,
              encode,
              URLManager,
              $resource,
              $q,
              $http,
              DataLayerService,
              StagingConfigurationService,
              $ionicPlatform,
              AutoLogoutPopupService,
              $log,
              $window,
              _,
              LoggingService,
              OCFConfigurationService,
              UserPreferenceService,
              $translate) {

      $scope.goToPreviousState = goToPreviousState;
      var backupUsername = "Username";
      var backupPassword = "Password";

      $scope.form = {
        username: backupUsername,
        password: backupPassword

      };

      var deregisterGoToPreviousState;
      $scope.heightScreen = $window.screen.height;

      $scope.$on('$ionicView.beforeEnter', function () {
        deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);
        if ($window.localStorage.getItem('sessionExpired') === 'true') {
          $scope.autoLogoutPopup = AutoLogoutPopupService;

          $scope.autoLogoutPopup.create('', {scope: $scope})
            .then(function (success) {
              $log.debug(success);
              LoadingService.hide();
              $scope.autoLogoutPopup.open();
            })
            .catch(function (fail) {
              $log.error(fail);
            });
        }

        $translate([
          'OCF.LOGIN.USERNAME_PLACEHOLDER',
          'OCF.LOGIN.PASSWORD_PLACEHOLDER'
        ]).then(function (placeholders) {
          $scope.form.username = placeholders['OCF.LOGIN.USERNAME_PLACEHOLDER'];
          $scope.form.backupUsername = placeholders['OCF.LOGIN.USERNAME_PLACEHOLDER'];
          $scope.form.password = placeholders['OCF.LOGIN.PASSWORD_PLACEHOLDER'];
          $scope.form.backupPassword = placeholders['OCF.LOGIN.PASSWORD_PLACEHOLDER'];
        });
      });

      $scope.$on('$ionicView.beforeLeave', function () {
        $log.debug('$ionicView.beforeLeave');
        $ionicPlatform.offHardwareBackButton(goToPreviousState);
      });

      $scope.$on('$ionicView.afterEnter', function () {
        if ($scope.heightScreen < 480) {
          var usernameInputBlock = document.getElementById("usernameInput").getBoundingClientRect(); // top, right, bottom, left, width
          var passwordInputBlock = document.getElementById("passwordInput").getBoundingClientRect();
          var arrayInputs = ["usernameInput", "passwordInput"];

          for (var i = 0; i < arrayInputs.length; i++) {
            document.getElementById(arrayInputs[i]).addEventListener('touchend', function (element) {
              var $element = $(element.target);
              $timeout(function () {
                if ($element.attr('id') == "usernameInput") delete $scope.form.username;
                else delete $scope.form.password;
              }, 100);
            });
          }

          document.addEventListener('touchend', _onTouchEnd);

          function _onTouchEnd(event) {
            var touches = event.changedTouches[0]; // clientX, clientY

            // username
            if (_touchesInput(usernameInputBlock, touches)) {
              delete $scope.form.username;
            } else {
              $scope.form.username = backupUsername;
            }

            // password
            if (_touchesInput(passwordInputBlock, touches)) {
              delete $scope.form.password;
            } else {
              $scope.form.password = backupPassword;
            }
          }

          function _touchesInput(inputBoundaries, touches) {
            return inputBoundaries.left <= touches.clientX && inputBoundaries.right >= touches.clientX
              && inputBoundaries.top <= touches.clientY && inputBoundaries.bottom >= touches.clientY;
          }
        }
      });

      $scope.$on('$destroy', function () {
        $log.debug("$destroy");
        deregisterGoToPreviousState();
      });

      /**
       * Function that overrides the hardbackbutton behavior
       */
      function goToPreviousState(e) {
        if (!!e) {
          e.preventDefault();
        }
        return;
      }

      $scope.loginData = {};
      $scope.appVersion = "v";
      $scope.heightScreen = $window.screen.height;
      $scope.forgotPassword = forgotPassword;

      $rootScope.$on('appVersion', function (event, appVersion) {
        $scope.appVersion += appVersion;
      });

      $scope.doLogin = function () {
        MessageService.clear();
        // User name should be always lower case.

        if ($scope.loginData && $scope.loginData.username) {
          $scope.loginData.username = $scope.loginData.username.toLowerCase();
        }

        var successLoginInfo;
        var loginData = angular.copy($scope.loginData);

        LoadingService.show("verifying credentials");

        SessionService.login(loginData)
          .then(function (loginSuccess) {
            successLoginInfo = loginSuccess;

            //set the current user
            $rootScope.user = loginSuccess;
            $rootScope.userRecoverData = {};

            // Only supplier user could login into the app
            if ($rootScope.user.accountTypeId != 2) {
              throw {
                status: 500,
                message: 'The user is not a supplier user.',
                type: 'login'
              };
            }

            $scope.locations = $rootScope.user.locations;

            if (!$scope.locations || !$scope.locations[0].appLocations || $scope.locations[0].appLocations.length == 0) {
              throw {
                status: 500,
                message: 'The user does not have access to any application.',
                type: 'login'
              };
            }

            loginSuccess.username = loginSuccess.username.toUpperCase();

            LoadingService.hide();
            console.log("Logged into Zest's WS");

            if (loginSuccess) {
              SessionService.setUserData(loginSuccess);
            }

            LoggingService.logMessage(
              LoggingService.CONSTANTS.APP.OCF_LOGIN,
              LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
              'login',
              'User successfully logged in',
              'success',
              [{'key': 'user', 'value': JSON.stringify(loginSuccess)}]
            );
          })
          .then(function (applicationsSuccess) {
            var userData = SessionService.getUserData($rootScope.user.id);

            $scope.appsList = userData.locations;
            $rootScope.stagingConfiguration = undefined;

            return StagingConfigurationService.getStagingConfiguration();
          })
          .then(function (response) {
            LoadingService.hide();
            $rootScope.stagingConfiguration = response;

            return SessionService.clearCredentials();
          })
          .then(function () {
            SessionService.setCredentials(loginData, successLoginInfo);

            console.log("setting logged user");
            SessionService.setLoggedUserId($rootScope.user.id);

            //TODO: change the way to save this data
            SessionService.setUserApplications($scope.appsList);

            SessionService.setHeaderCommon();

            //call the WS to retrieve the list of apps available for the user
            return SessionService.getApplicationsList();

          })
          .then(function (applicationsSuccess) {
            $rootScope.appsList = applicationsSuccess;
            $rootScope.userRecoverData.appsList = $rootScope.appsList;
            return UserPreferenceService.getUserPreference($rootScope.user.id);
          })
          .then(function (response) {
            $rootScope.userConfiguration = response;

            if ($rootScope.userConfiguration.preferences.language != undefined) {
              $translate.use($rootScope.userConfiguration.preferences.language);
              switch ($rootScope.userConfiguration.preferences.language) {
                case 'es':
                  $rootScope.selectedLanguage = "Spanish";
                  break;
                case 'en':
                  $rootScope.selectedLanguage = "English";
                  break;
              }
            } else {
              $rootScope.selectedLanguage = "English";
              $translate.use('en');
            }
            return OCFConfigurationService.retrieveConfigs();
          })
          .then(function (ocfConfigs) {
            //Getting configuration
            $rootScope.ocfConfigs = ocfConfigs;

            $scope.checkDevice = !!ocfConfigs.filterAppListByDeviceModel;

            $rootScope.checkDevice = $scope.checkDevice;
            $rootScope.filterAppListByDeviceModel = $scope.filterAppListByDeviceModel;

            if ($scope.locations.length == 1) {
              $rootScope.selectedLocation = angular.copy($scope.locations[0]);

              $scope.subApps = [
                {
                  appName: "Shipping",
                  appCacheName: 'G10',
                  supportedDevice: /^TC7.+/
                },
                {
                  appName: "PutAway",
                  appCacheName: 'G04',
                  supportedDevice: /^MC92N0$/
                }
              ];

              var supplierApps = [];

              _.remove($scope.subApps, function (app) {
                return !_.find($rootScope.appsList, {"appName": app.appCacheName});
              });

              supplierApps = _.map($scope.subApps, 'appCacheName');

              $rootScope.apps = _.filter($rootScope.selectedLocation.appLocations, function (app) {
                return supplierApps.indexOf(app.application) != -1;
              });

              _.forEach($rootScope.apps, function (app, index) {
                var subApp = _.find($scope.subApps, {"appCacheName": app.application});
                $rootScope.apps[index].supportedDevice = subApp.supportedDevice;
              });

              if (!$scope.deviceModel && window.device) {
                $scope.deviceModel = window.device.model;
              }

              // Filters app that do not belong to the current Device
              if ($scope.deviceModel && $scope.checkDevice) _.remove($rootScope.apps, function (app) {
                var isValidApp = new RegExp(app.supportedDevice);
                return !$scope.deviceModel.match(isValidApp);
              });

              if ($rootScope.apps.length != 1) {
                if ($rootScope.apps.length) {
                  $log.debug('Login Screen - More than an app, going to app selection screen', JSON.stringify($rootScope.apps));
                  navigateTo.home();
                } else {
                  $log.debug('Login Screen - No apps available');
                  navigateTo.login();
                }

              } else {
                var availableApp = $rootScope.apps[0];
                var appIndex = _.findIndex($scope.subApps, {"appCacheName": availableApp.application});

                if (appIndex == -1) {
                  $log.debug('Login Screen - No valid app available for the current user');
                  $scope.userLogout();

                } else {
                  $scope.subApps[appIndex].selected = true;
                  $rootScope.app = angular.copy($scope.subApps[appIndex]);
                  $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();
                  $rootScope.isPilot = $rootScope.app.appName == "Shipping";
                  $rootScope.appLocationId = availableApp.idUUID;

                  LoggingService.logMessage(
                    LoggingService.CONSTANTS.APP.OCF_LOGIN,
                    LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
                    'auto_select_location',
                    'Only one location, skipping screen',
                    'success',
                    [{'key': 'location', 'value': JSON.stringify($rootScope.selectedLocation)}]
                  );

                  navigateTo[availableApp.application.toLowerCase()]();
                }
              }

            } else {
              LoggingService.logMessage(
                LoggingService.CONSTANTS.APP.OCF_LOGIN,
                LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
                'login',
                'Going to location selector',
                'success',
                {}
              );

              navigateTo.locationSelector();
            }
          })
          .catch(function (error) {
            if (!(error.type === 'remoteStorage' && error.status == 401)) {
              $log.error(error);

              switch (error.status) {
                case 0:
                  MessageService.addErrorMessage("No connection available", true);
                  break;
                case 99:
                  MessageService.addErrorMessage(error.message, true);
                  break;
                default:
                  var readableMessage = error.message + " (code: " + error.status + ")";
                  MessageService.addErrorMessage(readableMessage, true);
                  break;
              }

              LoggingService.logMessage(
                LoggingService.CONSTANTS.APP.OCF_LOGIN,
                LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
                'login',
                'Fail to login',
                'error',
                [
                  {'key': 'error', 'value': JSON.stringify(error)}
                ]
              );
            }
          })
          .finally(function () {
            LoadingService.hide();
            $scope.loginData = {};
          });
      };

      function forgotPassword() {
        LoggingService.logMessage(
          LoggingService.CONSTANTS.APP.OCF_LOGIN,
          LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
          'login',
          'Going to forgot password screen',
          'success',
          {}
        );
        navigateTo.forgotPassword();
      };

      $rootScope.$on('dataRecover', function () {

        var dataRecover = JSON.parse(window.localStorage.getItem("dataRecover"));

        var dataRecoverParam = dataRecover != undefined ? dataRecover : {};

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DATA_RECOVERING, 'onDataRecover callback',
          'Checking if there is data to recover', 'success', [{
            'key': 'dataRecover',
            'value': JSON.stringify(dataRecoverParam)
          }], false);

        if (dataRecover && dataRecover.hasToRecover) {

          dataRecover.hasToRecover = false;

          var user = dataRecover.loginData.user;
          var userRecoverData = dataRecover.loginData.userRecoverData;

          if (user && userRecoverData) {

            $rootScope.user = angular.copy(user);

            user.username = user.username.toUpperCase();

            SessionService.setUserData(user);

            var currentTime = new Date().getTime();
            var pausedDate = new Date(dataRecover.createdDateTime).getTime();
            var logoutTimeoutMilliseconds = dataRecover.loginData.configuration.userInactivityTimeout;
            var timeout = !!logoutTimeoutMilliseconds ? logoutTimeoutMilliseconds : 0;

            $rootScope.stagingConfiguration = dataRecover.loginData.configuration;

            timeout = pausedDate + timeout;

            // User should be logged out as the timeout for background has ended.
            if (currentTime >= timeout) {
              LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DATA_RECOVERING, 'onDataRecover callback',
                'User should be logged out as the timeout for background has ended', 'success', [{
                  'key': 'dataRecover',
                  'value': JSON.stringify(dataRecover)
                },
                  {'key': 'logoutTimeoutMilliseconds', 'value': logoutTimeoutMilliseconds}], false);

              window.localStorage.setItem("dataRecover", JSON.stringify({}));

              $rootScope.$emit('logout', true);
            } else {
              LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DATA_RECOVERING, 'onDataRecover callback',
                'Has to recover', 'success', [{'key': 'dataRecover', 'value': JSON.stringify(dataRecover)}], false);

              var selectedLocation = dataRecover.loginData.selectedLocation;
              var selectedApp = dataRecover.loginData.selectedApp;
              var selectedLanguage = dataRecover.loginData.selectedLanguage;
              var locations = dataRecover.loginData.locations;
              var apps = dataRecover.loginData.apps;
              var checkDevice = dataRecover.loginData.checkDevice;
              var filterAppListByDeviceModel = dataRecover.loginData.filterAppListByDeviceModel;
              var userConfiguration = dataRecover.loginData.userConfiguration;

              delete dataRecover.loginData;
              delete dataRecover.hasToRecover;
              delete dataRecover.createdDateTime;

              window.localStorage.setItem("dataRecover", JSON.stringify(dataRecover));

              $rootScope.userRecoverData = userRecoverData;
              $rootScope.appsList = userRecoverData.appsList;
              $rootScope.userConfiguration = userConfiguration;

              $rootScope.ocfConfigs = {
                filterAppListByDeviceModel: filterAppListByDeviceModel
              };

              SessionService.clearCredentials().then(function () {

                var loginData = {
                  username: user.username
                };

                SessionService.setCredentials(loginData, user);
                SessionService.setLoggedUserId(user.id);
                SessionService.setUserApplications(userRecoverData.appsList);
                SessionService.setHeaderCommon();
              });

              $rootScope.selectedLanguage = selectedLanguage;

              if (!selectedLanguage) {
                $rootScope.selectedLanguage = "English";
                $translate.use('en');
              }

              if (selectedLocation || locations.length == 1) {

                var locToSelect = selectedLocation;

                if (!selectedLocation) {
                  locToSelect = locations[0];
                }

                $rootScope.selectedLocation = angular.copy(locToSelect);

                $scope.subApps = [
                  {
                    appName: "Shipping",
                    appCacheName: 'G10',
                    supportedDevice: /^TC7.+/
                  },
                  {
                    appName: "PutAway",
                    appCacheName: 'G04',
                    supportedDevice: /^MC92N0$/
                  }
                ];

                var supplierApps = [];

                _.remove($scope.subApps, function (app) {
                  return !_.find($rootScope.appsList, {"appName": app.appCacheName});
                });

                supplierApps = _.map($scope.subApps, 'appCacheName');

                $rootScope.apps = _.filter($rootScope.selectedLocation.appLocations, function (app) {
                  return supplierApps.indexOf(app.application) != -1;
                });

                _.forEach($rootScope.apps, function (app, index) {
                  var subApp = _.find($scope.subApps, {"appCacheName": app.application});
                  $rootScope.apps[index].supportedDevice = subApp.supportedDevice;
                });

                if (!$scope.deviceModel && window.device) {
                  $scope.deviceModel = window.device.model;
                }

                // Filters app that do not belong to the current Device
                if ($scope.deviceModel && checkDevice) _.remove($rootScope.apps, function (app) {
                  var isValidApp = new RegExp(app.supportedDevice);
                  return !$scope.deviceModel.match(isValidApp);
                });

                if ($rootScope.apps.length != 1 && !selectedApp) {
                  if ($rootScope.apps.length) {
                    $log.debug('Login Screen - More than an app, going to app selection screen', JSON.stringify($rootScope.apps));
                    navigateTo.home();
                  } else {
                    $log.debug('Login Screen - No apps available');
                    navigateTo.login();
                  }

                } else {

                  var selectedAppIndex = selectedApp != undefined ? _.findIndex($rootScope.apps, {"application": selectedApp.appCacheName}) : 0;

                  if(selectedAppIndex != -1) {
                    $rootScope.app = $rootScope.apps[selectedAppIndex];
                  } else {
                    $rootScope.app = $rootScope.apps[0];
                  }

                  var availableApp = $rootScope.app;
                  var appIndex = _.findIndex($scope.subApps, {"appCacheName": availableApp.application});

                  if (appIndex == -1) {
                    $log.debug('Login Screen - No valid app available for the current user');
                    $scope.userLogout();

                  } else {
                    $scope.subApps[appIndex].selected = true;
                    $rootScope.app = angular.copy($scope.subApps[appIndex]);
                    $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();
                    $rootScope.isPilot = $rootScope.app.appName == "Shipping";
                    $rootScope.appLocationId = availableApp.idUUID;

                    LoggingService.logMessage(
                      LoggingService.CONSTANTS.APP.OCF_LOGIN,
                      LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
                      'auto_select_location',
                      'Only one location, skipping screen',
                      'success',
                      [{'key': 'location', 'value': JSON.stringify($rootScope.selectedLocation)}]
                    );

                    navigateTo[availableApp.application.toLowerCase()]();
                  }
                }

              } else {
                LoggingService.logMessage(
                  LoggingService.CONSTANTS.APP.OCF_LOGIN,
                  LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER,
                  'login',
                  'Going to location selector',
                  'success',
                  {}
                );

                navigateTo.locationSelector();
              }
            }
          } else {
            $rootScope.$broadcast('checkNewVersion');
          }
        } else {
          $rootScope.$broadcast('checkNewVersion');
        }
      });

    }
  ])

;
