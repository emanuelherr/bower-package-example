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

  .directive('ngEnter', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if(event.which === 13) {
          scope.$apply(function(){
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  })

  //.directive('newSampleSubHeader', function () {
  //  return {
  //    scope: {
  //      productName: '=',
  //      productCount: '='
  //    },
  //    restrict: 'E',
  //    templateURL: 'apps/E30/Sample/templates/NewSampleSubHeader.html'
  //  };
  //})

;
