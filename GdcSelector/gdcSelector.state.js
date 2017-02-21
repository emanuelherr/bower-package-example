angular
  .module('ocf.controllers')
  .config(Configure);

Configure.$inject = ['$stateProvider'];

/**
 * Retailer Baseline App states/routes definition
 * @param $stateProvider
 */
function Configure($stateProvider) {
  $stateProvider
    .state('ocf.gdcSelector', {
      url: '/gdcSelector',
      cache: false,
      views: {
        "ocf": {
          controller: 'GdcSelectorController',
          templateUrl: 'ocf/GdcSelector/gdcSelector.html'
        }
      }
    })
  ;
}
