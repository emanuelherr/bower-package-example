angular.module('ocf.services', ['toaster'])
  //
  //.factory('DocumentService', function (SessionService, $rootScope) {
  //
  //
  //  //TODO:set app and type
  //  var baseDocument = {
  //    _id: '', // string
  //    author: '', // string
  //    creationDate: '', // timestamp
  //    lastUpdate: '', // timestamp
  //    type: '', // string lotqc
  //    appName: '', // string LotQC
  //    organizationId: '', // int
  //    locationId: '', // 1546 <-- comes in the configuration document (PH Location)
  //    lastVersion: '', // int 1
  //    content: {},
  //    _deleted: false
  //  };
  //  var document = this;
  //
  //  document.createId = function (docId, docType, appName) {
  //    var user = $rootScope.user;
  //    var sessionID = SessionService.sessionID().sessionId;
  //
  //    return appName + "_" + docType + "_" + docId + "_" + user.username + "-" + sessionID;
  //  };
  //
  //  document.createDocument = function (doc, docType, appName) {
  //    var configObject = SessionService.ocfManager.getApplicationConfig($rootScope.selectedLocation.locationId, appName);
  //    var newDocument = this.baseDocument();
  //    var user = $rootScope.user;
  //
  //    newDocument._id = this.createId(docType,appName);
  //    newDocument.author = user.username;
  //    newDocument.content = angular.copy(doc);
  //    newDocument.creationDate = new Date().getTime();
  //    newDocument.lastUpdate = newDocument.creationDate;
  //    newDocument.lastVersion = 1;
  //    newDocument.organizationId = user.organizationId;
  //    newDocument.type = docType;
  //    newDocument.appName = appName;
  //    newDocument.locationId = $rootScope.selectedLocation.locationId;
  //
  //    return newDocument;
  //  };
  //
  //  document.baseDocument = function () {
  //    return angular.copy(baseDocument);
  //  };
  //
  //  document.generateDocId = function(docType,appName) {
  //    return appName + '_' + docType + '_01';
  //  }
  //
  //  return document;
  //})


  .factory('URLManager', function ($location, EnvironmentConfig, CouchDbConfig, OCFConfig, StagingConfig, PutAwayConfig) {
    var environmentHost = EnvironmentConfig.host + EnvironmentConfig.apiPath;
    var ocfHost = OCFConfig.host + OCFConfig.apiPath + OCFConfig.servicePath;
    //var couchDbHost = CouchDbConfig.host;
    var stagingConfig = StagingConfig.host + StagingConfig.apiPath;
    var putAwayConfig = PutAwayConfig.host + PutAwayConfig.apiPath;

    var resources = {
      session: environmentHost + 'authentication/session',
      //sessionID: ocfHost + 'application/getSessionId/:userID',
      //couchDbSession: couchDbHost + '_session',
      //initialConfig: ocfHost + "application/load/:appId/:locationId",
      applications: ocfHost + "application/access",
      //couchDbUser: couchDbHost + "_users/org.couchdb.user",
      //tagProcess: environmentHost + 'resources/e20receiving/:tagEpc',
      //tagInfo: environmentHost + 'resources/product_profile/produceProfileIdByEPC/:tagEpc',
      //binInfo: environmentHost + 'resources/tag/tagType/:tagEpc',
      ocfConfigurations: ocfHost + 'application/ocf/configurations',
      passwordChange: environmentHost + 'resources/password_change/:organizationId',
      passwordRecover: environmentHost + 'resources/password_recover',
      todayOrders: stagingConfig + 'resource/staging/order/:packhouseId/:appLocationId/:isRefresh',
      selectOrders: stagingConfig + 'resource/staging/selectedOrders',
      getSelectedOrders: stagingConfig + 'resource/staging/product/order/:packhouseId/:appLocationId/:isRefresh',
      closeOrder: stagingConfig + 'resource/staging/order/close/:packhouseId/:appLocationId/:orderId',
      removePallet: stagingConfig + 'resource/staging/pallet/remove/:packhouseId/:appLocationId/:tagEpc/:reason',
      assignPallet: stagingConfig + 'resource/staging/pallet/assign/:packhouseId/:appLocationId/:tagEpc/:assignRemovedPallet',
      unassignPallet: stagingConfig + 'resource/staging/pallet/unassign',
      overridePallet: stagingConfig + 'resource/staging/pallet/override/:packhouseId/:appLocationId/:tagEpc/:orderId',
      stagingConfiguration: stagingConfig + 'resource/staging/configuration',
      pallet: stagingConfig + 'resource/staging/pallet/:packhouseId/:appLocationId/:isRefresh',
      palletDetail: stagingConfig + 'resource/staging/pallet/detail/:packhouseId/:appLocationId/:tagEpc',
      assignPOTag: stagingConfig + 'resource/staging/order/assign/tag/:packhouseId/:appLocationId/:orderId/:tagEpc',
      reopenOrder: stagingConfig + 'resource/staging/order/reopen',
      apiLogMessage : environmentHost + 'resources/app_data_logging',
      grayLogMessage: 'http://192.168.6.38:12201/gelf',
      putAwayConfigurations: putAwayConfig + 'resource/pap/configurations',
      palletInfo: putAwayConfig + 'resource/pap/storage/area/assign/pallet/:tagEpc/packhouse/:packhouseId',
      confirmSA: putAwayConfig + 'resource/pap/storage/area/confirm',
      unassignSA: putAwayConfig + 'resource/pap/storage/area/unassign/pallet',
      language: environmentHost+ 'resources/user/preferences/:userId',
      storageAreaValid: putAwayConfig + 'resource/pap/storage/area/:barCode',
      unknown: environmentHost + 'UNKNOWN_URL'
    };

    return {
      getUrl: function (resource) {
        return resources[resource] ? resources[resource] : resources.unknown;
      }
    };
  })


  .factory('navigateTo', function ($state,$rootScope) {
    return {
      login: function () {
        $state.go('ocf.login');
      },

      home: function () {
        $state.go('ocf.home');
      },

      forgotPassword: function () {
        $state.go('ocf.forgotPassword');
      },

      changePassword: function () {
        $state.go('ocf.changePassword');
      },

      gdc: function () {
        $state.go('ocf.retailer.gdcSelector', {}, { reload: true });
      },

      g10: function () {
        $state.go('ocf.supplier.staging.todayOrders', {}, { reload: true });
      },

      g04: function () {
        $state.go('ocf.supplier.g4.palletDetails', {}, { reload: true });
      },

      stagingFillOrders: function () {
        $state.go('ocf.supplier.staging.fillOrders', {}, { reload: true });
      },

      locationSelector:function () {
        $state.go('ocf.locationSelector', {}, { reload: true });
      },

      retailer: function () {
        if($rootScope.isPilot){
          $state.go('ocf.retailer.baseline.listOfSamplesPilot');
        }
        else{
          $state.go('ocf.retailer.baseline.listOfSamples');
        }
      },
    };
  })


  .factory('encode', function () {
    var encode = this;

    encode.encodeCredentials = function (credentials) {
      return window.btoa(credentials.username + ':' + credentials.password);
    };

    encode.decodeCredentials = function (credentials) {
      return undefined != credentials ? window.atob(credentials).split(":") : false;
    };

    encode.decodeCredentialsAsObject = function (credentials) {
      var usr = encode.decodeCredentials(credentials);
      return {
        username: usr[0],
        password: usr[1]
      };
    };

    return encode;
  })


  .factory('LoadingService', function ($ionicLoading) {
    var loading = null;

    return {
      // Trigger the loading indicator
      show: function (message) {

        // Show the loading overlay and text
        loading = $ionicLoading.show({

          // The text to display in the loading indicator
          template: '<ion-spinner icon="lines"></ion-spinner>' +
          '<div>' + message || 'Loading' + '</div>',

          // The animation to use
          animation: 'fade-in'
          //,
          //
          //// The delay in showing the indicator
          //delay: 500
        });
      },

      // Hide the loading indicator
      hide: function () {
        $ionicLoading.hide();
      }
    };

  })

  .factory('MessageService', function () {
    var messages = {
      information: [],
      success: [],
      warning: [],
      error: []
    };

    var clear = function () {
      messages.information.length = 0;
      messages.success.length = 0;
      messages.warning.length = 0;
      messages.error.length = 0;
    };

    var addMessage = function (type, txt, clearPrevious) {
      if (clearPrevious) {
        clear();
      }
      messages[type].push(txt);
    };

    return {
      getCurrentMessages: function () {
        return messages;
      },

      clear: function () {
        clear();
      },

      addSuccessMessage: function (txt, clearPrevious) {
        addMessage('success', txt, clearPrevious);
      },

      addInformationMessage: function (txt, clearPrevious) {
        addMessage('information', txt, clearPrevious);
      },

      addWarningMessage: function (txt, clearPrevious) {
        addMessage('warning', txt, clearPrevious);
      },

      addErrorMessage: function (txt, clearPrevious) {
        addMessage('error', txt, clearPrevious);
      }
    };
  })


  .factory('SessionService', function ($http, $resource, $state, $window, $q, $timeout, EnvironmentConfig,
                                       SessionConfig, OCFConfig, URLManager, navigateTo, encode,
                                       lodash, $rootScope) {

    var Session = $resource(URLManager.getUrl('session'), {}, {
      loginWS: {
        method: 'GET',
        timeout: EnvironmentConfig.requestTimeout
      }
    });

    var SessionID = $resource(URLManager.getUrl('sessionID'), {}, {
      request: {
        method: 'GET',
        timeout: EnvironmentConfig.requestTimeout
      }
    });

    var Applications = $resource(URLManager.getUrl('applications'), {}, {
      getApps: {
        method: 'GET',
        timeout: EnvironmentConfig.requestTimeout
      }
    });

    Session.login = function (loginData) {
      var q = $q.defer();

      Session.setHeaderLogin(loginData)
        .then(function (headerOk) {
          function loginSuccess(userInformation) {
            q.resolve(userInformation);
          }

          function loginFail(loginFail) {
            var failMessage = {
              status: loginFail.status,
              message: loginFail.message,
              type: 'login'
            };

            if (loginFail.status !== 0) {
              // net::ERR_CONNECTION_TIMED_OUT
              failMessage.message = "Authentication failed. Please try again.";
              if (loginFail.data.message == "java.lang.Exception: Credentials Expired. Contact System Support."){
                failMessage.message = "Credentials Expired. Contact System Support.";
              }
            }

            q.reject(failMessage);
          }

          Session.loginWS({appLocations: true}, loginSuccess, loginFail);

        });
      return q.promise;
    };

    Session.getSessionID = function (loginData, loginInfo) {
      var q = $q.defer();

      Session.setHeaderCommon()
        .then(function (headerOk) {

          function sessionSuccess(sessionID) {
            q.resolve(sessionID);
          }

          function sessionFail(sessionFail) {
            var failMessage = {
              status: sessionFail.status,
              message: sessionFail.message,
              type: 'session'
            };

            if (sessionFail.status !== 0) {
              // net::ERR_CONNECTION_TIMED_OUT
              failMessage.message = "Authentication failed. Please try again.";
            }

            q.reject(failMessage);
          }

          SessionID.request({userID: loginInfo.id}, sessionSuccess, sessionFail);

        });
      return q.promise;
    };

    Session.sessionID = function () {
      return JSON.parse($window.localStorage.getItem("sessionID"));
    };

    Session.setSessionID = function (sessionID) {
      $window.localStorage.setItem("sessionID", JSON.stringify(sessionID));
    };

    // Deprecated
    Session.setHeader = function (loginData) {
      function setHeader(loginData) {
        var encoded = encode.encodeCredentials(loginData);
        $http.defaults.headers.common.Authorization = "Basic " + encoded;

        return $http.defaults.headers.common.Authorization;
      }

      return $q.when(setHeader(loginData));
    };

    Session.setHeaderLogin = function (loginData) {
      function setHeaderLogin(loginData) {
        var encoded = encode.encodeCredentials(loginData);
        $http.defaults.headers.common.ZestAppName = "Shipping";
        $http.defaults.headers.common.Authorization = "Basic " + encoded;
        $http.defaults.headers.common.ZestSessionId = undefined;

        return $http.defaults.headers.common.Authorization;
      }

      return $q.when(setHeaderLogin(loginData));
    };

    Session.getZestSessionId = function () {
      var userData = Session.getUserData($rootScope.user.id);
      return userData.sessionId;
    }

    Session.setHeaderCommon = function () {
      function setHeaderCommon() {

        var userData = Session.getUserData($rootScope.user.id);

        $http.defaults.headers.common.Authorization = undefined;
        $http.defaults.headers.common.ZestAppName = "Shipping";
        $http.defaults.headers.common.ZestSessionId = userData.sessionId;

        return $http.defaults.headers.common.ZestSessionId;
      }

      return $q.when(setHeaderCommon());
    };

    Session.isSignedIn = function () {
      return !!$window.localStorage[SessionConfig.cookieName];
    };

    Session.setLoggedUserId = function (userId) {
      $window.localStorage.setItem("loggedUser", JSON.stringify(userId));
    };

    Session.clearLoggedUser = function () {
      $window.localStorage.setItem("loggedUser", "");
    };

    Session.getLoggedUserId = function () {
      return JSON.parse($window.localStorage.getItem("loggedUser"));
    };

    Session.getApplicationsList = function () {
      var q = $q.defer();

      function appsSuccess(userApps) {
        q.resolve(userApps.applications);
      }

      function appsFail(loginFail) {
        //var failMessage = {
        //  status: loginFail.status,
        //  message: loginFail.message,
        //  type: 'login'
        //};
        console.log(loginFail);
        //if (loginFail.status !== 0) {
        //  // net::ERR_CONNECTION_TIMED_OUT
        //  failMessage.message = "Authentication failed. Please try again.";
        //}

        q.reject();
      }

      Applications.getApps(appsSuccess, appsFail);

      return q.promise;
    };

    Session.setUserApplications = function (appsList) {
      var userData = Session.getUserData($rootScope.user.id);
      userData.apps = appsList;
      Session.setUserData(userData);
    };

    Session.getUserApplications = function (userId) {
      return Session.getUserData(userId).apps;
    };

    Session.clearCredentials = function () {
      var q = $q.defer();

      function cleaner() {
        $window.localStorage.removeItem(SessionConfig.cookieName);
        //$window.localStorage.removeItem(SessionConfig.userInformation);
        Session.clearLoggedUser()
        return true;
      }

      q.resolve(cleaner());

      return q.promise;
    };

    //Session.securityCheck = function () {
    //  if (!Session.isSignedIn()) {
    //    Session.clearCredentials()
    //      .then(function (success) {
    //        navigateTo.login();
    //      });
    //
    //  } else {
    //    var sessionData = Session.getSessionData();
    //    var loginData = encode.decodeCredentialsAsObject(sessionData);
    //
    //    if (angular.equals(pouchLocalDB.get(), {}) || typeof pouchLocalDB.get() !== "undefined") {
    //      var adapter = window.sqlitePlugin ? {adapter: 'websql'} : {};
    //      pouchLocalDB.set(new PouchDB('ocf', adapter));
    //    }
    //
    //    Session.setHeader(loginData);
    //  }
    //};

    Session.setCredentials = function (loginData, userInformation) {
      var encoded = encode.encodeCredentials(loginData);
      var sessionInfo = {
        sessionId: encoded,
        createdDate: Date.now(),
        status: ''
      };
      //change the username to be able to push docs to couchdb
      userInformation.username = loginData.username;

      $window.localStorage.setItem(SessionConfig.cookieName, JSON.stringify(sessionInfo));
      //$window.localStorage.setItem(SessionConfig.userInformation, JSON.stringify(userInfo));
    };

    Session.getSessionData = function () {
      return JSON.parse($window.localStorage.getItem(SessionConfig.cookieName));
    };

    Session.getUserLocations = function (userId) {
      var userData = Session.getUserData(userId);
      if (userData) {
        return userData.locations;
      }
    };

    Session.getUserData = function (userId) {
      var usersData = JSON.parse($window.localStorage.getItem("userInformation"));
      return lodash.find(usersData, function (userInfo) {
        return userInfo.id == userId;
      })
    };

    Session.setUserData = function (userData) {
      var usersData = JSON.parse($window.localStorage.getItem("userInformation"));
      var foundUserIndex = lodash.findIndex(usersData, function (userInfo) {
        return userInfo.id == userData.id;
      });

      if (foundUserIndex !== -1) {
        usersData[foundUserIndex] = userData;
      }
      else {
        if (usersData === null) {
          usersData = [];
        }
        usersData.push(userData);
      }

      $window.localStorage.setItem(SessionConfig.userInformation, JSON.stringify(usersData));
    };

    Session.setSession = function (loginData) {
      var encoded = encode.encodeCredentials(loginData);
      var sessionInfo = {
        sessionId: encoded,
        createdDate: new Date().getTime(),
        status: ''
      };
      $window.localStorage.setItem(SessionConfig.cookieName, JSON.stringify(sessionInfo));
    };

    Session.destroy = function () {
      $window.localStorage.removeItem(SessionConfig.cookieName);
    };

    Session.updateSessionStatus = function (status) {
      var sessionData = Session.getSessionData();
      sessionData.status = status;
      $window.localStorage[SessionConfig.cookieName] = JSON.stringify(sessionData);

    };

    Session.setLoggedOffline = function () {
      Session.updateSessionStatus("loggedOffline");
    };

    Session.setSessionExpired = function () {
      Session.updateSessionStatus("sessionExpired");
    };

    Session.setLoggedOnline = function () {
      Session.updateSessionStatus("loggedOnline");
    };

    Session.setLoggingOut = function () {
      Session.updateSessionStatus("loggingOut");
    };

    Session.setLoggedOut = function () {
      Session.updateSessionStatus("loggedOut");
    };

    //Session.offlineLogin = function (loginData) {
    //  var q = $q.defer();
    //  //TODO: implement a secure offline login mechanism
    //  var userData = Session.getUserData();
    //  var appConfig = Session.ocfManager.getApplicationConfig($rootScope.selectedLocation.locationId, $rootScope.appName);
    //
    //  //verify that the user exists in the device and that
    //  if (!!userData) {
    //    if (loginData.username.toUpperCase() == userData.userInfo.username.toUpperCase() && appConfig !== null) {
    //      console.log("Offline login successful");
    //      Session.setSession(loginData);
    //      Session.setLoggedOffline();
    //      q.resolve(true);
    //    } else {
    //      var warnMsg = "The current user is not the one related to the device or his data has changed. Online login is required";
    //      //TODO: implement a popup / message to inform that an online login is required.
    //      q.reject(warnMsg);
    //    }
    //  } else {
    //    q.reject(false);
    //  }
    //
    //  return q.promise;
    //};

    Session.ocfManager = {
      applicationConfig: function (loginData, appList, locationsList) {

        var userData = Session.getUserData($rootScope.user.id);

        var makeRequest = function (loginData, app, locationId) {
          var q = $q.defer();
          //var encodedData = encode.encodeCredentials(loginData);

          var initialConfig = $resource(URLManager.getUrl('initialConfig'), {}, {
            getConfigs: {
              method: 'GET',
              //headers: {'Authorization': "Basic " + encodedData}
              headers: {
                'ZestAppName': 'Shipping',
                'ZestSessionId': userData.sessionId
              }
            }
          });

          function storeAppConfig(configObject) {
            var configArray = JSON.parse($window.localStorage.getItem(OCFConfig.configObject));
            if (configArray == null) {
              configArray = [];
              configArray.push(configObject);
            }
            else {
              //check if there's already a config for the app and the location
              var config = lodash.find(configArray, function (config) {
                return config.appName == configObject.appName && config.locationId == locationId;
              });
              //if it exists, update it
              if (config) {
                var index = lodash.indexOf(configArray, config);
                configArray[index] = angular.copy(configObject);
              }
              else {
                configArray.push(configObject);
              }
            }
            $window.localStorage.setItem(OCFConfig.configObject, JSON.stringify(configArray));
            return configObject;
          }

          function appConfigSuccess(success) {
            var appConfig = {
              appName: app.appCacheName,
              config: success,
              locationId: locationId
            };
            return q.resolve(storeAppConfig(appConfig));
          }

          function appConfigFail(fail) {
            var failMessage = {
              status: fail.status,
              message: "Configurations: ",
              type: 'appConfig'
            };

            if (fail.status === 0) {
              // net::ERR_CONNECTION_TIMED_OUT
              failMessage.message += "Connection failed.";
            } else {
              failMessage.message += fail.data.reason;
            }

            return q.reject(failMessage);
          }

          initialConfig.getConfigs({appId: app.appCacheName, locationId: locationId}, appConfigSuccess, appConfigFail);

          return q.promise;
        };

        var promises = [];

        if (!locationsList) {
          var failMessage = {
            status: 99,
            message: "User not assigned to any location.",
            type: 'location'
          };

          return $q.reject(failMessage);

        }

        for (var j = 0; j < locationsList.length; j++) {
          var location = locationsList[j];
          for (var i = 0; i < appList.length; i++) {
            promises.push(makeRequest(loginData, appList[i], location.locationId))
          }
        }
        return $q.allSettled(promises);

      },

      getApplicationConfig: function (locationId, appName) {
        return lodash.find(JSON.parse($window.localStorage.getItem(OCFConfig.configObject)), function (config) {
          return config.appName == appName.toLowerCase() && config.locationId == locationId;
        });
      }
    };

    Session.remoteStorage = {
      userExist: function (loginData) {
        loginData.username = loginData.username.toUpperCase();
        var q = $q.defer();
        var encodedData = encode.encodeCredentials(loginData);
        var cdb = $resource(URLManager.getUrl('couchDbSession'), {}, {
          checkSession: {
            method: 'GET',
            headers: {'Authorization': "Basic " + encodedData}
          }
        });

        function sessionSuccess(success) {
          return q.resolve(success);
        }

        function sessionFail(fail) {
          var failMessage = {
            status: fail.status,
            message: "Remote Storage: ",
            type: 'remoteStorage'
          };

          if (fail.status === 0) {
            // net::ERR_CONNECTION_TIMED_OUT
            failMessage.message += "Connection failed.";
          } else {
            failMessage.message += fail.data.reason;
          }

          return q.reject(failMessage);
        }


        cdb.checkSession(sessionSuccess, sessionFail);


        return q.promise;
      },

      userCanAccessDatabase: function (loginData, appList, orgId) {


        var makeRequest = function (loginData, app, orgId) {
          var organizationId = orgId;
          var database;
          database = app.appCacheName + '_' + organizationId;

          var q = $q.defer();
          var encodedData = encode.encodeCredentials(loginData);
          var cDbHost = CouchDbConfig.host + database;

          var cdb = $resource(cDbHost, {}, {
            checkSession: {
              method: 'GET',
              headers: {'Authorization': "Basic " + encodedData}
            }
          });

          function sessionSuccess(success) {
            return q.resolve();
          }

          function sessionFail(fail) {
            return q.resolve();
          }

          cdb.checkSession(sessionSuccess, sessionFail);

          return q.promise;

        };


        var promises = [];

        for (var i = 0; i < appList.length; i++) {
          promises.push(makeRequest(loginData, appList[i], orgId))
        }

        return $q.allSettled(promises);

      }
    };

    return Session;
  })

  .factory('pouchLocalDB', function ($q) {
    var db = {
      localDB: null
    };
    var deferred = $q.defer();

    db.set = function (localDB) {
      if (this.localDB === null) {
        this.localDB = localDB;
        deferred.resolve("success");

      } else {
        deferred.reject("fail");
      }

      return deferred.promise;
    };

    db.get = function () {
      return this.localDB;
    };

    return db;
  })

  .factory('InitializationService', function ($q) {

    //pouchLocalDB.set(pouchDB(PouchConfig.pouchdbName));
    //
    //var db = pouchLocalDB.get();

    var initialization = {};

    //initialization.getAllDocsFromPouch = function () {
    //  return db.allDocs({
    //    include_docs: true
    //  });
    //};

    return initialization;


  })


  .factory('ReplicationService', function ($q, $rootScope, $timeout, CouchDbConfig, SessionService, PersistenceConfig,
                                           pouchLocalDB) {
    var ReplicationService = this;

    ReplicationService.updateStatus = function (message) {
      $timeout(function () {
        $rootScope.$apply(function () {
          $rootScope.isSynchronized = message;
        });
      });
    };

    ReplicationService.retryReplication = function (sessionData) {
      var localDB = pouchLocalDB.get();
      var sessionInformation = $rootScope.user;
      var organizationId = sessionInformation.organizationId;

      if (localDB._db_name) {
        var cHost = CouchDbConfig.host.split("//");
        var cdb = cHost[0] + "//" + sessionInformation.username + ":" + sessionData.password + "@" + cHost[1];
        return localDB.replicate.to(cdb + "lotqc_" + organizationId);
      }
    };

    ReplicationService.liveReplicate = function (sessionData) {
      var localDB = pouchLocalDB.get();
      var sessionInformation = $rootScope.user;
      var organizationId = sessionInformation.organizationId;

      if (localDB._db_name) {
        var cHost = CouchDbConfig.host.split("//");
        var cdb = cHost[0] + "//" + sessionInformation.username + ":" + sessionData.password + "@" + cHost[1];
        return localDB.replicate.to(cdb + "lotqc_" + organizationId, {
          live: true
        });
      }
    };

    //TODO:refactor this method to use the current DB
    ReplicationService.sync = function (sessionData) {
      var localDB = pouchLocalDB.get();
      var sessionInformation = $rootScope.user;
      var organizationId = sessionInformation.organizationId;

      if (localDB._db_name) {
        var cHost = CouchDbConfig.host.split("//");
        var cdb = cHost[0] + "//" + sessionInformation.username + ":" + sessionData.password + "@" + cHost[1];
        return localDB.sync(cdb + "lotqc_" + organizationId, {
          live: true
        });
      }
    };

    ReplicationService.garbageCollector = function () {
      // TODO: Implement a method to clear the MC of the tombstones that PouchDB creates.
      console.log("Garbage collector called");
      var localDB = pouchLocalDB.get();
      var deferred = $q.defer();

      if (localDB._db_name) {
        // Try to replicate the documents first
        this.retryReplication();

        // Then get all the documents from PouchDB and validate the updated/created date
        localDB.allDocs({
          include_docs: true,
          descending: true
        }, function (error, response) {
          if (!error) {
            var todayTime = Date.now();

            response.rows.forEach(function (element) {
              // By default use the date when document was created
              var lastDocDate = element.doc.createDate;
              // TODO: in case that the Business Logic uses the last updated date to decide if the document is old enough
              //if(element.doc.modificationDate){
              //    lastDocDate = element.doc.modificationDate;
              //}
              if (lastDocDate) {
                var daysDiff = ( todayTime - lastDocDate) / (24 * 3600 * 1000);
                // remove the document if the days diff exceeds the configuration setting
                if (daysDiff >= PersistenceConfig.daysToLive) {

                  localDB.remove(element.doc);

                  console.log("Element removed");
                }
              }
            });
            deferred.resolve("success");
          }

          if (error) {
            deferred.reject(error);
          }
        });
      }

      return deferred.promise;
    };

    return ReplicationService;
  })

  .factory('StagingConfigurationService', function ($q, EnvironmentConfig, URLManager, $resource, $log) {

    var StagingConfigurationService = this;

    StagingConfigurationService.getStagingConfiguration = function () {
      var q = $q.defer();
      var request = $resource(URLManager.getUrl('stagingConfiguration'), {}, {
        getStagingConfiguration: {
          method: 'GET',
          timeout: EnvironmentConfig.requestTimeout
        }
      });

      function success(configuration) {
        $log.debug("Configuration retrieved");
        q.resolve(configuration);
      }

      function error(error) {
        $log.error("Configuration retrieval failed " + error);
        q.reject(error);
      }

      request.getStagingConfiguration({}, success, error);

      return q.promise;
    };

    return StagingConfigurationService;
  }).factory('UserPreferenceService', function ($q, EnvironmentConfig, URLManager, $resource, $log) {

    var UserPreferenceService = this;

    UserPreferenceService.getUserPreference = function (userId) {
      var q = $q.defer();
      var request = $resource(URLManager.getUrl('language'), {}, {
        getUserPreference: {
          method: 'GET',
          timeout: EnvironmentConfig.requestTimeout
        }
      });

      function success(configuration) {
        $log.debug("User Configuration retrieved");
        q.resolve(configuration);
      }

      function error(error) {
        $log.error("User Configuration retrieval failed " + error);
        q.reject(error);
      }

      request.getUserPreference({'userId':userId}, success, error);

      return q.promise;
    };

    UserPreferenceService.setUserPreference = function (userId, preferences) {
      var q = $q.defer();
      var request = $resource(URLManager.getUrl('language'), {'userId':userId}, {
        setUserPreference: {
          method: 'PUT',
          timeout: EnvironmentConfig.requestTimeout
        }
      });

      function success(configuration) {
        $log.debug("User Configuration setted");
        q.resolve(configuration);
      }

      function error(error) {
        $log.error("User Configuration setted failed " + error);
        q.reject(error);
      }

      request.setUserPreference(preferences, success, error);

      return q.promise;
    };

    return UserPreferenceService;
  })
  .factory('LoggingService', function (URLManager, EnvironmentConfig, $q, $log, $resource, $rootScope, $interval) {

    var logMessageGrayLog = function (app, context, action, message, result, metadata) {

      var data = {
        version: "1.1",
        host: EnvironmentConfig.env,
        short_message: message,
        //timestamp: (new Date()).toISOString(),
        full_message: JSON.stringify(metadata),
        action: action,
        result: result,
        _environment: app,
        _facility: "G10",
        _context: context
      };

      jQuery.ajax({
        url: URLManager.getUrl('grayLogMessage'),
        type: 'POST',
        data: JSON.stringify(data),

        success: function (response) {
          $log.debug("Log successfully sent");
        },

        error: function (response) {
          $log.debug("Couldn't send log " + JSON.stringify(data));
        }
      });
    };

    // metadata should be a list as [{"key":"attribute","value":"message"},...]
    var logMessage = function (data) {
      var q = $q.defer();
      var request = $resource(URLManager.getUrl('apiLogMessage'), {}, {
        logMessage: {
          method: 'POST',
          timeout: EnvironmentConfig.requestTimeout
        }
      });

      function success(response) {
        $rootScope.logsBlocked = false;
        $log.debug("Log saved");
        q.resolve(response);
      }

      function error(error) {
        $rootScope.logsBlocked = false;
        $log.debug("Error saving log " + error);
        q.reject(error);
      }

      request.logMessage(data, success, error);

      return q.promise;
    };

    var saveLogToSend = function (app, context, action, message, result, metadata) {

      if (!(Object.prototype.toString.call(metadata) === '[object Array]')) {
        metadata = [];
      }

      if (window.cordova) {
        var device = {
          id: window.device.serial,
          android: window.navigator.appVersion
        };
        var deviceMetadata = {
          key: "device",
          value: JSON.stringify(device)
        };

        metadata.push(deviceMetadata);
      }

      var appVersion = $rootScope.appVersion;

      var appVersionMetadata = {
        key: "application_version",
        value: appVersion
      };

      metadata.push(appVersionMetadata);

      metadata.push({
        "key": "message",
        "value": message
      });

      metadata.push({
        "key": "context",
        "value": context
      });
      var data = {
        "host": EnvironmentConfig.env,
        "action": action,
        "result": result,
        "_environment": app,
        "_facility": "OCF",
        "full_message": metadata
      };

      $rootScope.logsToSend.push(data);
    };

    var CONSTANTS = {
      "APP": {
        "OCF_DATA_RECOVER": "OCF_Data_Recover",
        "OCF_LOGIN": "OCF_Login",
        "OCF_APP_SELECTOR":"OCF_App_Selector",
        "OCF_LOCATION_SELECTOR":"OCF_Location_Selector",
        "G10":"G10",
        "G04":"G4"
      },
      CONTEXT: {
        "ON_PAUSE":"On_Pause",
        "ON_RESUME":"On_Resume",
        "ON_DEVICE_READY":"On_Device_Ready",
        "ON_DATA_RECOVERING":"On_Data_Recovering",
        "LOGIN_CONTROLLER":"Login_Controller",
        "LOCATION_CONTROLLER":"Location_Controller",
        "TODAY_ORDER_CONTROLLER" : "Today_Order_Controller",
        "FILL_ORDER_CONTROLLER" : "Fill_Order_Controller",
        "ASSIGN_PALLET_POPUP" : "Assign_Pallet_Popup",
        "REMOVE_PALLET_POPUP" : "Remove_Pallet_Popup",
        "REOPEN_ORDER_POPUP" : "Reopen_Order_Popup",
        "SELECT_ORDER_POPUP" : "Select_Order_Popup",
        "EVENT_HANDLER_SERVICE": "Event_Handler_Service",
        "PUT_AWAY_CONTROLLER": "Put_Away_Controller"
      }
    };

    if(!$rootScope.logsToSend) {
      $rootScope.logsToSend = [];
    }

    $rootScope.logsBlocked = false;

    if(sendLog) {
      $interval.cancel(sendLog);
    }

    var sendLog = $interval(function () {

      if(!$rootScope.logsBlocked && $rootScope.logsToSend.length > 0) {
        $rootScope.logsBlocked = true;

        // Send the first element of the array and remove it
        logMessage($rootScope.logsToSend.shift());
      }

    }, 500);

    return {
      logMessageGrayLog: function (app, context, action, message, result, metadata) {
        logMessageGrayLog(app, context, action, message, result, metadata);
        $log.info(app + " - " + context + " - " + action + " - " + message + " - " + result + " - " + JSON.stringify(metadata));
      },
      logMessage: function (app, context, action, message, result, metadata, toZest) {

        toZest = toZest != undefined ? toZest : true;

        if(toZest) {
          saveLogToSend(app, context, action, message, result, metadata);
        }

        console.log(app + " - " + context + " - " + action + " - " + message + " - " + result + " - " + JSON.stringify(metadata));
      },
      CONSTANTS: CONSTANTS
    };
  })
  .factory('LockService', function($log) {
    var _fields = {};
    var _methods = {};

    _fields.lockList = [];

    _methods.lock = function(lock) {
      if (!_methods.isLocked(lock)) {
        $log.info('LockService | Locking with key [' + lock + ']');
        _fields.lockList.push({ id: lock });
      }
      $log.info('LockService | Lock list [' + JSON.stringify(_fields.lockList) + ']');
    };

    _methods.release = function(lock) {
      $log.info('LockService | Releasing lock with key [' + lock + ']');
      for (var i = 0; i < _fields.lockList.length; i++) {
        if (typeof _fields.lockList[i] == 'object' && typeof _fields.lockList[i].id != 'undefined' && _fields.lockList[i].id == lock) {
          _fields.lockList.splice(i, 1);
        }
      }
      $log.info('LockService | Lock list [' + JSON.stringify(_fields.lockList) + ']');
    };

    _methods.isLocked = function(lock) {
      var lockItem = _.find(_fields.lockList, function(lockLookup) { return lockLookup.id == lock });
      var isLocked = typeof lockItem == 'object' && typeof lockItem.id != 'undefined' && lockItem.id == lock;
      $log.info('LockService | Verifying if key [' + lock + '] is locked | ' + lock + ' [' + isLocked.toString() + ']');
      return isLocked;
    };

    _methods.areLocked = function(lockList) {
      if (!_.isArray(lockList)) {
        return false;
      }
      for (var i = 0; i < lockList.length; i++) {
        if (!_methods.isLocked(lockList[i])) {
          return false;
        }
      }
      return true;
    };

    return {
      lock: _methods.lock,
      release: _methods.release,
      isLocked: _methods.isLocked,
      areLocked: _methods.areLocked
    };
  })

  .factory('EventHandlerService', function ($timeout, $log, LoggingService) {
    /**
     * event = {
     *      trigger: function() {}, // it should return a promise to be used for the EH
     *      execState: ""
     * }
     */

    var _loggingStates = {
      app: '',
      context: ''
    };
    var _currentState;
    var _queue = [];

    _trigger();

    return {
      setCurrentState: function(currentState) {
        _setCurrentState(currentState);
      },
      enqueue: function(event) {
        _enqueue(event);
      },
      setLoggingState: function (app, context) {
        _setLoggingState(app, context);
      }
    };

    function _enqueue(event) {
      $log.debug('_enqueue', JSON.stringify(event), JSON.stringify(_queue), JSON.stringify(_loggingStates));
      if (event.agnostic) event.execState = _currentState;
      _queue.push(event);
    }

    function _clearQueue() {
      $log.debug('_clearQueue');
      _queue = [];
    }

    function _setCurrentState(currentState) {
      $log.debug('_setCurrentState', 'target:', currentState, 'current:', _currentState, JSON.stringify(_loggingStates));

      if (currentState) {
        _clearQueue();
        _currentState = currentState;
      }
    }

    function _trigger(value) {
      var event = _queue.shift();

      if (event && (angular.isArray(event.execState) && event.execState.indexOf(_currentState) != -1 || event.execState == _currentState)) {
        $log.debug('before event.trigger()', JSON.stringify(event), JSON.stringify(_loggingStates));

        event.trigger()
          .then(_setCurrentState)
          .catch(_setCurrentState)
          .finally(_trigger);

      } else {
        $timeout(_trigger, 64);
      }
    }

    function _setLoggingState(app, context) {
      if (app && context) {
        _loggingStates.app = LoggingService.CONSTANTS.APP[app];
        _loggingStates.context = LoggingService.CONSTANTS.CONTEXT[context];

      } else {
        _loggingStates.app = '';
        _loggingStates.context = '';
      }
    }
  })

  .factory('TimeoutLockService', function($log, toaster, $translate) {
      var _fields = {};
      var _methods = {};
      var message = "Application busy";
      $translate('OCF.APPLICATION_BUSY.MESSAGE').then(function (result) {
        message = result;
      });

      _fields.serviceName = 'TimeoutLockService';
      _fields.lastLock = 0;

      _methods.now = function() {
        return new Date().getTime();
      };

      _methods.getLockTimeout = function() {
        /**
         * Lock timeout in milliseconds
         * @type {number}
         */
        var lockTimeout = 500;
        //TODO: Get lock timeout from configuration

        $log.info(_fields.serviceName + ' | Lock timeout read from configuration [' + lockTimeout + ']');

        return lockTimeout;
      };

      _methods.lock = function() {
        $log.info(_fields.serviceName + ' | Activating locking for ' + _methods.getLockTimeout() + ' milliseconds');
        _fields.lastLock = _methods.now();
      };

      _methods.displayAppBusyToaster = function() {
        $log.debug(_fields.serviceName + ' | Displaying toaster message');
        $translate('OCF.APPLICATION_BUSY.MESSAGE').then(function (result) {
          message = result;
          toaster.pop({
            type: 'error',
            body: message,
            timeout: 5000,
            showCloseButton: true
          });
        });
      };

      _methods.isLocked = function() {
        if ((_fields.lastLock + _methods.getLockTimeout()) >= _methods.now()) {
          // Lock active
          $log.info(_fields.serviceName + ' | Lock is active');
          _methods.displayAppBusyToaster();
          return true;
        } else {
          // Lock not active
          $log.info(_fields.serviceName + ' | Lock is not active');
          _methods.lock();
          return false;
        }
      };

      return {
        isLocked: _methods.isLocked
      };
    })

  .factory('OCFConfigurationService', function ($resource, $q, $rootScope, $window, $log, URLManager, EnvironmentConfig) {
    var OCFConfigs = $resource(URLManager.getUrl('ocfConfigurations'), {}, {
      getConfigs: {
        method: 'GET',
        timeout: EnvironmentConfig.requestTimeout
      }
    });

    var configs = this;

    configs.retrieveConfigs = _retrieveConfigs;
    configs.getOcfConfigs = _getOcfConfigs;

    return configs;

    /////////////////////////////
    function _retrieveConfigs() {
      return $q(function (resolve, reject) {
        OCFConfigs.getConfigs({}, _success, _fail);

        function _success(ocfConfigs) {
          $window.localStorage.setItem("ocfConfigs", JSON.stringify(ocfConfigs));
          resolve(ocfConfigs);
        }

        function _fail(error) {
          $log.error("OCF Configuration Retrieve failed", error);
          resolve({});
        }
      });
    }

    function _getOcfConfigs() {
      var ocfConfigs = $window.localStorage.getItem("ocfConfigs");

      return ocfConfigs ? JSON.parse(ocfConfigs) : {};
    }
  })

  .factory('StorageService', function ($resource, URLManager,EnvironmentConfig){
    var storageService = {
      validStorageArea: validStorageArea
    };
    function validStorageArea(barCode){
      var request = $resource(URLManager.getUrl('storageAreaValid'), {}, {
        validateStorageArea: {
          method: 'GET',
          timeout: EnvironmentConfig.requestTimeout
        }
      });
      var valid = request.validateStorageArea({'barCode':barCode});

      return valid.$promise;
    };
    return storageService;
  })

  //
  //.service('ScanService', function ($rootScope, $timeout) {
  //
  //  var ss = {};
  //
  //
  //  //initializes the scan and sets the activity to send the intent to
  //  ss.initialize = function (activityName) {
  //
  //    console.log(window.datawedge);
  //
  //    if (window.datawedge) {
  //      var activity = activityName ? activityName : "com.bluefletch.motorola.datawedge.ACTION"; //default activity name
  //
  //      console.log(activityName);
  //
  //      datawedge.start();
  //
  //      $timeout(function () {
  //        datawedge.registerForBarcode(function (data) {
  //          console.log("dataWedgeScan - broadcast");
  //
  //          $rootScope.$broadcast('dataWedgeScan', data.barcode);
  //        });
  //
  //      }, 300)
  //
  //    }
  //  };
  //
  //  return ss;
  //})


;

