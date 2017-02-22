angular
  .module('ocf.services')
  .service('SampleDefinitionService', SampleDefinitionService);

SampleDefinitionService.$inject = ['lodash', 'SessionService', '$rootScope'];

function SampleDefinitionService(lodash, SessionService, $rootScope) {
  var cleanDataModel = {
    isBulkInfo: false,
    groups: [],
    screens: {
      pictures: {
        display: false,
        title: ""
      },
      dataContainer: []
    }
  };

  var dataModel = {
    ds: angular.copy(cleanDataModel)
  };



  dataModel.getSampleDefinitionId = function (product) {

    var configObject = SessionService.ocfManager.getApplicationConfig($rootScope.selectedLocation.locationId, $rootScope.app.appCacheName).config;

    //match the productProfile-sampleDefinition pair with the corresponding sampleDefinition
    if (configObject.lots[0] && configObject.lots[0] && configObject.lots[0].profileLocation && configObject.lots[0].profileLocation.length) {
      var profileLocation =  lodash.find(configObject.lots[0].profileLocation, function (pl) {
        return pl.produceProfileId == product.id;
      });
    }

    if (profileLocation){
      return profileLocation.sampleDefinitionId;
    }
  }

  dataModel.dynamicDataStructure = function (product) {

    var configObject = {};

    configObject = SessionService.ocfManager.getApplicationConfig($rootScope.selectedLocation.locationId, $rootScope.app.appCacheName).config;
    var gc = [];

    //match the productProfile-sampleDefinition pair with the corresponding sampleDefinition
    if (configObject.attributes.length) {
      gc = lodash.find(configObject.attributes, function (attribute) {
        return attribute.sampleDefinitionId == product.sampleDefinitionId;
      });
    }

    var dataObj = {
      title: '',
      group: '',
      name: '',
      value: '',
      screen: '',
      validity: {},
      reference: '',
      default: '',
      adjusted: false,
      optional: false
    };

    var acceptedValidityTypes = ["_enum", "_limit", "range", "enum", 'Eol'];
    var subgroupIndexer = {};
    dataModel.ds.data = [];

    ////for each attribute group, make a new screen/tab
    //for (var i = 0; i < gc.values.length; i++) {
    var screen = gc;

    if (typeof screen.ispicturegroup == "undefined") {
      $rootScope.$broadcast('noAttributes');
      return;
    }

    dataModel.ds.header = {};

    // Picture Screen is defined in the controller after this data initialization
    if (!screen.ispicturegroup) {

      for (var j = 0; j < screen.values.length; j++) {

        var value = screen.values[j];
        var vType = value.type;
        var _index = vType.indexOf("_");
        var valueType = _index !== -1 ? vType.substr(_index).toLocaleLowerCase() : vType.toLocaleLowerCase();
        var data = angular.copy(dataObj);
        var vName = value.name;
        var reference = value.reference;
        var default_value = value.default;
        var options = value.options;

        var s = undefined;
        var adjustedValue = undefined;
        var mode = undefined;
        var isPercentage = false;
        var isOptional = false;

        if (options !== undefined) {
          evalOptions(options);
        }


        if (acceptedValidityTypes.indexOf(valueType) === -1) {
          // count or text
          // Considers the type as a parent of _enum and _limit types
          if (typeof subgroupIndexer[valueType] === "undefined") {
            subgroupIndexer[valueType] = 0;
          }
          data.title = vName;
          data.group = valueType;
          data.name = valueType + "_0";
          data.validity.type = "relatives";
          data.default = default_value;
          data.optional = isOptional;

          //TEMPORAL CODE FOR EOL SUPPORT
          if (valueType == "eol") {

            data.validity.type = "enum";
            data.isEol = true;
            data.eolChecked = false;
            data.validity.options = [
              {"value": "No"},
              {"value": "Yes"}];

            data.reasons = value.descriptors;

            lodash.forEach(data.reasons, function (reason) {
              if (reason.value == data.default) {
                reason.selected = true;
              }
            });

          }

          //if (s != undefined && previousSamples.length > 0) {
          //  data.value = calculateAvg(s, data.name);
          //}
          //else
          if (default_value !== undefined) {
            data.value = Number(default_value);
          }

          if (dataModel.ds.groups.indexOf(valueType) === -1) {
            this.ds.groups.push(valueType);
          }
          dataModel.ds.data.push(data);

        } else if (_index !== -1) {
          // _enum or _limit
          var groupCategory = vType.substr(0, _index).toLocaleLowerCase();

          //check if it needs to add a new index for the group
          if (typeof subgroupIndexer[groupCategory] === "undefined") {
            subgroupIndexer[groupCategory] = 0;
          }

          if (valueType === "_enum") {

            for (var k = 0; k < value.descriptors.length; k++) {
              addEnums(value.descriptors[k].value, ++subgroupIndexer[groupCategory], groupCategory, valueType, reference, value.descriptors[k].default, adjustedValue, s);
            }

          } else {
            data.title = vName;
            //data.screen = screenIndex;
            data.group = groupCategory;
            data.name = groupCategory + "_" + ++subgroupIndexer[groupCategory];
            data.validity.type = valueType;
            data.reference = reference;
            data.default = default_value;
            data.optional = isOptional;
            //
            //if (s != undefined && previousSamples.length > 0) {
            //  data.value = calculateAvg(s, data.name);
            //}
            //else
            if (default_value !== undefined) {
              data.value = Number(default_value);
            }

            dataModel.ds.data.push(data);
          }

        } else {
          data.title = vName;
          //data.screen = screenIndex;
          data.group = "";
          data.name = vName.toLocaleLowerCase();
          data.validity.type = valueType;
          data.optional = isOptional;

          if (valueType == "enum") {
            //enum
            data.validity.options = value.descriptors;

            //if (s != undefined && previousSamples.length > 0) {
            //  data.value = calculateEnumAvg(s, data.name, value.descriptors, mode);
            //}
            //else
            if (default_value !== undefined) {
              data.value = default_value;
            }

          } else {
            //range

            //if (s != undefined && previousSamples.length > 0) {
            //  data.value = calculateAvg(s, data.name);
            //}
            //else
            if (default_value !== undefined) {
              data.value = Number(default_value);
            }

            data.validity.percentage = isPercentage;

            data.validity.range = value.descriptors;
          }

          dataModel.ds.data.push(data);
        }
      }
    }

    /**
     * Eval the given options and set the corresponding parameters
     * @param options
     */
    function evalOptions(options) {

      if (options !== undefined) {

        options.forEach(function (option) {

          var opt = option.split(' ');

          if (opt[0] === 'avg' || opt[0] === 'mode') {
            mode = opt[0];
            s = opt[1];
          }

          if (opt[0] === 'adjust') {
            adjustedValue = opt[1];
          }

          if (opt[0] === 'percentage') {
            isPercentage = true;
          }

          if (opt[0] === 'optional') {
            isOptional = true;
          }

        });
      }
    }

    /**
     * Calculates the average of the given family value using s amount of previous samples
     * @param s
     * @param family
     * @returns {number}
     */
    function calculateAvg(s, family) {

      var total = 0;

      previousSamples.sort(function (a, b) {
        return (new Date(b.creationDate)).getTime() - (new Date(a.creationDate)).getTime()
      });

      for (var i = 0; i <= Math.min(s - 1, previousSamples.length - 1); i++) {
        for (var j = 0; j <= previousSamples[i].properties.length - 1; j++) {
          if (previousSamples[i].properties[j].family !== undefined && previousSamples[i].properties[j].family === family) {
            total = total + previousSamples[i].properties[j].value;
          }
        }
      }

      return Math.round(total / (Math.min(s, previousSamples.length)));
    }

    /**
     * Calculates the average of the given family value using s amount of previous samples
     * @param s
     * @param family
     * @param descriptors
     * @param mode
     * @returns {*}
     */
    function calculateEnumAvg(s, family, descriptors, mode) {

      var i = 0, j = 0, total = 0;
      var totals = [];

      previousSamples.sort(function (a, b) {
        return (new Date(b.creationDate)).getTime() - (new Date(a.creationDate)).getTime()
      });

      //assign a value from 1 to descriptors.length to each enum list's member , then calculates the avg using this value
      if (mode === 'avg') {

        for (i = 0; i <= Math.min(s - 1, previousSamples.length - 1); i++) {
          for (j = 0; j <= previousSamples[i].properties.length - 1; j++) {
            if (previousSamples[i].properties[j].family !== undefined && previousSamples[i].properties[j].family === family) {
              total = total + lodash.findIndex(descriptors, {"value": previousSamples[i].properties[j].value}) + 1;
            }
          }
        }

        return Math.round(total / (Math.min(s, previousSamples.length))) - 1;

      }

      //looks for the most used enum list's member
      if (mode === 'mode') {

        for (i = 0; i <= Math.min(s - 1, previousSamples.length - 1); i++) {
          for (j = 0; j <= previousSamples[i].properties.length - 1; j++) {
            if (previousSamples[i].properties[j].family !== undefined && previousSamples[i].properties[j].family === family) {
              if (totals.map(function (e) {
                  return e[0];
                }).indexOf(previousSamples[i].properties[j].value) == -1) {
                totals.push([previousSamples[i].properties[j].value, 1]);
              }
              else {
                totals[totals.map(function (e) {
                  return e[0];
                }).indexOf(previousSamples[i].properties[j].value)][1]++;
              }
            }
          }
        }

        totals.sort(function (a, b) {
          return b[1] - a[1]
        });
        return lodash.findIndex(descriptors, {"value": totals[0][0]});

      }

    }

    /**
     * Adds an enum value
     * @param value
     * @param groupIndex
     * @param groupCategory
     * @param valueType
     * @param reference
     * @param default_value
     * @param adjustedValue
     * @param s
     */
    function addEnums(value, groupIndex, groupCategory, valueType, reference, default_value, adjustedValue, s) {
      var data = angular.copy(dataObj);
      data.title = value;
      //data.screen = screenIndex;
      data.group = groupCategory;
      data.name = groupCategory + "_" + groupIndex;
      data.validity.type = valueType;
      data.reference = reference;
      data.default = default_value;

      //if (s != undefined && previousSamples.length > 0) {
      //  data.value = calculateAvg(s, data.name);
      //}
      //else
      if (default_value !== undefined) {
        data.value = Number(default_value);
      }

      if (value === adjustedValue) {
        data.adjusted = true;
      }

      dataModel.ds.data.push(data);
    }

  };

  dataModel.getInitialStructure = function (product) {

    this.dynamicDataStructure(product);
    return dataModel.ds;
  };

  dataModel.clearDataModel = function () {
    dataModel.ds = angular.copy(cleanDataModel);
  };

  return dataModel;
}

