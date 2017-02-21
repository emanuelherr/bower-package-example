angular.module('ocf.filters', [])

  .filter('cutStringStart', function () {
    return function (text, length, start) {
      if (isNaN(length)) {
        length = 4;
      }

      /*if (start === undefined) {
        start = "...";
      }*/

      if (!text) {
        return "N/A";
      }
      if (text.length <= length) {
        return text;

      } else {
        return String(text).substr(-length, length);
      }
    };
  })

  .filter('cutStringEnd', function () {
    return function (text, length, end) {
      if (isNaN(length)) {
        length = 4;
      }

      if (end === undefined) {
        end = "...";
      }

      if (!text) {
        return "N/A";
      }
      if (text.length <= length) {
        return text;

      } else {
        return String(text).substr(0, length) + end;
      }
    };
  })


  .filter('toTrusted', ['$sce', function ($sce) {
    return function (text) {
      return $sce.trustAsHtml(text);
    };
  }]);

;
