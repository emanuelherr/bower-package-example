angular.module('ocf.directives', [])

  .directive('messages', function () {
    return {
      scope: {
        messages: '='
      },
      restrict: 'E',
      templateUrl: 'ocf/commons/templates/message-service.html',
      link: function ($scope, iElm, iAttrs, controller) {
      }
    };
  })

  .directive('ionPager', function () {
    return {
      priority: 0,
      link: function ($scope, $element, $attr, slideBox) {
        var range = function (start, rangeLength) {
          return Array.apply(null, Array(rangeLength)).map(function (_, i) {return i+start;})
        };

        $scope.currentPage = 1;

        $scope.belongsToCurrentPage = function (index) {
          var currPageRange = range(($scope.currentPage-1)*5, 5);
          if (currPageRange.indexOf(index) !== -1) {
            return true;
          }
        };

        var selectImage = function (index) {
          var i, j;
          var children = $element[0].children[0].children;
          var length = children.length;

          for (i = 0, j = 1; i < length; i++) {
            // applies the page location class
            var pIndex = (i+1)%5 ? j : j++;

            if (i == index) {
              $scope.currentPage = pIndex;
              children[i].classList.add('active');
            } else {
              children[i].classList.remove('active');
            }
          }
        };

        $scope.pagerClick = function (index) {
          slideBox.onPagerClick(index);
        };

        $scope.numSlides = function () {
          return new Array(slideBox.slidesCount());
        };

        $scope.$watch('currentSlide', function (v) {
          selectImage(v);
        });

        $scope.isFirstPage = function () {
          return ($scope.currentPage === 1);
        };

        $scope.isLastPage = function (total) {
          return ($scope.currentPage === Math.ceil(total / 5));
        };

        $scope.prevGalleryPage = function () {
          if (!$scope.isFirstPage()) {
            $scope.currentPage--;
          }
        };

        $scope.nextGalleryPage = function (total) {
          if (!$scope.isLastPage(total)) {
            $scope.currentPage++;
          }
        };
      }
    };

  })

  .directive('ionToggleText', function () {

    var $ = angular.element;

    return {
      restrict: 'A',
      link: function ($scope, $element, $attrs) {

        // Try to figure out what text values we're going to use

        var textOn = $attrs.ngTrueValue || 'on',
          textOff = $attrs.ngFalseValue || 'off';

        if ($attrs.ionToggleText) {
          var x = $attrs.ionToggleText.split(';');

          if (x.length === 2) {
            textOn = x[0] || textOn;
            textOff = x[1] || textOff;
          }
        }

        // Create the text elements

        var $handleTrue = $('<div class="handle-text handle-text-true">' + textOn + '</div>'),
          $handleFalse = $('<div class="handle-text handle-text-false">' + textOff + '</div>');

        var label = $element.find('label');

        if (label.length) {
          label.addClass('toggle-text');

          // Locate both the track and handle elements

          var $divs = label.find('div'),
            $track, $handle;

          angular.forEach($divs, function (div) {
            var $div = $(div);

            if ($div.hasClass('handle')) {
              $handle = $div;
            } else if ($div.hasClass('track')) {
              $track = $div;
            }
          });

          if ($handle && $track) {

            // Append the text elements

            $handle.append($handleTrue);
            $handle.append($handleFalse);

            // Grab the width of the elements

            var wTrue = $handleTrue[0].offsetWidth,
              wFalse = $handleFalse[0].offsetWidth;

            // Adjust the offset of the left element

            $handleTrue.css('left', '-' + (wTrue + 10) + 'px');

            // Ensure that the track element fits the largest text

            var wTrack = Math.max(wTrue, wFalse);
            $track.css('width', (wTrack + 60) + 'px');
          }
        }
      }
    };

  })

  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if(event.which === 13) {
          scope.$apply(function (){
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  });
;
