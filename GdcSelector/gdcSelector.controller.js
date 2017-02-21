angular
  .module('ocf.controllers')
  .controller('GdcSelectorController', GdcSelectorController);

GdcSelectorController.$inject =
  [
    '$scope',
    'SessionService',
    'navigateTo',
    '$rootScope',
    'lodash',
    '$log',
    '$ionicPlatform',
    '$ionicViewSwitcher',
    '$ionicSideMenuDelegate',
    'LoggingService',
    'LockService'
  ];

function GdcSelectorController($scope,
                               SessionService,
                               navigateTo,
                               $rootScope,
                               lodash,
                               $log,
                               $ionicPlatform,
                               $ionicViewSwitcher,
                               $ionicSideMenuDelegate,
                               LoggingService,
                               LockService) {
  var deregisterGoToPreviousState;

  $scope.selectLocation = selectLocation;
  $scope.selectListLocationItem = selectListLocationItem;
  $scope.goToPreviousState = goToPreviousState;

  //// Events
  $scope.$on('$ionicView.beforeEnter', function () {
    $log.debug('$ionicView.beforeEnter');

    var selectedLocation = $rootScope.selectedLocation;

    if (selectedLocation) {
      $scope.selectListLocationItem(selectedLocation, $rootScope.locations);
    } else {

      var selected = false;

      $rootScope.locations.forEach(function (location) {
        if(location.selected){
          selected = true;
          $scope.selectListLocationItem(location, $rootScope.locations);
        };
      });

      if(!selected) {
        $rootScope.locations[0].selected = true;
      }
    }

    $rootScope.selectedLocation = undefined;

    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);
  });

  $scope.$on('$destroy', function () {
    $log.debug('$destroy');
    deregisterGoToPreviousState();
  });


  /**
   * Function that overrides the hardbackbutton behavior
   */
  function goToPreviousState() {
    navigateTo.gdc();
  }

  function selectLocation() {
    for (var i = 0; i < $rootScope.locations.length; i++) {
      if ($rootScope.locations[i].selected) {
        $rootScope.selectedLocation = angular.copy($rootScope.locations[i]);
      }
    }

    if ($rootScope.apps.length == 1) {

      LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOCATION_SELECTOR, LoggingService.CONSTANTS.CONTEXT.GDC_SELECTOR_CONTROLLER, 'select_location', 'User selected a location', 'success',
        [{'key':'location', 'value':JSON.stringify($rootScope.selectedLocation)}]);

      $rootScope.app = angular.copy($rootScope.apps[0]);
      $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();
      $rootScope.app.navigateTo();
    }
    else {

      LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_LOCATION_SELECTOR, LoggingService.CONSTANTS.CONTEXT.GDC_SELECTOR_CONTROLLER, 'select_location', 'User selected a location', 'success',
        [{'key':'location', 'value':JSON.stringify($rootScope.selectedLocation)}]);

      navigateTo.home();
    }

  }

  function selectListLocationItem(item, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].locationId == item.locationId) {
        if (!list[i].selected) {
          list[i].selected = true;
        }
      }
      else {
        list[i].selected = false;
      }
    }
  }

}
