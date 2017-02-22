angular
  .module('ocf.controllers')
  .controller('LocationSelectorController', LocationSelectorController);

LocationSelectorController.$inject = [
  '$scope',
  'SessionService',
  'navigateTo',
  '$rootScope',
  'lodash',
  '$log',
  'LoggingService',
  '$translate',
  'LoadingService'
];

function LocationSelectorController($scope,
                                    SessionService,
                                    navigateTo,
                                    $rootScope,
                                    _,
                                    $log,
                                    LoggingService,
                                    $translate,
                                    LoadingService) {
  $scope.locations = SessionService.getUserLocations($rootScope.user.id);

  $scope.loadingMessage = "loading";

  $scope.$on('$ionicView.beforeEnter', function () {
    $log.debug('Location Selector - $ionicView.beforeEnter');

    $translate('OCF.MESSAGES.LOADING').then(function (result) {
      $scope.loadingMessage = result;
    });

    LoggingService.logMessage(
      LoggingService.CONSTANTS.APP.OCF_LOGIN,
      LoggingService.CONSTANTS.CONTEXT.LOCATION_CONTROLLER,
      'entering_location_screen',
      'Location screen displayed',
      'success',
      {}
    );

    var locationSelected = _.find($scope.locations, {selected: true});

    if (!locationSelected) {
      $scope.locations[0].selected = true;
    }

    $scope.checkDevice = !!$rootScope.ocfConfigs.filterAppListByDeviceModel;

    if ($scope.locations.length == 1) {
      $scope.selectLocation();
    }

  });

  $scope.selectLocation = function () {
    LoadingService.show($scope.loadingMessage);
    $rootScope.selectedLocation = _.find($scope.locations, {"selected": true});

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

    if ($rootScope.apps.length != 1) {
      if ($rootScope.apps.length) {
        $log.debug('Location Selector - More than an app, going to app selection screen', JSON.stringify($rootScope.apps));
        navigateTo.home();
      } else {
        $log.debug('Location Selector - No apps available');
        $scope.userLogout();
      }
    } else {
      var availableApp = $rootScope.apps[0];
      var appIndex = _.findIndex($scope.subApps, {"appCacheName": availableApp.application});

      if (appIndex == -1) {
        $log.debug('Location Selector - No valid app available for the current user');
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

    LoggingService.logMessage(
      LoggingService.CONSTANTS.APP.OCF_LOGIN,
      LoggingService.CONSTANTS.CONTEXT.LOCATION_CONTROLLER,
      'location_selection',
      'Selected location',
      'success',
      [{'key': 'location', 'value': JSON.stringify($rootScope.selectedLocation)}]
    );
  };

  $scope.selectListLocationItem = function (item, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] == item) {
        if (!list[i].selected) {
          list[i].selected = true;
        }
      }
      else {
        list[i].selected = false;
      }
    }
  };
}
