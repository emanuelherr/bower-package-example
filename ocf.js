// Ionic Starter App
var translateProvider;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('ocf', [
  'ionic',
  'ngCordova',
  'ngResource',
  'ocf.constants',
  'ocf.services',
  'ocf.directives',
  'ocf.interceptors',
  'ocf.filters',
  'ocf.login',
  'ocf.forgotPassword',
  'ocf.changePassword',
  'ocf.controllers',
  'retailer.controllers',
  'retailer.menu',
  'ngLodash',
  'pouchdb',
  'toTrustedFilter',
  'angular.img',
  'pascalprecht.translate'
])


  .run(function ($rootScope,
                 $state,
                 $interval,
                 $ionicPlatform,
                 $cordovaKeyboard,
                 EnvironmentConfig,
                 LoadingService,
                 SessionService,
                 navigateTo,
                 ScanService,
                 $log,
                 $translate,
                 $window,
                 LoggingService) {

    $rootScope.translateProvider = translateProvider;

    $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
      $translate.refresh();
    });

    // TODO: Remove this line when i18n gets implemented
    $translate.use('en'); // FORCES 'en' as default language, regarding the browser definition

    $ionicPlatform.ready(function () {
      ionic.Platform.isFullScreen = true;

      // Prevents that Auto-Update gets stuck in a loop when user cancel the
      // update installation
      var askedToInstallApk = false;

      if (window.cordova) {
        $rootScope.$watch(function () {
          return $cordovaKeyboard.isVisible();
        }, function (value) {
          $rootScope.$broadcast("keyboard.open", value);
        });

        window.addEventListener('native.keyboardshow', keyboardShowHandler);

        function keyboardShowHandler(e) {
          $rootScope.$broadcast("native.keyboardshow", e);
        }

        window.addEventListener('native.keyboardhide', keyboardHideHandler);

        function keyboardHideHandler(e) {
          $rootScope.$broadcast("native.keyboardhide", e);
        }

        if (window.cordova.plugins && window.cordova.plugins.autoStart) {
          window.cordova.plugins.autoStart.enable();
        }

        //initialize the native scanner on the TC-55 if it exists
        ScanService.initialize();

        if (window.hockeyapp) {
          window.hockeyapp.start(function (message) {
            $log.debug(message);
          }, function (message) {
            console.error(message);
          }, "9f3c70eff11ea8481da53c438fd2ec18");
        }


        if (window.cordova.getAppVersion) {
          window.cordova.getAppVersion(function (version) {
            if (version == "N/A") {
              version = "Version Unavailable";
            }
            $rootScope.appVersion = version;
            $rootScope.$broadcast('appVersion', version);
          });
        }

        if (window.cordova.plugins.backgroundMode) {
          // Enable background mode
          cordova.plugins.backgroundMode.enable();

          var timer = 0;
          var stop;

          // Called when background mode has been activated
          cordova.plugins.backgroundMode.onactivate = function () {

            $log.debug("Went background");

            if ($rootScope.user && $rootScope.user.id) {

              var timeout = SessionService.getUserData($rootScope.user.id).logoutTimeoutMilliseconds;
              timeout = !!timeout ? timeout : 0;

              var today = new Date();
              var now = today.getTime();

              if (timeout) {
                timeout = now + timeout;
              }

              var timeout_date = new Date(timeout);
              $log.debug('Background Time: ' + today + ' Log out at: ' + timeout_date);
              stop = $interval(function () {

                var today_interval = new Date();
                var now_interval = today_interval.getTime();

                $log.debug('trying logout at date: ' + today_interval);
                //check if it should be logged out
                if (now_interval >= timeout) {

                  window.localStorage.setItem("dataRecover", JSON.stringify({}));

                  //stop any ongoing replication if it exists
                  if (!!$rootScope.replicationHandler) {
                    $log.debug("Cancelling replication");
                    $rootScope.replicationHandler.cancel();
                  }

                  //force a logout
                  SessionService.destroy();
                  $log.debug("User logged out successfully");
                  $window.localStorage.setItem('sessionExpired', 'true');
                  document.location = "index.html"; // forces memory data cleanup
                  SessionService.clearCredentials();

                  //navigateTo.login();
                }
              }, 10000);
            }
          };

          cordova.plugins.backgroundMode.ondeactivate = function () {

            $log.debug("Went foreground");

            timer = 0;
            $interval.cancel(stop);
            stop = undefined;

            // Check if there are app updates when device background mode is deactivated
            // This only works on Login screen
            /*if ($state.is('ocf.login')) {
              if (!askedToInstallApk) {
                $rootScope.$broadcast('checkNewVersion');
              } else {
                askedToInstallApk = false;
              }
            }*/
          };
        }
      }

      if (window.StatusBar) {
        //window.addEventListener('native.keyboardshow', function () {
        //  //document.body.classList.add('keyboard-open');
        //});

        window.addEventListener('native.keyboardhide', function () {
          //document.body.classList.remove('keyboard-open');
          window.StatusBar.hide();
        });

      }

      //The default status is online, as it is the login
      $rootScope.isOnline = true;

      //Network status indicators
      document.addEventListener("online", function () {
        $rootScope.isOnline = true;
        $log.debug("Went Online");
        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.WINDOW_EVENT, 'Application_onLine', 'The application changed from Offline to Online', 'success',{});
      }, false);

      document.addEventListener("offline", function () {
        $rootScope.isOnline = false;
        $log.debug("Went Offline");
      }, false);


      $rootScope.$on('removeFiles', function(event) {
        var getFileConfig = {
          create: false,
          exclusive: false
        };

        var env = EnvironmentConfig.env;

        cordova.file.externalApplicationStorageDirectory = cordova.file.externalApplicationStorageDirectory || "";

        window.resolveLocalFileSystemURL(cordova.file.externalApplicationStorageDirectory, localFileSuccess, localFileFail);

        function localFileSuccess(fileSystem) {
          fileSystem.getFile('/FRESH-RetailerBaseline-version.txt', getFileConfig, getTxtFileSuccess, getTxtFileFail);
          fileSystem.getFile('/FRESH-RetailerBaseline-' + env + '.apk', getFileConfig, getTxtFileSuccess, getTxtFileFail);

          function getTxtFileSuccess(fileEntry) {
            fileEntry.remove(fileRemoveSuccess, fileRemoveFail);

            function fileRemoveSuccess(entry) {
              console.log("File removed succeeded.");
            }

            function fileRemoveFail(error) {
              console.log("Error removing txt file: " + error);
            }
          };

          function getTxtFileFail(evt) {
            console.log("Error getting txt file for removing: " + evt.code);
          }
        }

        function localFileFail(evt) {
          console.log("Error getting txt file: " + evt.code);
        }
      });

      $rootScope.onPauseEvent = function(event) {

        var dataRecover = {};

        if (window.localStorage.getItem("dataRecover")) {
          dataRecover = JSON.parse(window.localStorage.getItem("dataRecover"));
        }

        var loginData = {
          user: $rootScope.user,
          selectedLocation: $rootScope.selectedLocation,
          locations: $rootScope.locations,
          apps: $rootScope.apps,
          selectedApp: $rootScope.app,
          userRecoverData: $rootScope.userRecoverData
        };

        dataRecover.loginData = loginData;
        dataRecover.hasToRecover = true;
        dataRecover.createdDateTime = (new Date()).toISOString();

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_PAUSE, 'onPause callback', 'Saving Data recover', 'success',
          [{'key': 'dataRecover', 'value': JSON.stringify(dataRecover)}], $rootScope.user != undefined);

        window.localStorage.setItem("dataRecover", JSON.stringify(dataRecover));

        if ($rootScope.onPause) {

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_PAUSE, 'onPause callback', 'Calling onPause override method', 'success',
            [], $rootScope.user != undefined);

          $rootScope.onPause();
        }
      };

      $rootScope.onResumeEvent = function(event) {

        $rootScope.$broadcast('removeFiles');

        $rootScope.appResumed = true;

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_RESUME, 'onResume callback', 'Checking Data recover', 'success',
          [], $rootScope.user != undefined);

        if ($rootScope.user) {

          var dataRecover = undefined;

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_RESUME, 'onResume callback', 'There is no data to recover', 'success',
            [{'key': 'hasToRecover', 'value': false}], true);

          if (window.localStorage.getItem("dataRecover")) {
            /*dataRecover = JSON.parse(window.localStorage.getItem("dataRecover"));

             dataRecover.hasToRecover = false;
             dataRecover.loginData = {};
             dataRecover.createdDateTime = undefined;*/

            window.localStorage.setItem("dataRecover", JSON.stringify({}));
          }
        } else {

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_RESUME, 'onResume callback',
            'There is data to recover, firing dataRecover event', 'success', [], false);

          // If the Activity was killed as part of a camera request, there will
          // be a pending result as part of the object
          if(event.pendingResult) {
            console.log(JSON.stringify(event.pendingResult));
            $rootScope.lastPictureTaken = event.pendingResult;
          }

          $rootScope.$broadcast("dataRecover", event);
        }

      };

       $rootScope.onDeviceReadyEvent = function() {
        console.log('deviceready');

        $rootScope.$broadcast('removeFiles');

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DEVICE_READY, 'onDeviceReady callback',
          'checking Data recover', 'success', [], false);

        if (!$rootScope.appResumed) {

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_DEVICE_READY, 'onDeviceReady callback',
            'There is data to recover, firing dataRecover event', 'success', [], false);

          $rootScope.$broadcast("dataRecover", event);
        }
      };

      //Add Pause event listener
      document.addEventListener("pause", $rootScope.onPauseEvent, false);

      //Add Resume event listener for autolock
      document.addEventListener("resume", $rootScope.onResumeEvent, false);

      document.addEventListener('deviceready', $rootScope.onDeviceReadyEvent, false);
    });
  })

  .config(function ($stateProvider,
                    $provide,
                    $urlRouterProvider,
                    $ionicConfigProvider,
                    $compileProvider,
                    $logProvider,
                    $translateProvider,
                    $translatePartialLoaderProvider,
                    $httpProvider) {

    translateProvider = $translateProvider;

    $httpProvider.interceptors.push('httpRequestInterceptor');

    $logProvider.debugEnabled(false);
    $compileProvider.debugInfoEnabled(false);
    $ionicConfigProvider.views.maxCache(2);
    $ionicConfigProvider.views.swipeBackEnabled(false); //this disables the iOS native swipeBack scrolling

    $ionicConfigProvider.tabs.style("standard");
    $ionicConfigProvider.tabs.position("bottom");

    $ionicConfigProvider.navBar.alignTitle('center');
    $ionicConfigProvider.backButton.previousTitleText(false);

    // Translation configuration
    $translatePartialLoaderProvider.addPart('ocf/locales');
    $translateProvider
      .useLoader('$translatePartialLoader', {
        urlTemplate: '{part}/{lang}.json'
      })
      .registerAvailableLanguageKeys(['en', 'es'], {
        'en_*': 'en',
        'es_*': 'es'
      })
      .preferredLanguage('en')
      .fallbackLanguage('en')
      .determinePreferredLanguage()
      .useSanitizeValueStrategy('escapeParameters');


    //$q.allSettled implementation
    //allows to wait for multiple promises and don't reject if one fails
    $provide.decorator('$q', ['$delegate', function ($delegate) {
      var $q = $delegate;

      // Extention for q
      $q.allSettled = $q.allSettled || function (promises) {
          var deferred = $q.defer();
          if (angular.isArray(promises)) {
            var states = [];
            var results = [];
            var didAPromiseFail = false;

            // First create an array for all promises setting their state to false (not completed)
            angular.forEach(promises, function (promise, key) {
              states[key] = false;
            });

            // Helper to check if all states are finished
            var checkStates = function (states, results, deferred, failed) {
              var allFinished = true;
              angular.forEach(states, function (state, key) {
                if (!state) {
                  allFinished = false;
                  return;
                }
              });
              if (allFinished) {
                if (failed) {
                  deferred.reject(results);
                } else {
                  deferred.resolve(results);
                }
              }
            };

            // Loop through the promises
            // a second loop to be sure that checkStates is called when all states are set to false first
            angular.forEach(promises, function (promise, key) {
              $q.when(promise).then(function (result) {
                states[key] = true;
                results[key] = result;
                checkStates(states, results, deferred, didAPromiseFail);
              }, function (reason) {
                states[key] = true;
                results[key] = reason;
                didAPromiseFail = true;
                checkStates(states, results, deferred, didAPromiseFail);
              });
            });
          } else {
            throw 'allSettled can only handle an array of promises (for now)';
          }

          return deferred.promise;
        };

      return $q;
    }]);

    // Personalized ionicPagerDirective based on Zest requirements
    $provide.decorator('ionPagerDirective', function ($delegate) {
      var delegate = $delegate[0];
      delegate.template = '<div class="slider-pager"><ul><li class="slider-pager-page" ng-repeat="slide in numSlides() track by $index" ng-class="{active: $index == currentSlide}" ng-click="pagerClick($index, numSlides().length)" ng-show="belongsToCurrentPage($index)"><div></div></li></ul>' +
        '<div class="gallery-nav-buttons bottom"> <div class="nav-button left" ng-click="prevGalleryPage()" ng-if="!isFirstPage()"> <i class="icon ion-chevron-left"></i> </div> <div class="nav-button right" ng-click="nextGalleryPage(numSlides().length)" ng-if="!isLastPage(numSlides().length)"> <i class="icon ion-chevron-right"></i> </div> </div>' +
        '</div>';
      return $delegate;
    });

    // Removed default backdrop in modals
    $provide.decorator('ionModalDirective', function ($delegate) {
      var delegate = $delegate[0];
      delegate.template = '<div class="modal-backdrop">' +
        '<div class="modal-wrapper" ng-transclude></div>' +
        '</div>';
      return $delegate;
    });

    $stateProvider
      .state('ocf', {
        url: "",
        abstract: true,
        template: '<ion-view view-title="OCF"><ion-nav-view name="ocf"></ion-nav-view></ion-view>',
        controller: 'AppCtrl'
      });


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  })

  .controller('AppCtrl', [
    '$rootScope',
    '$scope',
    '$state',
    '$timeout',
    '$log',
    'SessionService',
    'SessionConfig',
    'navigateTo',
    'MessageService',
    'DataLayerService',
    'LoadingService',
    '$window',
    'LoggingService', function ($rootScope,
                         $scope,
                         $state,
                         $timeout,
                         $log,
                         SessionService,
                         SessionConfig,
                         navigateTo,
                         MessageService,
                         DataLayerService,
                         LoadingService,
                         $window,
                         LoggingService) {
      MessageService.clear();
      $rootScope.wasAtNewSample = false;
      $rootScope.stateTransition = {failOnTransition: false};
      $scope.scannerAllowed = window.cordova;
      $scope.appVersion = "v";
      $scope.previousStateName = '';
      $scope.messages = MessageService.getCurrentMessages();

      $scope.changePassword = navigateTo.changePassword;
      $scope.userLogout = userLogout;
      $scope.exit = exit;

      $rootScope.$on('appVersion', function (event, appVersion) {
        $scope.appVersion += appVersion;
      });

      $rootScope.$on('$stateChangeStart', stateChangeStart);
      $rootScope.$on('$stateChangeError', stateChangeError);
      $rootScope.$on('$stateChangeSuccess', LoadingService.hide);
      $rootScope.$on('$stateNotFound', LoadingService.hide);

      $rootScope.$on('logout', userLogout);

      ///////////////////////////
      /**
       * Cleans session data and redirects the user to the login screen
       * @param deferred
       * @param fromInterceptor
       */
      function userLogout(deferred, fromInterceptor) {
        //force a logout

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOGIN, LoggingService.CONSTANTS.CONTEXT.LOGIN_CONTROLLER, 'userLogout event',
          'Logging out user', 'success', [{'key':'user', 'value':JSON.stringify($rootScope.user)}], false);

        if(fromInterceptor) {
          $window.localStorage.setItem('sessionExpired', 'true');
        }

        //navigateTo.login();
        SessionService.destroy();
        SessionService.clearCredentials();
        DataLayerService.stopSync();
        DataLayerService.stopChanges();
        $rootScope.user = null;
        $rootScope.app = null;
        $rootScope.selectedLocation = null;
        $log.debug("User logged out successfully");
        document.location = "index.html"; // forces memory data cleanup
      }

      /**
       * Logs out the user and exits the application
       */
      function exit() {
        $scope.userLogout();
        navigator.app.exitApp();
      }

      /**
       * Takes decisions based on current status
       * @param event
       * @param toState
       * @param toParams
       * @param fromState
       * @param fromParams
       */
      function stateChangeStart(event, toState, toParams, fromState, fromParams) {
        var session = SessionService.getSessionData();
        var isNewLotSample = /newLotSample/;
        var stateCurrentName = $state.current.name;

        $scope.savedStateParams = angular.copy($state.params);
        $scope.previousStateName = fromState.name;
        $scope.previousStateParams = fromParams;

        if (!isNewLotSample.test(stateCurrentName)) {
          $scope.savedState = angular.copy(stateCurrentName);
        }

        $timeout(function () {
          $('ion-nav-bar').removeClass('hide');
          $('ion-nav-back-button').removeClass('hide');
          $('button').removeClass('hide');
        }, 10);

        if (session !== null) {
          var sessionOver = (Date.now() - session.createdDate) / (1000 * 3600) > SessionConfig.cookieLifeTime;
        }

        if (!!session && session.status == "loggedOffline" && sessionOver) {
          $log.debug("Session lifetime reached. Logging out");
          //try to replicate
          $scope.userLogout();
          navigateTo.login();
          event.preventDefault();
        }
      }

      //noinspection JSUnusedLocalSymbols
      /**
       * Handles State Change error event
       * @param event
       * @param toState
       * @param toParams
       * @param fromState
       * @param fromParams
       * @param error
       */
      function stateChangeError(event, toState, toParams, fromState, fromParams, error) {
        $rootScope.stateTransition.failOnTransition = true;
        $rootScope.stateTransition.params = toParams;
        $rootScope.stateTransition.state = toState;
        $scope.$broadcast('stateTransitionFailed', error);
        LoadingService.hide();
      }

      ///////////////////////
      /**
       * Events listeners for debugging purpose
       */
      $rootScope.$on('$viewContentLoading', function (event, viewConfig) {
        // runs on individual scopes, so putting it in "run" doesn't work.
        $log.debug('$viewContentLoading - view begins loading - dom not rendered', viewConfig);
      });
      $rootScope.$on('$viewContentLoaded', function (event) {
        $log.debug('$viewContentLoaded - fired after dom rendered', event);
      });
      $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
        $log.debug('$stateNotFound ' + unfoundState.to + '  - fired when a state cannot be found by its name.');
        $log.debug(unfoundState, fromState, fromParams);
      });

      $scope.$on('logout', $scope.userLogout);
    }])
;
