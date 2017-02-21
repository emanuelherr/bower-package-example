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
    'DocumentService',
    'ReplicationService',
    'LoadingService',
    'MessageService',
    'CouchDbConfig',
    'encode',
    'URLManager',
    '$resource',
    '$q',
    '$http',
    '$translate',
    'DataLayerService',
    '$ionicPlatform',
    'AutoLogoutPopupService',
    '$log',
    '$window',
    'LoggingService',
    function LoginController($scope,
                             $timeout,
                             $rootScope,
                             SessionService,
                             navigateTo,
                             DocumentService,
                             ReplicationService,
                             LoadingService,
                             MessageService,
                             CouchDbConfig,
                             encode,
                             URLManager,
                             $resource,
                             $q,
                             $http,
                             $translate,
                             DataLayerService,
                             $ionicPlatform,
                             AutoLogoutPopupService,
                             $log,
                             $window,
                             LoggingService) {
      var deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);
      var verifyingCredentials;
      var remoteStorageVerification;
      var settingUp;

      $scope.loginData = {};
      $scope.appVersion = "v";
      $scope.forgotPassword = forgotPassword;

      $scope.$on("$ionicView.beforeEnter", function () {
        $translate('OCF.LOGIN.NOTIFICATIONS.VERIFYING_CREDENTIALS').then(function (vc) {
          verifyingCredentials = vc;
        });

        $translate('OCF.LOGIN.NOTIFICATIONS.REMOTE_STORAGE_VERIFICATION').then(function (rsv) {
          remoteStorageVerification = rsv;
        });

        $translate('OCF.LOGIN.NOTIFICATIONS.SETTING_UP').then(function (su) {
          settingUp = su;
        });

        if($window.localStorage.getItem('sessionExpired') === 'true') {

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
      });

      $rootScope.$on('appVersion', function (event, appVersion) {
        $scope.appVersion += appVersion;
      });

      $scope.$on('$destroy', deregisterGoToPreviousState);

      $scope.doLogin = function () {
        MessageService.clear();
        var successLoginInfo;

        if ($scope.loginData && $scope.loginData.username) {
          $scope.loginData.username = $scope.loginData.username.toLowerCase();
        }

        var loginData = angular.copy($scope.loginData);

        LoadingService.show(verifyingCredentials);

        SessionService.login(loginData)
          .then(function (loginSuccess) {

            LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'login', 'User successfully logged in', 'success',
              [{'key':'user', 'value':JSON.stringify(loginSuccess)}]);

            successLoginInfo = loginSuccess;
            //set the current user
            $rootScope.user = loginSuccess;
            $rootScope.userRecoverData = {};

            $rootScope.userRecoverData.fileNumber = 0;

            loginSuccess.username = loginSuccess.username.toUpperCase();

            LoadingService.hide();
            LoadingService.show(remoteStorageVerification);
            console.log("Logged into Zest's WS");

            if (loginSuccess) {
              SessionService.setUserData(loginSuccess);
            }

            return SessionService.getSessionID(loginData, loginSuccess);
          })
          .then(function (sessionID) {

            SessionService.setSessionID(sessionID);

            $rootScope.userRecoverData.sessionId = sessionID;

            //call the WS to retrieve the list of apps available for the user
            return SessionService.getApplicationsList();
          })
          .then(function (applicationsSuccess) {
            LoadingService.hide();
            LoadingService.show(settingUp);
            $scope.appsList = applicationsSuccess;

            $rootScope.userRecoverData.appsList = applicationsSuccess;

            return SessionService.ocfManager.applicationConfig(loginData, applicationsSuccess, successLoginInfo.locations);
          })
          .then(function (configs) {
            console.log("Configuration object available");

            SessionService.clearCredentials().then(function () {
              SessionService.setCredentials(loginData, successLoginInfo);

              console.log("setting logged user");
              SessionService.setLoggedUserId($rootScope.user.id);

              //TODO: change the way to save this data
              SessionService.setUserApplications($scope.appsList);
            });

            //Iinitialize the DB
            DataLayerService.initialize(false)
              .then(function (success) {
                LoadingService.hide();

                $rootScope.locations = SessionService.getUserLocations($rootScope.user.id);
                $rootScope.apps = SessionService.getUserApplications($rootScope.user.id);

                LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'login', 'Getting locations', 'success',
                  [{'key':'locations', 'value':JSON.stringify($rootScope.locations)}]);
                LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'login', 'Getting apps', 'success',
                  [{'key':'apps', 'value':JSON.stringify($rootScope.apps)}]);

                //TEST
                /*var lastLocation = $rootScope.locations.pop();
                $rootScope.locations = [];
                $rootScope.locations.push(lastLocation);*/
                //TEST


                //TODO remove it when the J19 is configured
                /*J19*/
                /*var j19App = {
                  "parentAppName":"Retailer",
                  "appName":"J19",
                  "appCacheName":"j19"
                };

                $rootScope.apps.push(j19App);*/
                /*J19*/

                $rootScope.apps.forEach(function (app) {
                  if (app.appCacheName == 'retailer_baseline') {
                    app.navigateTo = navigateTo.retailer;
                  } else if (app.appCacheName == 'j19') {
                    app.navigateTo = navigateTo.j19;
                  } else if (app.appCacheName == 'j18') {
                    app.navigateTo = navigateTo.j18.home;
                  }
                });

                if ($scope.locations.length == 1) {

                  $rootScope.selectedLocation = angular.copy($rootScope.locations[0]);

                  LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'auto_select_location', 'Only one location, skipping screen', 'success',
                    [{'key':'location', 'value':JSON.stringify($rootScope.selectedLocation)}]);

                  if ($scope.apps.length == 1) {

                    $rootScope.app = angular.copy($rootScope.apps[0]);
                    $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();

                    LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'auto_select_app', 'Only one app, skipping screen', 'success',
                      [{'key':'application', 'value':JSON.stringify($rootScope.app)}]);

                    $rootScope.app.navigateTo();

                  } else {

                    LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'transition_to_app_select', 'Go to App Selector', 'success',
                      [{'key':'applications', 'value':JSON.stringify($scope.apps)}]);

                    navigateTo.home();
                  }

                } else {

                  LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'transition_to_location_selector', 'Go to Location Selector', 'success',
                    [{'key':'locations', 'value':JSON.stringify($scope.locations)}]);

                  navigateTo.gdc();
                }
              });
          })
          .catch(function (err) {

            var user = {
              'key': 'user',
              'value':$scope.loginData.username
            };

            var error = {
              'key': 'error',
              'value':JSON.stringify(err)
            };

            //LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'login', 'Error on login', 'error', [user, error]);

            if (!(err.type === 'remoteStorage' && err.status == 401)) {
              switch (err.status){
                case 0:
                  MessageService.addErrorMessage("No connection available", true);
                      break;
                case 99:
                  MessageService.addErrorMessage(err.message, true);
                      break;
                default:
                  var readableMessage = err.message + " (code: " + err.status + ")";
                  MessageService.addErrorMessage(readableMessage, true);
                      break;
              }

              console.log("Offline Login disabled");
              //offlineLoginChecker(err, loginData);

            } else {
              console.log("CouchDB password not correct, will update");

              $scope.getUser(loginData).then(function (remoteStorageSuccess) {
                console.log("User exists on CouchDB");
                return SessionService.remoteStorage.userCanAccessDatabase(loginData);

              })
                .then(function (remoteAccessGranted) {
                  console.log("User is allowed to write on CouchDB");
                  return SessionService.ocfManager.applicationConfig(loginData, 'lotqc');

                })
                .then(function (configs) {
                  console.log("Configuration object available");
                  SessionService.clearCredentials().then(function () {
                    SessionService.setCredentials(loginData, successLoginInfo);
                    SessionService.setLoggedOnline();
                  });

                  //var db = pouchLocalDB.get();
                  //if (!db) {
                  //  db = pouchDB(PouchConfig.pouchdbName);
                  //  pouchLocalDB.set(db);
                  //}

                  $scope.loginData = {};


                  $scope.locations = SessionService.getUserLocations($rootScope.user.id);

                  if ($scope.locations.length == 1) {
                    $rootScope.selectedLocation = angular.copy($scope.locations[0]);
                    navigateTo.e30.menu();
                  }
                  else {
                    navigateTo.e30.packhouse();
                  }

                })
                .catch(function (err) {
                  MessageService.addErrorMessage("Failed to setup remote storage", true);
                  console.log(err);
                })

            }
          })
          .finally(function (done) {
            LoadingService.hide();
            $scope.loginData = {};
          });
      };

      function forgotPassword() {
        navigateTo.forgotPassword();
      }

      /**
       * Handles the goBack action triggered by menu or HW Back Button
       */
      function goToPreviousState(e) {
        // in the login screen back button should do nothing more than closing the keyboard
        e.preventDefault();

        if($scope.autoLogoutPopup && $scope.autoLogoutPopup.isShown()) {
          $scope.autoLogoutPopup.close();

          $window.localStorage.setItem('sessionExpired', 'false');
        }
      }

      $rootScope.$on('dataRecover', function () {

        var dataRecover = JSON.parse(window.localStorage.getItem("dataRecover"));

        var dataRecoverParam = dataRecover != undefined ? dataRecover : {};

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DATA_RECOVERING, 'onDataRecover callback',
          'Checking if there is data to recover', 'success', [{'key':'dataRecover','value':JSON.stringify(dataRecoverParam)}], false);

        if(dataRecover && dataRecover.hasToRecover) {

          dataRecover.hasToRecover =  false;

          var user = dataRecover.loginData.user;
          var userRecoverData = dataRecover.loginData.userRecoverData;

          if(user && userRecoverData) {

            $rootScope.user = angular.copy(user);

            user.username = user.username.toUpperCase();

            SessionService.setUserData(user);

            var currentTime = new Date().getTime();
            var pausedDate = new Date(dataRecover.createdDateTime).getTime();
            var logoutTimeoutMilliseconds = SessionService.getUserData(user.id).logoutTimeoutMilliseconds;
            var timeout = !!logoutTimeoutMilliseconds ? logoutTimeoutMilliseconds : 0;

            timeout = pausedDate + timeout;

            // User should be logged out as the timeout for background has ended.
            if(currentTime >= timeout) {
              LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DATA_RECOVERING, 'onDataRecover callback',
                'User should be logged out as the timeout for background has ended', 'success', [{'key':'dataRecover', 'value':JSON.stringify(dataRecover)},
                  {'key':'logoutTimeoutMilliseconds', 'value':logoutTimeoutMilliseconds}], false);

              window.localStorage.setItem("dataRecover", JSON.stringify({}));

              $rootScope.$emit('logout', true);
            } else {
              LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DATA_RECOVERING, 'onDataRecover callback',
                'Has to recover', 'success', [{'key':'dataRecover', 'value':JSON.stringify(dataRecover)}], false);

              var selectedLocation = dataRecover.loginData.selectedLocation;
              var selectedApp = dataRecover.loginData.selectedApp;
              var locations = dataRecover.loginData.locations;
              var apps = dataRecover.loginData.apps;

              delete dataRecover.loginData;
              delete dataRecover.hasToRecover;
              delete dataRecover.createdDateTime;

              window.localStorage.setItem("dataRecover", JSON.stringify(dataRecover));

              $rootScope.userRecoverData = userRecoverData;

              //$rootScope.userRecoverData.fileNumber = userRecoverData.fileNumber;

              SessionService.setHeaderCommon();

              SessionService.setSessionID(userRecoverData.sessionId);

              SessionService.clearCredentials().then(function () {

                var loginData = {
                  username: user.username
                };

                SessionService.setCredentials(loginData, user);
                SessionService.setLoggedUserId(user.id);
                SessionService.setUserApplications(userRecoverData.appsList);
              });

              //Iinitialize the DB
              DataLayerService.initialize(true)
                .then(function (success) {

                  $rootScope.locations = locations;
                  $rootScope.apps = apps;

                  $rootScope.apps.forEach(function (app) {
                    if (app.appCacheName == 'retailer_baseline') {
                      app.navigateTo = navigateTo.retailer;
                    } else if (app.appCacheName == 'j19') {
                      app.navigateTo = navigateTo.j19;
                    } else if (app.appCacheName == 'j18') {
                      app.navigateTo = navigateTo.j18.home;
                    }
                  });

                  if(selectedApp) {
                    apps.forEach(function (appFromApps) {
                      if (selectedApp.appName == appFromApps.appName) {
                        selectedApp.navigateTo = appFromApps.navigateTo;
                      }
                    });
                  }

                  if(selectedLocation || locations.length == 1) {

                    var locToSelect = selectedLocation;

                    if(!selectedLocation) {
                      locToSelect = locations[0];
                    }

                    $rootScope.selectedLocation = angular.copy(locToSelect);

                    if(selectedApp || apps.length == 1) {

                      var appToSelect = selectedApp;

                      if(!selectedApp) {
                        appToSelect = apps[0];
                      }

                      $rootScope.app = angular.copy(appToSelect);
                      $rootScope.app.appCacheName = selectedApp.appCacheName.toUpperCase();

                      $rootScope.app.navigateTo();
                    } else {
                      navigateTo.home();
                    }
                  } else {
                    navigateTo.gdc();
                  }
                });
            }
          }
        }
      });
    }
  ]);
