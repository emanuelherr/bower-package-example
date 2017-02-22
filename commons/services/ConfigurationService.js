angular
  .module('ocf.services')
  .service('ConfigurationService', ConfigurationService);

ConfigurationService.$inject = ['$rootScope', 'CouchBaseConfig', 'URLManager', 'EnvironmentConfig'];

function ConfigurationService($rootScope, CouchBaseConfig, URLManager, EnvironmentConfig) {

  var cs = this;

  cs.getLoggedUserConfig = getLoggedUserConfig;
  cs.setLoggedUserConfig = setLoggedUserConfig;

  function setLoggedUserConfig(userId, configObject) {
    //TODO
  }

  function getLoggedUserConfig() {
    //TODO: return a real config
    /*********************************************************************************
    /* WARNING, CBLite databases names should always begin with a lowercase letter  **
    *********************************************************************************/
    return {
      "dbName": "user_",
      "syncUrl": CouchBaseConfig.host + CouchBaseConfig.name, //sync gateway url
      "usePouchDB": false,
      "autoSync": true,
      "tagMask": ['330C4DE261100280']
    };
  }



  return cs;
}
