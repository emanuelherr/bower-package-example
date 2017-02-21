angular
  .module('ocf.controllers', [])
  .controller('HomeController', HomeController);

HomeController.$inject = [
  '$rootScope',
  '$scope',
  'LoadingService',
  '$ionicPlatform',
  '$log',
  '$ionicViewSwitcher',
  '$ionicSideMenuDelegate',
  'LoggingService',
  'LockService'
];

function HomeController($rootScope,
                        $scope,
                        LoadingService,
                        $ionicPlatform,
                        $log,
                        $ionicViewSwitcher,
                        $ionicSideMenuDelegate,
                        LoggingService,
                        LockService) {
  var deregisterGoToPreviousState;

  $scope.goToPreviousState = goToPreviousState;

  $scope.$on('$destroy', function () {
    $log.debug('$destroy');
    deregisterGoToPreviousState();
  });

  $scope.$on('$ionicView.beforeEnter', function () {
    $log.debug('$ionicView.beforeEnter');
    $ionicSideMenuDelegate.canDragContent(false);

    $scope.showBackButton = $rootScope.locations.length > 1;

    if ($rootScope.app && $rootScope.app.appCacheName) {
      $scope.selectListAppItem($rootScope.app.appCacheName, $rootScope.apps);
    }
    else {

      var selected = false;

      $rootScope.apps.forEach(function (app) {
        if(app.selected){
          selected = true;
          $scope.selectListAppItem(app.appCacheName, $rootScope.apps);
        };
      });

      if(!selected) {
        $rootScope.apps[0].selected = true;
      }
    }

    $rootScope.app = undefined;

    deregisterGoToPreviousState = $ionicPlatform.registerBackButtonAction(goToPreviousState, 501);
  });


  /**
   * Function that overrides the hardbackbutton behavior
   */
  function goToPreviousState() {

    $ionicViewSwitcher.nextDirection('back');

    if ($ionicSideMenuDelegate.isOpen()) {
      $ionicSideMenuDelegate.toggleRight(false);

    }
    /*else {
     if ($rootScope.locations.length == 1) {
     navigateTo.home();
     } else {
     navigateTo.gdc();
     }
     }*/
  }

  $scope.selectApp = function () {
    LoadingService.show();

    for (var i = 0; i < $rootScope.apps.length; i++) {
      if ($rootScope.apps[i].selected) {
        $rootScope.app = angular.copy($rootScope.apps[i]);
      }
    }
    $rootScope.app.appCacheName = $rootScope.app.appCacheName.toUpperCase();

    LoggingService.logMessage(LoggingService.CONSTANTS.APP.OCF_APP_SELECTOR, LoggingService.CONSTANTS.CONTEXT.HOME_CONTROLLER, 'select_app', 'User selected an app', 'success',
      [{'key':'application', 'value':JSON.stringify($rootScope.app)}]);

    $rootScope.app.navigateTo();

  };

  $scope.selectListAppItem = function (item, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].appCacheName.toLowerCase() == item.toLowerCase()) {
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

