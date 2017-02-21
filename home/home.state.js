angular
  .module('ocf.controllers')
  .config(Configure);

Configure.$inject = ['$stateProvider'];

function Configure($stateProvider) {
  $stateProvider
    .state('ocf.home', {
      url: "/home",
      cache: false,
      views: {
        "ocf": {
          controller: 'HomeController',
          templateUrl: 'ocf/home/ocfHome.html'
        }
      },
      resolve: {},
      data: {}
    })
  ;
}
