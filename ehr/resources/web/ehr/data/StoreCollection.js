/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('EHR.data.StoreCollection', {
    extend: 'Ext.util.Observable',

    clientStores: null,
    serverStores: null,

    ignoredClientEvents: {},

    constructor: function(){
        this.collectionId = Ext4.id();
        this.clientStores = Ext4.create('Ext.util.MixedCollection', false, this.getKey);
        this.serverStores = Ext4.create('Ext.util.MixedCollection', false, this.getKey);

        this.callParent(arguments);
        this.addEvents('commitcomplete', 'commitexception', 'validation', 'load', 'clientdatachanged', 'serverdatachanged');

        this.on('clientdatachanged', this.onClientDataChanged, this, {buffer: 30});
    },

    getKey: function(o){
        return o.storeId;
    },

    getServerStoreForQuery: function(schemaName, queryName){
        var store;

        this.serverStores.each(function(s){
            if (LABKEY.Utils.caseInsensitiveEquals(s.schemaName, schemaName) && LABKEY.Utils.caseInsensitiveEquals(s.queryName, queryName)){
                store = s;
                return false;
            }
        }, this);

        return store;
    },

    loadDataFromServer: function(){
        if (this.serverStoresLoading)
            return;

        this.serverStoresLoading = {};
        this.serverStores.each(function(s){
            this.serverStoresLoading[s.storeId] = true;
            s.load();
        }, this);
    },

    getServerStoreByName: function(title){
        var parts = title.split('.');
        var queryName = parts.pop();
        var schemaName = parts.join('.');

        return this.getServerStoreForQuery(schemaName, queryName);
    },

    addServerStoreFromConfig: function(config){
        var storeConfig = Ext4.apply({}, config);
        LABKEY.ExtAdapter.apply(storeConfig, {
            type: 'ehr-dataentryserverstore',
            autoLoad: false,
            storeId: this.collectionId + '||' + LABKEY.ext.Ext4Helper.getLookupStoreId({lookup: config})
        });

        var store = this.serverStores.get(storeConfig.storeId);
        if (store){
            console.log('Store already defined: ' + store.storeId);
            return store;
        }

        store = Ext4.create('EHR.data.DataEntryServerStore', storeConfig);

        this.addServerStore(store);

        return store;
    },

    //add an instantiated server-side store to the collection
    addServerStore: function(store){
        this.mon(store, 'load', this.onServerStoreLoad, this);
        this.mon(store, 'exception', this.onServerStoreException, this);
        this.mon(store, 'validation', this.onServerStoreValidation, this);
        store.storeCollection = this;

        this.serverStores.add(store);
    },

    onServerStoreLoad: function(store){
        if (this.serverStoresLoading && this.serverStoresLoading[store.storeId]){
            store.validateRecords(store.getRange(), true);
            delete this.serverStoresLoading[store.storeId];
            if (LABKEY.Utils.isEmptyObj(this.serverStoresLoading)){
                delete this.serverStoresLoading;
                this.transformServerToClient();
                this.fireEvent('load', this);
            }
        }
    },

    onClientStoreAdd: function(store){
        if (!this.hasIgnoredClientEvent(store.storeId, 'add', true))
            this.fireEvent('clientdatachanged', 'add');
    },

    onClientStoreRemove: function(store){
        if (!this.hasIgnoredClientEvent(store.storeId, 'remove', true))
            this.fireEvent('clientdatachanged', 'remove');
    },

    onClientStoreUpdate: function(store){
        if (!this.hasIgnoredClientEvent(store.storeId, 'update', true))
            this.fireEvent('clientdatachanged', 'update');
    },

    onClientStoreDataChanged: function(store){
        if (!this.hasIgnoredClientEvent(store.storeId, 'datachanged', true))
            this.fireEvent('clientdatachanged', 'datachanged');
    },

    //used to allow buffering so clientdatachange events from many sources only trigger 1 recalculation
    onClientDataChanged: function(){
        this.transformClientToServer()
    },

    onServerStoreException: function(store){
        console.log('exception');
    },

    transformClientToServer: function(){
        var changedRecords = {};
        this.clientStores.each(function(clientStore){
            var map = clientStore.getClientToServerRecordMap();
            var clientKeyField = clientStore.getKeyField();

            for (var table in map){
                var serverStore = this.getServerStoreByName(table);
                LDK.Assert.assertNotEmpty('Unable to find server store: ' + table, serverStore);

                var fieldMap = map[table];
                Ext4.Array.forEach(clientStore.getRange(), function(clientModel){
                    //find the corresponding server record
                    var key = clientModel.get(clientKeyField);
                    var serverModel = serverStore.findRecord(clientKeyField, key);

                    if (!serverModel){
                        //TODO: determine whether to auto-create the record
                        serverModel = this.addServerModel(serverStore, {});
                    }

                    if (serverModel){
                        var serverFieldName;
                        for (var clientFieldName in fieldMap){
                            serverFieldName = fieldMap[clientFieldName];

                            var clientVal = Ext4.isEmpty(clientModel.get(clientFieldName)) ? null : clientModel.get(clientFieldName);
                            var serverVal = Ext4.isEmpty(serverModel.get(serverFieldName)) ? null : serverModel.get(serverFieldName);
                            if (serverVal != clientVal){
                                serverModel.set(serverFieldName, clientVal);
                                serverModel.setDirty(true);

                                if (!changedRecords[serverStore.storeId])
                                    changedRecords[serverStore.storeId] = {};

                                changedRecords[serverStore.storeId][serverModel.getId()] = serverModel;
                            }
                        }
                    }
                }, this);
            }
        }, this);

        if (Ext4.Object.getKeys(changedRecords).length > 0){
            this.validateRecords(changedRecords);
            this.fireEvent('serverdatachanged', this, changedRecords);
        }
    },

    validateAll: function(){
        this.serverStores.each(function(serverStore){
            serverStore.validateRecords(serverStore.getRange(), true);
        }, this);
    },

    validateRecords: function(recordMap){
        for (var serverStoreId in recordMap){
            var serverStore = this.serverStores.get(serverStoreId);
            serverStore.validateRecords(Ext4.Object.getValues(recordMap[serverStoreId]), true);
        }
    },

    serverToClientDataMap: null,

    getServerToClientDataMap: function(){
        if (this.serverToClientDataMap){
            return this.serverToClientDataMap;
        }

        this.serverToClientDataMap = {};
        this.clientStores.each(function(cs){
            var map = cs.getClientToServerRecordMap();
            for (var serverStoreId in map){
                if (!this.serverToClientDataMap[serverStoreId])
                    this.serverToClientDataMap[serverStoreId] = {};

                this.serverToClientDataMap[serverStoreId][cs.storeId] = map[serverStoreId];
            }
        }, this);

        return this.serverToClientDataMap;
    },

    _sortedServerStores: null,

    getSortedServerStores: function(){
        if (this._sortedServerStores)
            return this._sortedServerStores;

        var dependencies = [];
        var arr;
        this.clientStores.each(function(s){
            arr = s.getDependencies();
            if (arr.length){
                dependencies = dependencies.concat(arr);
            }
        }, this);

        dependencies = LDK.Utils.tsort(dependencies);
        dependencies.reverse();
        this._sortedServerStores = dependencies;

        return dependencies;
    },

    setClientModelDefaults: function(model){
        //this method is designed to be overriden by subclasses

        //TODO: apply inheritance
    },

    //creates and adds a model to the provided client store, handling any dependencies within other stores in the collection
    addClientModel: function(store, data){
        if (EHR.debug)
            console.log('creating client model');

        var model = store.createModel(data);
        store.add(model);

        return model;
    },

    //creates and adds a model to the provided server store, handling any dependencies within other stores in the collection
    addServerModel: function(store, data){
        console.log('creating server model');
        var model = store.createModel({});
        store.add(model);

        return model;
    },

    updateClientModelInheritance: function(clientStore, clientModel){
        var map = clientStore.getInheritingFieldMap();
        var inheritance, serverStore, serverModel;
        Ext4.Array.forEach(Ext4.Object.getValues(map), function(field){
            inheritance = field.inheritance;
            serverStore = this.getServerStoreForQuery(inheritance.storeIdentifier.schemaName, inheritance.storeIdentifier.queryName);
            serverModel = this.getServerModelForInheritance(inheritance, serverStore, clientModel);
            if (!serverModel){

            }
            else {
                clientModel.set(field.name, serverModel.get(inheritance.sourceField))
            }

        }, this);
    },

    getServerModelForInheritance: function(inheritance, serverStore, clientModel){
        if (inheritance.recordSelector){
            var rs = inheritance.recordSelector;
            var idx = serverStore.findBy(function(serverModel){
                for (var clientFieldName in rs){
                    if (clientModel.get(clientFieldName) != serverModel.get(rs[clientFieldName])){
                        return false;
                    }
                }

                return true;
            });

            if (idx > -1)
                return serverStore.getAt(idx);
        }
        else if (inheritance.recordIdx){
            return serverStore.getAt(inheritance.recordIdx);
        }
    },

    transformServerToClient: function(){
        var map = this.getServerToClientDataMap();
        var changedStoreIDs = {};

        Ext4.Array.forEach(this.getSortedServerStores(), function(name){
            var serverStore = this.getServerStoreByName(name);
            LDK.Assert.assertNotEmpty('Unable to find store with name: ' + name, serverStore);

            var targetChildStores = map[name];
            var fieldMap, clientStore, serverFieldName, clientKeyField;
            serverStore.each(function(serverModel){
                for (var clientStoreId in targetChildStores){
                    clientStore = this.clientStores.get(clientStoreId);
                    LDK.Assert.assertNotEmpty('Unable to find client store with Id: ' + clientStoreId, clientStore);
                    clientKeyField = clientStore.getKeyField();

                    var clientModel = clientStore.findRecord(clientKeyField, serverModel.get(clientKeyField));
                    if (!clientModel){
                        clientModel = this.addClientModel(clientStore, {});
                    }

                    if (clientModel){
                        clientModel.phantom = serverModel.phantom;

                        fieldMap = targetChildStores[clientStoreId];
                        clientModel.suspendEvents();
                        for (var clientFieldName in fieldMap){
                            //transfer values
                            serverFieldName = fieldMap[clientFieldName];
                            var clientVal = Ext4.isEmpty(clientModel.get(clientFieldName)) ? null : clientModel.get(clientFieldName);
                            var serverVal = Ext4.isEmpty(serverModel.get(serverFieldName)) ? null : serverModel.get(serverFieldName);
                            if (serverVal != clientVal){
                                clientModel.set(clientFieldName, serverModel.get(serverFieldName));
                                changedStoreIDs[clientStore.storeId] = true;
                            }

                            //also copy server errors
                            var se = serverModel.serverErrors ? serverModel.serverErrors.getByField(serverFieldName) : [];
                            if (se && se.length){
                                changedStoreIDs[clientStore.storeId] = true;
                                this.removeMatchingErrors(clientModel, clientFieldName);
                                Ext4.Array.forEach(se, function(e){
                                    var newError = Ext4.apply({}, e);
                                    newError.field = clientFieldName;
                                    clientModel.serverErrors.add(newError);
                                }, this);
                            }
                        }
                        clientModel.resumeEvents();
                    }
                }
            }, this);
        }, this);

        this.clientStores.each(function(s){
            s.loaded = true;
        });

        Ext4.Array.forEach(Ext4.Object.getKeys(changedStoreIDs), function(storeId){
            var store = this.clientStores.get(storeId);
            this.addIgnoredClientEvent(storeId, 'datachanged');
            store.fireEvent('datachanged', store, true);
        }, this);
    },

    addIgnoredClientEvent: function(storeId, event){
        this.ignoredClientEvents[storeId] = this.ignoredClientEvents[storeId] || {};
        this.ignoredClientEvents[storeId]['datachanged'] = true;
    },

    hasIgnoredClientEvent: function(storeId, event, remove){
        if (this.ignoredClientEvents[storeId] && this.ignoredClientEvents[storeId][event]){
            if (remove)
                delete this.ignoredClientEvents[storeId][event];

            return true;
        }

        return false;
    },

    removeMatchingErrors: function(clientModel, clientFieldName){
        clientModel.serverErrors = clientModel.serverErrors || Ext4.create('Ext.data.Errors');
        clientModel.serverErrors.each(function(err){
            if (err.fromServer && err.field == clientFieldName){
                clientModel.serverErrors.remove(err);
            }
        }, this);
    },

    //add an instantiated client-side store to the collection
    addClientStore: function(store){
        this.mon(store, 'add', this.onClientStoreAdd, this);
        this.mon(store, 'remove', this.onClientStoreRemove, this);
        this.mon(store, 'update', this.onClientStoreUpdate, this);
        this.mon(store, 'datachanged', this.onClientStoreDataChanged, this);
        store.storeCollection = this;

        this.clientStores.add(store);
    },

    //private
    getCommands: function(commitAll){
        var allCommands = [];
        var allRecords = [];

        this.serverStores.each(function(s){
            var ret = s.getCommands(commitAll);
            if (ret.commands.length){
                allCommands = allCommands.concat(ret.commands);
                allRecords = allRecords.concat(ret.records);
            }
        }, this);

        return {
            commands: allCommands,
            records: allRecords
        }
    },

    getExtraContext: function(extraContext){
        return LABKEY.Utils.merge({}, extraContext);
    },

    commitChanges: function(commitAll, extraContext){
        //TODO
        var changed = this.getCommands(commitAll);
        this.commit(changed.commands, changed.records, this.getExtraContext(extraContext));
    },

    //private
    commit: function(commands, records, extraContext){
        extraContext = extraContext || {};

        if(this.fireEvent('beforecommit', this, records, commands, extraContext)===false)
            return;

        if (!commands || !commands.length){
            this.onComplete(extraContext);
            return;
        }

        this.sendRequest(commands, records, extraContext);
    },

    sendRequest: function(recordsArr, commands, extraContext, validateOnly){
        var cfg = {
            url : LABKEY.ActionURL.buildURL('query', 'saveRows', this.containerPath),
            method : 'POST',
            success: this.getOnCommitSuccess(recordsArr),
            failure: this.getOnCommitFailure(recordsArr),
            scope: this,
            timeout: this.timeout || 0,
            jsonData : {
                apiVersion: 13.2,
                containerPath: this.containerPath,
                commands: commands,
                extraContext: extraContext || {}
            },
            headers : {
                'Content-Type' : 'application/json'
            }
        };

        if (validateOnly){
            cfg.jsonData.validateOnly = true;
            cfg.jsonData.extraContext.isValidateOnly = true;
        }

        var request = Ext4.Ajax.request(cfg);

        Ext4.each(recordsArr, function(rec){
            rec.lastTransactionId = request.tId;
        }, this);
    },

//    /**
//     * Will test whether all records in this store collection pass validation or not.
//     * @returns {Boolean} True/false depending on whether all records in this StoreCollection pass validation
//     */
//    isValid: function(){
//        var valid = true;
//        this.serverStores.each(function(s){
//            if(!s.isValid()){
//                valid = false;
//            }
//        }, this);
//        return valid;
//    },
//
//    /**
//     * Tests whether any records in this store collection are dirty
//     * @returns {boolean} True/false depending on whether any records in the collection are dirty.
//     */
//    isDirty: function(){
//        var dirty = false;
//        this.serverStores.each(function(s){
//            if(s.getModifiedRecords().length)
//                dirty = true;
//        }, this);
//        return dirty;
//    },

    onServerStoreValidation: function(store, records){
        this.transformServerToClient();
        this.fireEvent('validation', this);
    },

    getErrors: function(){
        var errors = [];
        this.clientStores.each(function(store){
            store.each(function(r){
                errors = errors.concat(r.validate().getRange());
            }, this);
        }, this);

        return errors;
    },

    getOnCommitFailure: function(recordArr) {
        return function(response, options) {
            //note: should not matter which child store they belong to
            Ext4.Array.forEach(recordArr, function(command){
                Ext4.Array.forEach(command, function(r){
                    delete r.saveOperationInProgress;
                }, this);
            }, this);

            //TODO: clean up how we parse the JSON errors
            var json = this.getJson(response);
            if(json && json.result){
                //each error should represent 1 row.  there can be multiple errors per row
                Ext4.Array.forEach(json.result, function(command, commandIdx){
                    if (command.errors && command.errors.length){
                        var serverStore = this.getServerStoreForQuery(command.schemaName, command.queryName);
                        LDK.Assert.assertNotEmpty('Could not find store matching: ' + command.schemaName + '.' + command.queryName, serverStore);

                        serverStore.handleServerErrors(command.errors, recordArr[commandIdx]);
                    }
                    else {
                        console.error('this should not happen');
                    }
                }, this);
            }

            if ((options.jsonData && options.jsonData.validateOnly)){
                this.fireEvent('validation', this);
            }
            else {
                this.fireEvent('commitexception', this, json);
            }
        };
    },

    //private
    getOnCommitSuccess: function(recordArr){
        return function(response, options){
            var json = this.getJson(response);

            if(!json || !json.result)
                return;

            if (json.errorCount > 0){
                var callback = this.getOnCommitFailure(recordArr);
                callback.call(this, response, options);
                return;
            }

            for (var i=0;i<json.result.length;i++){
                var command = json.result[i];
                var store = this.getServerStoreForQuery(command.schemaName, command.queryName);
                LDK.Assert.assertNotEmpty('Unable to find matching store: ' + command.schemaName + '.' + command.queryName, store);

                if(!options.jsonData || !options.jsonData.extraContext || !options.jsonData.extraContext.successURL)
                    store.processResponse(command.rows, command[i]);
            }

            this.onComplete((options.jsonData ? options.jsonData.extraContext : null));
        }
    },

    //private
    onComplete: function(extraContext){
        if (extraContext && extraContext.isValidateOnly){
            this.fireEvent('validation', this);
        }
        else {
            this.fireEvent('commitcomplete', this, extraContext);
        }
    },

    //private
    getJson : function(response) {
        return (response && undefined != response.getResponseHeader && undefined != response.getResponseHeader('Content-Type')
                && response.getResponseHeader('Content-Type').indexOf('application/json') >= 0)
                ? LABKEY.ExtAdapter.decode(response.responseText)
                : null;
    },

    //private
    deleteAllRecords: function(extraContext){
        //NOTE: we delegate the deletion to each store, and track progress here so we can fire a single event
        var storesPerformingDeletes = [];
        var failures = 0;

        this.each(function(s){
            var records = [];
            s.each(function(r){
                records.push(r);
            }, this);

            function onComplete(response){
                s.un('commitcomplete', onComplete);
                s.un('commitexception', onComplete);

                if(storesPerformingDeletes.indexOf(s.storeId)!=-1){
                    storesPerformingDeletes.remove(s.storeId)
                }

                if(!storesPerformingDeletes.length){
                    if(failures == 0){
                        this.onComplete(extraContext);
                    }
                    else {
                        this.fireEvent('commitexception');
                    }
                }
            }

            s.on('commitcomplete', onComplete, this, {single: true});
            s.on('commitexception', onComplete, this, {single: true});

            storesPerformingDeletes.push(s.storeId);
            s.deleteRecords(records, extraContext);
        }, this);
    },

    getMaxErrorSeverity: function(){
        var maxSeverity = '';
        this.clientStores.each(function(store){
            maxSeverity = EHR.Utils.maxError(maxSeverity, store.getMaxErrorSeverity());
        }, this);

        return maxSeverity;
    }
});