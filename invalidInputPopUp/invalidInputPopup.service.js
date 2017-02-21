/**
  * Created by FMG on 11/03/2016.
  */
angular
  .module('retailer.services')
  .service('InvalidInputPopupService', InvalidInputPopupService);

InvalidInputPopupService.$inject = ['$q', '$ionicModal', 'lodash', '$log', '$rootScope', '$ionicBackdrop'];

function InvalidInputPopupService($q, $ionicModal, lodash, $log, $rootScope, $ionicBackdrop) {
  var asps = this;

  asps.close = close;
  asps.create = create;
  asps.destroy = destroy;
  asps.open = open;
  asps.isShown = isShown;

  asps.invalidInput = undefined;
  asps.invalidInputTemplate = 'ocf/invalidInputPopUp/invalidInputPopup.html';
  asps.invalidInputPopupOptions = {
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
    asps.invalidInput.remove();
    $ionicBackdrop.release();
    $rootScope.$broadcast('invalidInputClose', true);
    $('.backdrop').attr('style', '');
    $('.modal-backdrop').attr('style', '');
  }

  /**
   * Creates template and stores the pointer to it
   * @param template {String}
   * @param {Object} [options]
   */
  function create(template, options) {
    var q = $q.defer();
    template = template || asps.invalidInputTemplate;

    if (options) {
      lodash.merge(asps.invalidInputPopupOptions, options);
    }

    $ionicModal.fromTemplateUrl(template, asps.invalidInputPopupOptions)
      .then(function (popup) {
        $log.debug("Invalid Input Popup created", popup);
        asps.invalidInput = popup;
        q.resolve("Popup Created");
      })
      .catch(function (fail) {
        $log.error("Invalid Input Popup failed to load", fail);
        q.reject(fail);
      });

    return q.promise;
  }

  /**
   * Removes popup from DOM
   */
  function destroy() {
    asps.invalidInput.remove();
    $log.debug("Invalid Input removed from DOM");
  }

  /**
   * Called when open is needed
   */
  function open() {
    asps.invalidInput.show();
    $ionicBackdrop.retain();
    $log.debug("Invalid Input Open button clicked");
  }

  function isShown() {
    return asps.invalidInput.isShown();
  }
}
