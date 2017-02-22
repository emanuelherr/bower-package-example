angular
  .module('ocf.controllers')
  .config(Configure);

Configure.$inject = ['$stateProvider'];

/**
 * Apps states/routes definition
 * @param $stateProvider
 */
function Configure($stateProvider) {
  $stateProvider
    .state('ocf.locationSelector', {
      url: '/locationSelector',
      views: {
        "ocf": {
          controller: 'LocationSelectorController',
          templateUrl: 'ocf/commons/LocationSelector/locationSelector.html'
        }
      }
    })
  ;
}
