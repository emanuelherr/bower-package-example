angular
  .module('ocf.services')
  .service('DataLayerService', DataLayerService);

DataLayerService.$inject = ['$q', 'ConfigurationService', '$window', '$log', 'CouchDbConfig', '$rootScope', 'SessionService'];

function DataLayerService($q, ConfigurationService, $window, $log, CouchDbConfig, $rootScope, SessionService) {

  var dls = this;
  var config = ConfigurationService.getLoggedUserConfig();
  var coax = require("coax");

  dls.db = {};
  dls.dbName = "";

  var service = {
    initialize: initialize,
    getAllDocuments: getAllDocuments,
    getDocument: getDocument,
    addDocument: addDocument,
    updateDocument: updateDocument,
    removeDocument: removeDocument,
    addAttachment: addAttachment,
    getAttachment: getAttachment,
    getLocalUrl: getLocalUrl,
    removeAttachment: removeAttachment,
    compact: compact,
    purge: purge,
    sync: sync,
    stopSync: stopSync
  };

  return service;

  function initialize() {
    var q = $q.defer();
    if (config && config.dbName) {
      dls.dbName = config.dbName + $rootScope.user.id;

      if (config.usePouchDB) {
        if (angular.equals(dls.db, {}) || typeof dls.db !== "undefined") {
          var adapter = $window.sqlitePlugin ? {adapter: 'websql'} : {};
          dls.db = new PouchDB(config.dbName, adapter);

          q.resolve();

          //TODO: uncomment this to allow pouchDB sync with Sync Gateway NOT WORKING
          //if(config.autoSync){
          //  $log.debug("Sync enabled");
          //  sync();
          //}
        }
      }
      else {
        function setupConfig(done) {
          // check if CBLite is available
          if (!$window.cblite) {
            return done('Couchbase Lite not installed');
          }

          //get the CBL server url
          cblite.getURL(function (err, url) {
            if (err) {
              return done(err);
            }
            //set the url for coax

            url = url.replace('localhost', '127.0.0.1');

            $window.server = coax(url);

            var db = coax([url, dls.dbName]);
            setupDb(db, function (err, info) {
              if (err) {
                return done(err);
              }
              dls.db = db;
              config.localServerUrl = url;
              config.localDbUrl = url + dls.dbName;
              return done(null, info);
            })
          });

          function setupDb(db, cb) {
            db.get(function (err, res) {
              //couldn't find the db, will try to create
              if (err) {
                if (err.status == 404) {
                  db.put(function (err) {
                    if (err) {
                      return cb(err);
                    }
                    db.get(cb);
                  })
                }
                else {
                  //uncaptured error
                  return cb(err);
                }
              }
              else {
                return cb(null, res);
              }
            })
          }
        }

        setupConfig(function (err, info) {
          if (err) {
            return $log.debug("error: " + JSON.stringify(err));
          }
          else {
            $log.debug("Database created correctly" + info);
            q.resolve();

            if (config.autoSync) {
              $log.debug("Sync enabled");
              sync();
            }
          }
        });
      }
    }
    else {
      $log.debug("error: could not initialize db");
      q.reject();
    }
    return q.promise;
  }


  function getAllDocuments() {
    var q = $q.defer();
    if (config.usePouchDB) {
      dls.db.allDocs({include_docs: true})
        .then(function (docs) {
          $log.debug("All docs retreived");
          q.resolve(docs);
        })
        .catch(function (err) {
          $log.debug("Error retreiving all docs");
          q.reject(err);
        })
    }
    else {
      dls.db.get(['_all_docs', {'include_docs': 'true'}], function (err, docs) {
        if (!err) {
          $log.debug("All docs retreived");
          q.resolve(docs);
        }
        else {
          $log.debug("Error retreiving all docs");
          q.reject(err);
        }
      })
    }

    return q.promise;
  }

  function getDocument(documentId) {
    var q = $q.defer();
    dls.db.get(documentId, function (err, doc) {
      if (!err) {
        q.resolve(doc);
      }
      else {
        q.reject(err);
      }
    });

    return q.promise;
  }

  function addDocument(doc) {
    var q = $q.defer();
    dls.db.post(doc, function (err, ok) {
      if (!err) {
        $log.debug("Doc added: " + ok);
        q.resolve(ok.id);
      }
      else {
        $log.debug("Error adding doc: " + err);
        q.reject(err);
      }
    });

    return q.promise;
  }

  function updateDocument(doc) {
    var q = $q.defer();
    if (config.usePouchDB) {
      getDocument(doc._id)
        .then(function (DBdoc) {
          return dls.db.put(doc, DBdoc._id, DBdoc._rev)
        })
        .then(function (success) {
          $log.debug("Updating doc success: " + success);
          q.resolve(success);
        })
        .catch(function (err) {
          $log.debug("Updating doc failure: " + err);
          q.reject(err);
        })
    }
    else {
      dls.db.put(doc._id, doc, function (err, ok) {
        if (!err) {
          $log.debug("Updating doc success: " + ok);
          q.resolve(ok);
        }
        else {
          $log.debug("Updating doc failure: " + err);
          q.reject(err);
        }
      });
    }
    return q.promise;
  }

  function removeDocument(documentId) {
    var q = $q.defer();
    getDocument(documentId)
      .then(function (doc) {
        doc._deleted = true;
        return updateDocument(doc);
      })
      .then(function (success) {
        $log.debug("Removing doc success: " + success);
        q.resolve(success);
      })
      .catch(function (err) {
        $log.debug("Removing doc failure: " + err);
        q.reject(err);
      });

    return q.promise;
  }

  function addAttachment(documentId, attachment) {
    var q = $q.defer();
    dls.db.get(documentId, function (err, doc) {
      doc._attachments = attachment;
      doc.last_revision = new Date().getTime();

      dls.db.put(documentId, doc, function (err, ok) {
        if (!err) {
          $log.debug("Adding attachment success: " + ok);
          q.resolve();
        }
        else {
          $log.debug("Adding attachment failure: " + err);
          q.reject(err);
        }
      })
    });
    return q.promise;
  }

  function getAttachment(documentId) {
    var q = $q.defer();
    dls.db.get([documentId, {"attachments": "true"}], function (err, doc) {
      if (!err) {
        $log.debug("Retrieving attachment success: " + doc);
        q.resolve(doc._attachments.attachment.data);
        //q.resolve(doc);
      }
      else {
        $log.debug("Retrieving attachment failure: " + err);
        q.reject(err);
      }
    });
    return q.promise;
  }

  function getLocalUrl() {
    return config.localDbUrl || "";
  }

  function removeAttachment(documentId, attachmentName) {
    var q = $q.defer();
    dls.db.get(documentId, function (err, doc) {
      if (!err) {
        delete doc._attachments[attachmentName];
        updateDocument(doc)
          .then(function (success) {
            $log.debug("Removing attachment success: " + success);
            q.resolve();
          })
          .catch(function (error) {
            $log.debug("Removing attachment failure: " + success);
            q.reject(error);
          })
      }
      else {
        q.reject(err);
      }
    });
    return q.promise;
  }

  function compact() {
    var q = $q.defer();

    if (config.usePouchDB) {
      dls.db.compact().then(function (info) {
        $log.debug('Compact result: ' + info.toString());
        q.resolve(info);
      }).catch(function (err) {
        $log.debug('Compact failed: ' + err.toString());
        q.reject(err);
      });
    }
    else {
      dls.db.post(['_compact'], function (err, ok) {
        if (!err) {
          $log.debug('Compact result: ' + ok);
          q.resolve(ok);
        }
        else {
          $log.debug('Compact failed: ' + err);
          q.reject(err);
        }
      })
    }

    return q.promise;
  }

  function purge() {
    var q = $q.defer();
    if (!config.usePouchDB) {
      dls.db.post(['_purge'], function (err, ok) {
        if (!err) {
          $log.debug('Purge result: ' + ok);
          q.resolve(ok);
        }
        else {
          $log.debug('Purge failed: ' + err);
          q.reject(err);
        }
      })
    }
    else {
      $log.debug("Purge not available in PouchDB");
      q.reject("Purge not available in PouchDB");
    }

    return q.promise;
  }

  function sync() {

    if (config.usePouchDB && dls.db.prefix && dls.db.prefix == "_pouch_") {
      if (config.replicateToCouchDB) {

        //TODO: once the login is in place, there should be a cookie to use for authentication
        var cHost = CouchDbConfig.host.split("//");
        var cdb = cHost[0] + "//" + config.username + ":" + config.password + "@" + cHost[1];

        //TODO: once the login is in place, set the correct replication target
        dls.db.replicate.to(cdb + "lotqc_" + config.organizationId,
          {
            live: true
          }).on('error', function (err) {
          $log.debug("Error replicating to CouchDB: " + err);
        });
      }
      else {
        //TODO: once the login is in place, verify the replication parameters
        dls.db.sync(config.syncUrl, {live: true}).on('error', function (err) {
          $log.debug("Error replicating to SG: " + err);
        });
      }
    }
    else {
      triggerSync(function (res) {
        $log.debug("Synced:" + res);
      })
    }

    function triggerSync(cb) {

      var push = {
        source: {
          url: dls.dbName
        },
        target: {
          url: config.syncUrl,
          "headers": {
            "Cookie": 'SyncGatewaySession=' + SessionService.getZestSessionId()
          }
        },
        continuous: true
      };
      var pull = {
        target: dls.dbName,
        source: {
          url: config.syncUrl,
          "headers": {
            "Cookie": 'SyncGatewaySession=' + SessionService.getZestSessionId()
          }
        },
        continuous: true
      };

      dls.pushSync = syncManager(config.localServerUrl, push);
      dls.pullSync = syncManager(config.localServerUrl, pull);

      //push sync catchs
      dls.pushSync.on("error", function (err) {
        $log.debug(err);
      });
      dls.pushSync.on("connected", function () {
        dls.pullSync.start();
      });

      //pull sync catchs
      dls.pullSync.on("error", function (err) {
        $log.debug(err);
      });
      dls.pullSync.on("connected", function () {
        cb(true);
      });
      // setTimeout(function(){
      dls.pushSync.start();
      // }, 10000)
    }

    function syncManager(serverUrl, syncDefinition) {
      var handlers = {};

      function callHandlers(name, data) {
        (handlers[name] || []).forEach(function (h) {
          h(data);
        })
      }

      function doCancelPost(cb) {
        var cancelDef = JSON.parse(JSON.stringify(syncDefinition));
        cancelDef.cancel = true;
        coax.post([serverUrl, "_replicate"], cancelDef, function (err, info) {
          if (err) {
            callHandlers("error", err);
            if (cb) {
              cb(err, info);
            }
          } else {
            callHandlers("cancelled", info);
            if (cb) {
              cb(err, info);
            }
          }
        })
      }

      function doStartPost() {
        var tooLate;

        function pollForStatus(info, wait) {
          if (wait) {
            setTimeout(function () {
              tooLate = true;
            }, wait)
          }
          processTaskInfo(info.session_id, function (done, err) {
            if (!done && !tooLate) {
              setTimeout(function () {
                pollForStatus(info);
              }, 5000)
            } else if (tooLate) {
              callHandlers("error", "timeout");
            }
          })
        }

        var callBack;
        if (syncDefinition.continuous) {
          callBack = function (err, info) {
            //$log.debug("continuous sync callBack", err, info, syncDefinition);
            if (err) {
              callHandlers("error", err);
            } else {
              pollForStatus(info, 10000);
              callHandlers("started", info);
            }
          }
        } else { // non-continuous
          callBack = function (err, info) {
            //$log.debug("sync callBack", err, info, syncDefinition);
            if (err) {
              if (info.status == 401) {
                err.status = info.status;
                callHandlers("auth-challenge", err);
              } else {
                err.status = info.status;
                callHandlers("error", err);
              }
            } else {
              callHandlers("connected", info);
            }

          }
        }
        //$log.debug("start sync" + JSON.stringify(syncDefinition));
        coax.post([serverUrl, "_replicate"], syncDefinition, callBack);
      }

      function processTaskInfo(id, cb) {
        taskInfo(id, function (err, task) {
          if (err) {
            return cb(true, err);
          }
          //check that the task exists
          else if (angular.equals(task, {})) {
            return cb(true, "no task");
          }

          publicAPI.task = task;
          if (task.error && task.error[0] == 400) {
            cb(true, task.error);
            callHandlers("error", {status: 400, error: task.error[1]})
          } else if (task.error && task.error[0] == 401) {
            cb(true, task.error);
            callHandlers("auth-challenge", {status: 401, error: task.error[1]})
          } else if (task.error && task.error[0] == 502) {
            cb(true, task.error);
            callHandlers("auth-challenge", {status: 502, error: task.error[1]})
          } else if (task.status == "Idle" || task.status == "Stopped" || (/Processed/.test(task.status) && !/Processed 0/.test(task.status))) {
            cb(true);
            callHandlers("connected", task)
          } else if (/Processed 0 \/ 0 changes/.test(task.status)) {
            cb(false); // keep polling? (or does this mean we are connected?)
            //cb(true)
            callHandlers("connected", task)
          } else {
            $log.debug("not done")
            cb(false); // not done
          }


        })
      }

      function taskInfo(id, cb) {
        //get the active tasks (replications processes alive)
        coax([serverUrl, "_active_tasks"], function (err, tasks) {
          var me = {};
          for (var i = tasks.length - 1; i >= 0; i--) {
            if (tasks[i].task == id) {
              me = tasks[i];
            }
          }
          cb(false, me);
        })
      }

      var publicAPI = {
        start: doStartPost,
        cancel: doCancelPost,
        on: function (name, cb) {
          handlers[name] = handlers[name] || [];
          handlers[name].push(cb);
        }
      };
      return publicAPI;
    }
  }

  function stopSync() {
    if (dls.pullSync && dls.pushSync) {
      dls.pullSync.cancel();
      dls.pushSync.cancel();
    }
  }

}
