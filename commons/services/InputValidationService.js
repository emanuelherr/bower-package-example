angular
  .module('ocf.services')
  .service('InputValidationService', InputValidationService);

InputValidationService.$inject = ['$rootScope'];

function InputValidationService() {

  var cs = this;

  cs.isValidInputTag = isValidInputTag;
  cs.isValidScannedTag = isValidScannedTag;
  cs.setMask = setMask;
  cs.setParameters = setParameters;
  cs.removeMask = removeMask;
  cs.isLongScan = isLongScan;
  cs.isShortScan = isShortScan;
  cs.tagMask = undefined;
  cs.tagShortMask = undefined;
  cs.tagValidFormat = undefined;

  function setParameters(tagMask, tagShortMask, tagValidFormat) {
    this.tagMask = tagMask;
    this.tagShortMask = tagShortMask;
    this.tagValidFormat = tagValidFormat;
  }

  function isValidInputTag(value) {

    var isLongFormat = value && value.length == 24 && (value.indexOf(this.tagMask) == 0);
    var isShortFormat = value && value.length == 8;

    return (this.tagValidFormat == 'long' && isLongFormat) || (this.tagValidFormat == 'short' && isShortFormat)
      || (this.tagValidFormat == 'short-long' && (isLongFormat || isShortFormat));
  }

  function isValidScannedTag(value) {

    var isLongFormat = value && value.length == 24 && (value.indexOf(this.tagMask) == 0);
    var isShortFormat = value && value.length == (8 + this.tagShortMask.length) && (value.indexOf(this.tagShortMask) == 0);

    return (this.tagValidFormat == 'long' && isLongFormat) || (this.tagValidFormat == 'short' && isShortFormat)
      || (this.tagValidFormat == 'short-long' && (isLongFormat || isShortFormat));
  }

  function setMask(value) {

    var isScannedShortFormat = value && value.length == (8 + this.tagShortMask.length) && (value.indexOf(this.tagShortMask) == 0);
    var isInputShortFormat = value && value.length == 8;

    if(isInputShortFormat) {
      return this.tagMask + value;
    } else if(isScannedShortFormat) {
      return this.tagMask + this.removeMask(value);
    } else {
      return value;
    }
  }

  function removeMask(value) {
    return value.substr(-8);
  }

  function isLongScan(value) {
    return (value && value.length == 24 && (value.indexOf(this.tagMask) == 0));
  }

  function isShortScan(value) {
    return (value && value.length == (8 + this.tagShortMask.length) && (value.indexOf(this.tagShortMask) == 0));
  }

  return cs;
}
