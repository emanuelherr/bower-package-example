/**
 *
 * Created by fer on 20/10/2016.
 */
angular
  .module('ocf.services')
  .service('RecoverDataService', RecoverDataService);

RecoverDataService.$inject = ['$q', '$window', 'lodash', 'LoggingService'];

function RecoverDataService($q, $window, _, LoggingService) {
  console.log("RecoverDataService | instantiated");

  var DATA_RECOVER = "dataRecover";
  var APP = "app";
  var localStorage = $window.localStorage;
  var defaultAttrs = {active: false};

  var rds = this;

  rds.attrs = {};

  _resetAttrs();

  ///////////////////////////////////////////
  /**
   * @description
   * Recovers data stored in "onPause" event when app is sent to background
   */
  rds.resume = function () {
    LoggingService.logMessage(LoggingService.CONSTANTS.APP.FRESHNESS_BASELINE, LoggingService.CONSTANTS.CONTEXT.COLLECT_ASSESSMENT_CONTROLLER, 'RB_Data_Recovery', 'Recovery Data Service - Resume', 'success', {});

    var q = $q.defer();
    var dataRecover = localStorage.getItem(DATA_RECOVER);

    if (null !== dataRecover) {
      dataRecover = JSON.parse(dataRecover);
      var appRecover;

      appRecover = angular.copy(dataRecover[APP]);

      if (appRecover) {
        var data = appRecover.data;

        rds.attrs.beforeEnter = {
          scope: _(data).filter({"when": "beforeEnter", "location": "scope"}).value(),
          rootScope: _(data).filter({"when": "beforeEnter", "location": "rootScope"}).value(),
          persistedData: _(data).filter({"when": "beforeEnter", "location": "persistedData"}).value()
        };

        rds.attrs.afterLoading = {
          scope: _(data).filter({"when": "afterLoading", "location": "scope"}).value(),
          rootScope: _(data).filter({"when": "afterLoading", "location": "rootScope"}).value(),
          persistedData: _(data).filter({"when": "afterLoading", "location": "persistedData"}).value()
        };

        rds.attrs.popups = _(data).filter({"type": "popup"}).value();
        rds.attrs.active = true;
        rds.attrs.state = appRecover.state;
        rds.attrs.params = appRecover.params || {};
      }
    }

    LoggingService.logMessage(LoggingService.CONSTANTS.APP.FRESHNESS_BASELINE, LoggingService.CONSTANTS.CONTEXT.COLLECT_ASSESSMENT_CONTROLLER, 'RB_Data_Recovery', 'Recovery Data Service - Resume built data', 'success', rds.attrs);

    q.resolve(rds.attrs);

    return q.promise;
  };

  /**
   * @description
   * Cleans Service's and localStorage data
   */
  rds.clean = function () {
    _resetAttrs();
    localStorage.setItem(DATA_RECOVER, JSON.stringify({}));

    LoggingService.logMessage(LoggingService.CONSTANTS.APP.FRESHNESS_BASELINE, LoggingService.CONSTANTS.CONTEXT.COLLECT_ASSESSMENT_CONTROLLER, 'RB_Data_Recovery', 'Recovery Data Service - Clean', 'success', {});
  };

  /**
   * @private
   * @description
   * Resets Service's attributes
   */
  function _resetAttrs() {
    angular.copy(defaultAttrs, rds.attrs);

    LoggingService.logMessage(LoggingService.CONSTANTS.APP.FRESHNESS_BASELINE, LoggingService.CONSTANTS.CONTEXT.COLLECT_ASSESSMENT_CONTROLLER, 'RB_Data_Recovery', 'Recovery Data Service - Cleaned in-memory data', 'success', {});
  }

  return rds;

}

