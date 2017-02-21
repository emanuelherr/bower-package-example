/**
  * Created by FMG on 11/03/2016.
  */
angular
  .module('retailer.services')
  .service('AutoLogoutPopupService', AutoLogoutPopupService);

AutoLogoutPopupService.$inject = ['$q', '$ionicModal', 'lodash', '$log', '$rootScope', '$ionicBackdrop', '$window'];

function AutoLogoutPopupService($q, $ionicModal, lodash, $log, $rootScope, $ionicBackdrop, $window) {
  var asps = this;

  asps.close = close;
  asps.create = create;
  asps.destroy = destroy;
  asps.open = open;
  asps.isShown = isShown;

  asps.autoLogout = undefined;
  asps.autoLogoutTemplate = 'ocf/autoLogoutPopUp/autoLogoutPopup.html';
  asps.autoLogoutPopupOptions = {
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
    asps.autoLogout.remove();
    $ionicBackdrop.release();
    $rootScope.$broadcast('autoLogoutClose', true);

    $window.localStorage.setItem('sessionExpired', 'false');
  }

  /**
   * Creates template and stores the pointer to it
   * @param template {String}
   * @param {Object} [options]
   */
  function create(template, options) {
    var q = $q.defer();
    template = template || asps.autoLogoutTemplate;

    if (options) {
      lodash.merge(asps.autoLogoutPopupOptions, options);
    }

    $ionicModal.fromTemplateUrl(template, asps.autoLogoutPopupOptions)
      .then(function (popup) {
        $log.debug("AutoLogout Popup created", popup);
        asps.autoLogout = popup;
        q.resolve("Popup Created");
      })
      .catch(function (fail) {
        $log.error("AutoLogout Popup failed to load", fail);
        q.reject(fail);
      });

    return q.promise;
  }

  /**
   * Removes popup from DOM
   */
  function destroy() {
    asps.autoLogout.remove();
    $log.debug("AutoLogout removed from DOM");
  }

  /**
   * Called when open is needed
   */
  function open() {
    asps.autoLogout.show();
    $ionicBackdrop.retain();
    $log.debug("AutoLogout Open button clicked");
  }

  function isShown() {
    return asps.autoLogout.isShown();
  }
}
