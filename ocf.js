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
  'supplier.controllers',
  'supplier.menu',
  'ngLodash',
  'pouchdb',
  'pascalprecht.translate',
  'limitStringFilter',
  'ngMockE2E'
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
                 DataLayerService,
                 $window,
                 LoggingService,
                 $httpBackend,
                 StagingConfig,
                 URLManager,
                 EventHandlerService) {
    EventHandlerService.setCurrentState('ocf.run');
    var debugging = false;

    if (debugging) {
      var storageAreas = [
        {
          id: 1,
          barcode: "SA01",
          name: "SA01",
          headerColor: "#62a539",
          bodyColor: "#6db33f"
        },
        {
          id: 2,
          barcode: "SA02",
          name: "Storage Area 02",
          headerColor: "#62a539",
          bodyColor: "#6db33f"

        },
        {
          id: 3,
          barcode: "SA03",
          name: "SA03",
          headerColor: "#c4161c",
          bodyColor: "#ed1c24"
        },
        {
          id: 4,
          barcode: "SA04",
          name: "Storage Area 04",
          headerColor: "darkorange",
          bodyColor: "orange"
        },
        {
          id: 5,
          barcode: "SA05",
          name: "Storage Area 05",
          headerColor: "#2b0a4b",
          bodyColor: "rebeccapurple"
        },
        {
          id: 6,
          barcode: "SA06",
          name: "Storage Area 06",
          headerColor: "#62a539",
          bodyColor: "#6db33f"
        }
      ];

      var palletInfo = {
        pallet: {
          tagEpc: "330C4DE26110028099998001",
          product: {
            id: 23,
            product: "Romaine Lettuce"
          },
          ziprCode: "16-330",
          putAway: true,
          storageArea: {}
        },
        storageAreaValidation: false
      };

      var restMessages = {
        G04201: {code: 200, message: "G04-201"},
        G04202: {code: 200, message: "G04-202"},
        G04401: {status: 400, data: {defaultErrorMessage: "", errorCode: "G04-401"}},
        G04402: {status: 400, data: {defaultErrorMessage: "", errorCode: "G04-402"}}
      };

      $httpBackend.whenGET(/.+storage\/area\/assign\/pallet.+/).respond(function (method, url, data) {
        var extract_epc_phId = /pallet\/(.+)\/packhouse\/(.+)$/;
        var epc_phId = extract_epc_phId.exec(url);

        palletInfo.pallet.storageAreaValidation = epc_phId[1].indexOf("1111") != -1;
        palletInfo.pallet.tagEpc = epc_phId[1];
        palletInfo.pallet.storageArea = storageAreas[Math.floor(Math.random() * 6)];

        return [200, palletInfo];
      });

      $httpBackend.whenPOST(URLManager.getUrl('confirmSA')).respond(function (method, url, data) {
        var obj = JSON.parse(data);

        if (!navigator.onLine) return  [0, {}];

        if (_(storageAreas).find({"barcode": obj.storageArea})) {
          return [restMessages.G04201.code, restMessages.G04201];
        } else {
          return [restMessages.G04402.code, restMessages.G04402.data];
        }
      });

      $httpBackend.whenPOST(URLManager.getUrl('unassignSA')).respond(function (method, url, data) {
        var obj = JSON.parse(data);

        if (obj.tagEpc) {
          return [200, {code: 200, message: "G04-202"}];
        } else {
          return [400, {code: 400, message: "G04-401"}];
        }
      });
    }

    angular.forEach(['GET', 'DELETE', 'JSONP', 'HEAD', 'PUT', 'POST', 'PATCH'], function (method) {
      $httpBackend.when(method).passThrough();
    });

    $ionicPlatform.ready(function () {
      $rootScope.translateProvider = translateProvider;

      $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
        $translate.refresh();
      });

      $translate.use('en'); // FORCES 'en' as default language, regarding the browser definition

      if (window.StatusBar) {
        StatusBar.hide();
      }

      if (window.cordova) {
        window.addEventListener('native.keyboardshow', function(){
          document.body.classList.add('keyboard-open');
        });

        var removeKeyboardOpen = function(){
          setTimeout(function () {
            document.body.classList.remove('keyboard-open');
          }, 1000);
        };

        window.addEventListener('native.keyboardhide', removeKeyboardOpen);

        $rootScope.$watch(function () {
          return $cordovaKeyboard.isVisible();
        }, function (value) {
          $rootScope.$broadcast("keyboard.open", value);
        });

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

        if (window.cordova.plugins.Keyboard) {
          $cordovaKeyboard.hideAccessoryBar(true);
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
              var timeout = $rootScope.stagingConfiguration.userInactivityTimeout;
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

            $rootScope.$broadcast('background', true);

            timer = 0;
            $interval.cancel(stop);
            stop = undefined;

          };
        }
      }

      if (window.StatusBar) {
        StatusBar.styleDefault();
        window.addEventListener('native.keyboardhide', function () {
          window.StatusBar.hide();
        });
        window.addEventListener('native.keyboardshow', function () {
          window.StatusBar.hide();
        });
      }

      //The default status is online, as it is the login
      $rootScope.isOnline = true;

      //Network status indicators
      document.addEventListener("online",
        function(){
        $rootScope.isOnline = true;
          $log.debug("Went Online");
        }, false);

      document.addEventListener("offline",
        function(){
          $rootScope.isOnline = false;
          $log.debug("Went Offline");
        }, false);

      $rootScope.onPauseEvent = function(event) {

        if ($rootScope.user) {
          var dataRecover = {};

          if (window.localStorage.getItem("dataRecover")) {
            dataRecover = JSON.parse(window.localStorage.getItem("dataRecover"));
          }

          var loginData = {
            user: $rootScope.user,
            configuration: $rootScope.stagingConfiguration,
            userConfiguration: $rootScope.userConfiguration,
            selectedLanguage: $rootScope.selectedLanguage,
            checkDevice: $rootScope.checkDevice,
            filterAppListByDeviceModel: $rootScope.filterAppListByDeviceModel,
            selectedLocation: $rootScope.selectedLocation,
            locations: $rootScope.user.locations,
            selectedApp: $rootScope.app,
            userRecoverData: $rootScope.userRecoverData
          };

          dataRecover.loginData = loginData;
          dataRecover.hasToRecover = true;
          dataRecover.createdDateTime = (new Date()).toISOString();

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_PAUSE, 'onPause callback', 'Saving Data recover', 'success',
            [{'key': 'dataRecover', 'value': JSON.stringify(dataRecover)}], $rootScope.user != undefined);

          window.localStorage.setItem("dataRecover", JSON.stringify(dataRecover));

          /*if ($rootScope.onPause) {

           LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_PAUSE, 'onPause callback', 'Calling onPause override method', 'success',
           [], $rootScope.user != undefined);

           $rootScope.onPause();
           }*/
        }
      };

      $rootScope.onResumeEvent = function(event) {

        $rootScope.appResumed = true;

        LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_RESUME, 'onResume callback', 'Checking Data recover', 'success',
          [], $rootScope.user != undefined);

        if ($rootScope.user) {

          var dataRecover = undefined;

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_RESUME, 'onResume callback', 'There is no data to recover', 'success',
            [{'key': 'hasToRecover', 'value': false}], true);

          if (window.localStorage.getItem("dataRecover")) {
            window.localStorage.setItem("dataRecover", JSON.stringify({}));
          }
        } else {

          LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_DATA_RECOVER, LoggingService.CONSTANTS.CONTEXT.ON_RESUME, 'onResume callback',
            'There is data to recover, firing dataRecover event', 'success', [], false);

          $rootScope.$broadcast("dataRecover", event);
        }

      };

      $rootScope.onDeviceReadyEvent = function() {
        console.log('deviceready');

        window.navigationbar.setUp(true);

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

      var isMC = new RegExp(/^MC92N0$/);

      if (window.device && window.device.model.match(isMC)){
        document.addEventListener('touchcancel', function (cancelEvent) {
          handleTouch(cancelEvent);
        });

        document.addEventListener('touchmove', function (moveEvent) {
          handleTouch(moveEvent);
        });
      }

      function handleTouch(event){
        if ($rootScope.lastMove + 100 < event.timeStamp ){

          var touch = event.changedTouches[0];
          var Xpos = event.changedTouches[0].screenX;
          var Ypos = event.changedTouches[0].screenY;

          if ($(touch.target).is("input")){
            $(touch.target).focus();
            cordova.plugins.Keyboard.show();
          }else if($(touch.target).parent().is("input")){
            $(touch.target).parent().focus();
            cordova.plugins.Keyboard.show();
          }else if ($(touch.target).children().is("input")){
            $(touch.target).children().focus();
            cordova.plugins.Keyboard.show();
          }else if($(touch.target).is("button")){
            $(touch.target).click();
            cordova.plugins.Keyboard.close();
          }else if ($(document.elementFromPoint(Xpos , Ypos)).attr('ng-click') != undefined){
            angular.element(document.elementFromPoint(Xpos , Ypos )).triggerHandler('click');
            cordova.plugins.Keyboard.close();
          } else if ($($(document.elementFromPoint(Xpos , Ypos)).parent()).attr('ng-click') != undefined){
            angular.element($(document.elementFromPoint(Xpos , Ypos )).parent()).triggerHandler('click');
            cordova.plugins.Keyboard.close();
          }else if ($($(document.elementFromPoint(Xpos , Ypos)).children()).attr('ng-click') != undefined){
            angular.element($(document.elementFromPoint(Xpos , Ypos )).children()).triggerHandler('click');
            cordova.plugins.Keyboard.close();
          }
          if (event.type == "touchcancel"){
            event.preventDefault();
          }
        }
        $rootScope.lastMove = event.timeStamp;
      }

    });
  })

  .config(function ($stateProvider, $provide, $urlRouterProvider, $ionicConfigProvider, $compileProvider, $httpProvider, $translatePartialLoaderProvider, $translateProvider) {
    translateProvider = $translateProvider;

    $httpProvider.interceptors.push('httpRequestInterceptor');

    $compileProvider.debugInfoEnabled(false);
    $ionicConfigProvider.views.maxCache(2);
    //this disables the iOS native swipeBack scrolling
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.backButton.previousTitleText(false);
    $ionicConfigProvider.tabs.style("standard");
    $ionicConfigProvider.tabs.position("bottom");
    $ionicConfigProvider.navBar.alignTitle('center');

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
      .determinePreferredLanguage();

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

    $provide.decorator('ionPagerDirective', function ($delegate) {
      var delegate = $delegate[0];

      delegate.template = '' +
        '<div class="slider-pager">' +
        ' <ul>' +
        '   <li class="slider-pager-page"' +
        '       ng-repeat="slide in numSlides() track by $index"' +
        '       ng-class="{active: $index == currentSlide}"' +
        '       ng-click="pagerClick($index, numSlides().length)"' +
        '       ng-show="belongsToCurrentPage($index)">' +
        '     <div></div>' +
        '   </li>' +
        ' </ul>' +
        ' <div class="gallery-nav-buttons bottom">' +
        '   <div class="nav-button left" ng-click="prevGalleryPage()" ng-if="!isFirstPage()">' +
        '     <i class="icon ion-chevron-left"></i>' +
        '   </div>' +
        '   <div class="nav-button right" ng-click="nextGalleryPage(numSlides().length)" ng-if="!isLastPage(numSlides().length)">' +
        '     <i class="icon ion-chevron-right"></i>' +
        '   </div>' +
        ' </div>' +
        '</div>';
      return $delegate;
    });

    // Removed default backdrop in modals
    $provide.decorator('ionModalDirective', function ($delegate) {
      var delegate = $delegate[0];
      delegate.template = '' +
        '<div class="modal-backdrop">' +
        ' <div class="modal-wrapper" ng-transclude></div>' +
        '</div>';
      return $delegate;
    });

    $stateProvider
    // Login screen
      .state('ocf', {
        url: "",
        abstract: true,
        template: '<ion-view view-title="OCF"><ion-nav-view name="ocf"></ion-nav-view></ion-view> ',
        controller: 'AppCtrl'
      });


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');
  })

  .controller('AppCtrl', function ($rootScope,
                                   $ionicHistory,
                                   $scope,
                                   encode,
                                   $state,
                                   $ionicModal,
                                   $ionicPopup,
                                   $ionicLoading,
                                   $ionicSlideBoxDelegate,
                                   $timeout,
                                   $log,
                                   SessionService,
                                   SessionConfig,
                                   ReplicationService,
                                   navigateTo,
                                   $q,
                                   MessageService,
                                   CouchDbConfig,
                                   lodash,
                                   InitializationService,
                                   LoadingService,
                                   $cordovaDialogs,
                                   $cordovaBarcodeScanner,
                                   $ionicViewSwitcher,
                                   $ionicBackdrop,
                                   DataLayerService,
                                   $window,
                                   NoConnectivityPopupService,
                                   LanguageSelectorService) {

    MessageService.clear();
    $scope.messages = MessageService.getCurrentMessages();
    $scope.scannerAllowed = window.cordova;
    $rootScope.wasAtNewSample = false;
    $scope.appVersion = "v";
    $rootScope.selectedLanguage = "English";
    $scope.changePassword = changePassword;
    $scope.deviceModel = false;
    $scope.checkDevice = false;

    if ($window.device && $window.device.model) {
      $scope.deviceModel = String($window.device.model);
    }

    $rootScope.$on('appVersion', function (event, appVersion) {
      $scope.appVersion += appVersion;
    });

    $scope.isNewSample = function (path) {
      var regexp = /newLotSample/;
      return regexp.test(path);
    };

    $scope.saveState = function () {
      if (!$scope.isNewSample($state.current.name)) {
        $scope.savedState = angular.copy($state.current.name);
      }

      $scope.savedStateParams = angular.copy($state.params);
    };

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      $log.debug('AppCtrl - $stateChangeStart to ' + toState.to + '- fired when the transition begins. toState,toParams : \n', toState, toParams);
      $scope.previousStateName = fromState.name;

      var session = SessionService.getSessionData();

      $scope.parseDate = function (date) {
        var dateFormat = "MM/DD/YY";
        if (!!$rootScope.selectedLocation.timezoneOffset) {
          return moment(date).utcOffset($rootScope.selectedLocation.timezoneOffset / 60000).format(dateFormat);
        }
        return moment(date).format(dateFormat); // without offset
      };

      $scope.calculateTimeOffset = function (date) {
        if (!!$rootScope.selectedLocation.timezoneOffset) {
          return moment.utc(date).utcOffset($rootScope.selectedLocation.timezoneOffset / 60000)
        } else {
          return moment.utc(date); // without offset
        }
      };

      $rootScope.getCurrentDate = function () {
        return $scope.parseDate(new Date().getTime());
      };

      $scope.saveState();

      setTimeout(function () {
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
    });

    $scope.userLogout = function (deferred, fromInterceptor) {
      //force a logout
      if(fromInterceptor) {
        $window.localStorage.setItem('sessionExpired', 'true');
      }

      //navigateTo.login();
      SessionService.destroy();
      SessionService.clearCredentials();
      //DataLayerService.stopSync();
      $rootScope.user = null;
      $rootScope.app = null;
      $rootScope.selectedLocation = null;
      $log.debug("User logged out successfully");
      document.location = "index.html"; // forces memory data cleanup
    };

    $rootScope.languagePopup = LanguageSelectorService;
    $rootScope.languagePopup.create('', {scope: $rootScope})
      .then(function (success) {
        $log.debug(success);

      })
      .catch(function (fail) {
        $log.error(fail);
      });

    document.addEventListener('backbutton', function(){
      if($rootScope.languagePopup && $rootScope.languagePopup.isShown){
        $rootScope.languagePopup.close();
      }
    });

    $scope.selectLanguage = function () {
      $scope.languagePopup.open();
    };

    function changePassword() {
      navigateTo.changePassword();
    }

    $scope.previousStateName = '';

    /**
     * Methods for debugging purpose
     */
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
      $log.debug('$stateChangeError - fired when an error occurs during transition.');
      $log.debug(arguments);
    });
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
      $log.debug('$stateChangeSuccess to ' + toState.name + '- fired once the state transition is complete.');
    });
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

    $rootScope.noConnectivityPopup = NoConnectivityPopupService;

    $rootScope.noConnectivityPopup.create('', {scope: $rootScope})
      .then(function (success) {
        $log.debug(success);
      })
      .catch(function(error){
        $log.error(error);
      });
  })
;
