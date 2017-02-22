angular.module('ocf.filters', [])

  .filter('cutStringStart', function () {
    return function (text, length, start) {
      if (isNaN(length)) {
        length = 4;
      }

      if (start === undefined) {
        start = "...";
      }

      if (!text) {
        return "N/A";
      }
      if (text.length <= length) {
        return text;

      } else {
        return start + String(text).substr(-length, length);
      }
    };
  })

  .filter('cutEPCStart', function () {
    return function (text, length, start) {
      if (isNaN(length)) {
        length = 4;
      }

      if (start === undefined) {
        start = "xx";
      }

      if (!text) {
        return "N/A";
      }
      if (text.length <= length) {
        return text;

      } else {
        return start + String(text).substr(-length, length);
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
  }])

  .filter('cutStringSize', function () {
    return function (text, font, fontSize, maxSize) {
      if (isNaN(fontSize)) {
        fontSize = 12;
      }
      if (isNaN(maxSize)) {
        maxSize = 50;
      }
      var end = "...";
      if (font == null || font==undefined){
        font = "roboto";
      }
      if (!text) {
        return "N/A";
      }
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext("2d");
      ctx.font = fontSize+"px "+font;
      var width = ctx.measureText(text).width;

      var newText = text;
      var count = 0;
      while(width >= maxSize){
        newText = String(text).substr(0, newText.length - count++) + end;
        width = ctx.measureText(newText).width;
      }
      return newText;
    };
  });

;
