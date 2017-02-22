angular
  .module('ocf.controllers', [])
  .controller('HomeController', HomeController);

HomeController.$inject = [
  'SessionService',
  'navigateTo',
  '$rootScope',
  '$scope',
  '$ionicPlatform',
  '$log',
  'lodash',
  'LoggingService',
  '$ionicViewSwitcher',
  '$ionicSideMenuDelegate',
  '$translate',
  'LoadingService'
];

function HomeController(SessionService,
                        navigateTo,
                        $rootScope,
                        $scope,
                        $ionicPlatform,
                        $log,
                        _,
                        LoggingService,
                        $ionicViewSwitcher,
                        $ionicSideMenuDelegate,
                        $translate,
                        LoadingService) {
  $scope.goToPreviousState = goToPreviousState;
  var deregisterGoToPreviousState;
  $scope.loadingMessage = "loading";
  $scope.$on('$ionicView.beforeEnter', function () {
    LoadingService.hide();
  });


  $scope.$on('$ionicView.beforeEnter', function () {

    $translate('OCF.MESSAGES.LOADING').then(function (result) {
      $scope.loadingMessage = result;
    });

    $scope.checkDevice = !!$rootScope.ocfConfigs.filterAppListByDeviceModel;

    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);

    $rootScope.app = null;
    $rootScope.isPilot = false;

    $scope.locations = SessionService.getUserLocations($rootScope.user.id);
    $scope.hideBackButton = $scope.locations.length == 1;
    $scope.subApps = [
      {
        appName: "Shipping",
        appCacheName: 'G10',
        selected: false
      },
      {
        appName: "Put Away",
        appCacheName: 'G04',
        selected: false
      }
    ];

    var appPosition = _.findIndex($scope.subApps, {"appCacheName": $rootScope.lastApp});

    if (appPosition == -1) {
      $scope.subApps[0].selected = true;
    } else {
      $scope.subApps[appPosition].selected = true;
    }

    var supplierApps = [];

    _.remove($scope.subApps, function (app) {
      return !_.find($rootScope.appsList, {"appName": app.appCacheName});
    });

    supplierApps =_.map($scope.subApps, 'appCacheName');

    $rootScope.apps = _.filter($rootScope.selectedLocation.appLocations, function (app) {
      return supplierApps.indexOf(app.application) != -1;
    });

    _.forEach($rootScope.apps, function (app, index) {
      var subApp = _.find($scope.subApps, {"appCacheName": app.application});
      $rootScope.apps[index].supportedDevice = subApp.supportedDevice;
    });

    if (!$scope.deviceModel && window.device){
      $scope.deviceModel = window.device.model;
    }

    // Filters app that do not belong to the current Device
    if ($scope.deviceModel && $scope.checkDevice) _.remove($rootScope.apps, function (app) {
      var isValidApp = new RegExp(app.supportedDevice);
      return !$scope.deviceModel.match(isValidApp);
    });

    if ($rootScope.apps.length == 1) {
      var availableApp = $rootScope.apps[0];
      var appIndex = _.findIndex($scope.subApps, {"appCacheName": availableApp.application});
      $scope.subApps[appIndex].selected = true;
      $rootScope.app = angular.copy($scope.subApps[appIndex]);
      $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();
      $rootScope.isPilot = $rootScope.app.appName == "Shipping";
      $rootScope.appLocationId = availableApp.idUUID;

      LoggingService.logMessage(
        LoggingService.CONSTANTS.APP.OCF_LOGIN,
        LoggingService.CONSTANTS.CONTEXT.OCF_APP_SELECTOR,
        'auto_select_application',
        'Only one application, skipping screen',
        'success',
        [{'key': 'application', 'value': JSON.stringify(availableApp)}]
      );

      navigateTo[availableApp.application.toLowerCase()]();
    }
  });

  $scope.$on('$ionicView.beforeLeave', function () {
    $log.debug('$ionicView.beforeLeave');
    $ionicPlatform.offHardwareBackButton(goToPreviousState);
  });

  $scope.selectApp = function () {

    LoadingService.show($scope.loadingMessage);

    $rootScope.app = _.find($scope.subApps, {"selected": true});

    var availableApp = _.find($rootScope.selectedLocation.appLocations, {"application": $rootScope.app.appCacheName});
    $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();
    $rootScope.isPilot = $rootScope.app.appName == "Shipping";
    $rootScope.appLocationId = availableApp.idUUID;
    $rootScope.lastApp = $rootScope.app.appCacheName;
    LoggingService.logMessage(
      LoggingService.CONSTANTS.APP.OCF_LOGIN,
      LoggingService.CONSTANTS.CONTEXT.OCF_APP_SELECTOR,
      'auto_select_application',
      'Only one application, skipping screen',
      'success',
      [{'key': 'application', 'value': JSON.stringify(availableApp)}]
    );

    navigateTo[availableApp.application.toLowerCase()]();
  };

  $scope.selectListAppItem = function (item, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] == item) {
        if (!list[i].selected) {
          list[i].selected = true;
        }
      } else {
        list[i].selected = false;
      }
    }
  };

  $scope.$on('$destroy', function () {
    $log.debug("$destroy");
    deregisterGoToPreviousState();
  });

  /**
   * Function that overrides the hardware back button behavior
   */
  function goToPreviousState() {
    $ionicViewSwitcher.nextDirection('back');

    if ($ionicSideMenuDelegate.isOpen()) {
      $ionicSideMenuDelegate.toggleRight(false);
    }
  }
}

