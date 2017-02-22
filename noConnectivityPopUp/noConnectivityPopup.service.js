/**
  * Created by FMG on 11/03/2016.
  */
angular
  .module('supplier.services')
  .service('NoConnectivityPopupService', NoConnectivityPopupService);

NoConnectivityPopupService.$inject = [
  '$q',
  '$ionicModal',
  'lodash',
  '$log',
  '$rootScope',
  '$timeout',
  '$ionicBackdrop',
  '$translate'
];

function NoConnectivityPopupService($q,
                                    $ionicModal,
                                    lodash,
                                    $log,
                                    $rootScope,
                                    $timeout,
                                    $ionicBackdrop,
                                    $translate) {
  var asps = this;

  asps.close = close;
  asps.retry = retry;
  asps.create = create;
  asps.destroy = destroy;
  asps.open = open;
  asps.isShown = isShown;


  asps.noConnectivity = undefined;
  asps.noConnectivityTemplate = 'ocf/noConnectivityPopUp/noConnectivityPopup.html';
  asps.noConnectivityPopupOptions = {
    animation: 'none',
    focusFirstInput: false,
    backdropClickToClose: false,
    hardwareBackButtonClose: false
  };

  return asps;

  ////////////////////
  /**
   * Closes the popup
   */
  function close() {
    asps.noConnectivity.hide();
    $timeout(function() {
      $ionicBackdrop.release();
      $('body').removeClass('modal-open');
    }, 1000);
    $rootScope.$broadcast('noConnectivityClose', true);
    $log.debug("No Connectivity Close button clicked");
  }


  /**
   * Confirm button clicked
   */
  function retry() {
    asps.noConnectivity.hide();
    $timeout(function() {
      $ionicBackdrop.release();
      $('body').removeClass('modal-open');
    }, 1000);
    $rootScope.$broadcast('noConnectivityRetry', true);
    $log.debug("No Connectivity retry button clicked");
  }


  /**
   * Creates template and stores the pointer to it
   * @param template {String}
   * @param {Object} [options]
   */
  function create(template, options) {
    var q = $q.defer();
    template = template || asps.noConnectivityTemplate;

    if (options) {
      lodash.merge(asps.noConnectivityPopupOptions, options);
    }

    $ionicModal.fromTemplateUrl(template, asps.noConnectivityPopupOptions)
      .then(function (popup) {
        $log.debug("No Connectivity Popup created", popup);
        asps.noConnectivity = popup;
        q.resolve("Popup Created");
      })
      .catch(function (fail) {
        $log.error("No Connectivity Popup failed to load", fail);
        q.reject(fail);
      });

    return q.promise;
  }


  /**
   * Removes popup from DOM
   */
  function destroy() {
    $timeout(function() {
      $ionicBackdrop.release();
    }, 1000);
    asps.noConnectivity.remove();
    $log.debug("No Connectivity removed from DOM");
  }


  /**
   * Called when open is needed
   */
  function open() {
    $timeout(function() {
      asps.noConnectivity.show();
      $ionicBackdrop.retain();
    }, 1000);
    $log.debug("No Connectivitye Open button clicked");
  }

  function isShown() {
    return  asps.noConnectivity.isShown();
  }
}
