angular
  .module('ocf.services')
  .service('ScanService', ScanService);

ScanService.$inject = ['$rootScope', '$timeout'];

function ScanService($rootScope, $timeout) {

  var ss = this;

  ss.initialize = initialize;

  /**
   * Initializes the scan and sets the activity to send the intent to
   * @param activityName
   */
  function initialize(activityName) {

    console.log(window.datawedge);

    if (window.datawedge) {

      var activity = activityName ? activityName : "com.bluefletch.motorola.datawedge.ACTION"; //default activity name

      console.log(activityName);

      datawedge.start();

      $timeout(function () {

        datawedge.registerForBarcode(function (data) {

          console.log("dataWedgeScan - broadcast");
          $rootScope.$broadcast('dataWedgeScan', data.barcode);

        });

      }, 300)

    }
  }

  return ss;
}

