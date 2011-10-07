/*
 * Copyright (c) 2010-2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

Ext.namespace('EHR.ext', 'EHR.ext.plugins');


// this class will serve to monitor multiple child stores.
// it will handle: preparing submission to server, commitChanges, decoding server response
// also provides some level of validation over records
// should delegate as much as reasonable to child stores
// primarily tries to listen for events from child stores and aggregate info

//events: 'beforecommit', 'commitcomplete', 'commitexception','update', 'validation'

EHR.ext.StoreCollection = Ext.extend(Ext.util.MixedCollection, {
    constructor: function(config){
        Ext.apply(this, config);

        //inheritance code separated for now
        Ext.apply(this, EHR.ext.StoreInheritance);

        EHR.ext.StoreCollection.superclass.constructor.call(this, false, function(item){return item.storeId;});
        this.addEvents('beforecommit', 'commitcomplete', 'commitexception', 'update', 'validation');
    },
    //timeout: 60000,
    add: function(store){
        store = Ext.StoreMgr.lookup(store);
        if (this.contains(store)){
            //console.log('Store already added: '+store.queryName);
            return;
        }

        if (!this.containerPath)
            this.containerPath = store.containerPath;

        //check whether container path matches
        if (store.containerPath && store.containerPath != this.containerPath)
            console.log('possible problem: container doesnt match');

        EHR.ext.StoreCollection.superclass.add.call(this, store.storeId, store);

        Ext.apply(store, {
            parentStore: this,
            monitorValid: this.monitorValid,
            allowOthersToEditRecords: this.allowOthersToEditRecords
        });

        if(this.monitorValid){
            store.on('validation', this.onValidation, this);
            store.initMonitorValid();
        }

        this.initInheritance(store);

        this.relayEvents(store, ['update']);

    },

    initMonitorValid: function(){
        this.monitorValid = true;
        this.each(function(store){
            store.on('validation', this.onValidation, this);
        }, this);
    },

    stopMonitorValid: function(){
        this.each(function(store){
            this.store.un('validation', this.onValidation, this);
        }, this);
        this.monitorValid = false;
    },

    remove: function(store){
        //TODO: this is done to undo relayEvents() set above.
        if (store.hasListener('update')) {
            store.events['update'].clearListeners();
        }

        store.un('validation', this.onValidation, this);
        delete store.parentStore;

        EHR.ext.StoreCollection.superclass.remove.call(store);
    },

    getChanged: function(commitAll){
        var allCommands = [];
        var allRecords = [];

        this.each(function(s){
            var records;
            if(commitAll)
                records = s.getAllRecords();
            else
                records = s.getModifiedRecords();

            var commands = s.getChanges(records);

            if (commands.length){
                allCommands = allCommands.concat(commands);
                allRecords = allRecords.concat(records);
            }
            else if (commands.length && !records.length){
                console.log('ERROR: there are modified records but no commands');
            }
        }, this);

        return {
            commands: allCommands,
            records: allRecords
        }
    },

    commitChanges : function(extraContext, commitAll) {
        var changed = this.getChanged(commitAll);
        this.commit(changed.commands, changed.records, extraContext);
    },

    commitRecord: function(record, extraContext){
        record.store.commitRecords([record], extraContext);
    },

    commit: function(commands, records, extraContext){
        extraContext = extraContext || {};

        if (!commands || !commands.length){
//            if(extraContext && extraContext.silent!==true)
//                Ext.Msg.alert('Alert', 'There are no changes to submit.');

            this.onComplete(extraContext);
            return;
        }

        if(this.fireEvent('beforecommit', records, commands, extraContext)===false)
            return;

        var request = Ext.Ajax.request({
            url : LABKEY.ActionURL.buildURL('query', 'saveRows', this.containerPath),
            method : 'POST',
            success: this.onCommitSuccess,
            failure: this.getOnCommitFailure(records),
            scope: this,
            timeout: this.timeout || 0,
            jsonData : {
                containerPath: this.containerPath,
                commands: commands,
                extraContext: extraContext || {}
            },
            headers : {
                'Content-Type' : 'application/json'
            }
        });

        Ext.each(records, function(rec){
            rec.lastTransactionId = request.tId;
        }, this);
    },

    isValid: function(){
        var valid = true;
        this.each(function(s){
            if(!s.isValid()){
                valid=false
            }
        }, this);
        return valid;
    },

    isDirty: function()
    {
        var dirty = false;
        this.each(function(s){
            if(s.getModifiedRecords().length)
                dirty=true;
        }, this);
        return dirty;
    },

    isLoading: function(){
        var isLoading = false;
        this.each(function(s){
            if(s.isLoading){
                isLoading = true;
            }
        }, this);

        return isLoading;
    },

    getQueries: function(){
        var queries = [];
        this.each(function(s){
            queries.push({
                schemaName: s.schemaName,
                queryName: s.queryName
            })
        }, this);
        return queries;
    },

    onValidation: function(store, records){
        //check all stores
        var maxSeverity = '';
        this.each(function(store){
            maxSeverity = EHR.utils.maxError(maxSeverity, store.maxErrorSeverity());
        }, this);

        this.fireEvent('validation', this, maxSeverity);
    },

    getErrors: function(){
        var errors = [];
        this.each(function(store){
            store.errors.each(function(error){
                errors.push(error);
            }, this);
        }, this);

        return errors;
    },

    getOnCommitFailure : function(records) {
        return function(response, options) {
            //note: should not matter which child store they belong to
            for(var idx = 0; idx < records.length; ++idx)
                delete records[idx].saveOperationInProgress;

            var serverError = this.getJson(response);
            var msg = '';
            if(serverError && serverError.errors){
                Ext.each(serverError.errors, function(error){
                    //handle validation script errors and exceptions differently
                    if(error.errors && error.errors.length){
                        this.handleValidationErrors(error, response, serverError.extraContext);
                        msg = error.exception || "Could not save changes due to errors.  Please check the form for fields marked in red.";
                    }
//                    else {
//                        //if an exception was thrown, I believe we automatically only have one error returned
//                        //this means this can only be called once
//                        msg = 'Could not save changes due to the following error:\n' + (serverError && serverError.exception) ? serverError.exception : response.statusText;
//                    }
                }, this);

                if(!serverError.errors){
                    msg = 'Could not save changes due to the following error:\n' + serverError.exception;
                }
            }

            if(false !== this.fireEvent("commitexception", msg, serverError) && (options.jsonData.extraContext && !options.jsonData.extraContext.silent)){
                Ext.Msg.alert("Error", "Error During Save. "+msg);
                console.log(serverError);
            }
        };
    },

    handleValidationErrors: function(serverError, response, extraContext){
        var store = this.get(extraContext.storeId);
        var record = store.getById(serverError.row._recordId);
        if(record){
            store.handleValidationError(record, serverError, response, extraContext);
        }
        else {
            console.log('ERROR: Record not found');
            console.log(serverError);
        }
    },

    onCommitSuccess : function(response, options){
        var json = this.getJson(response);
        if(!json || !json.result)
            return;

        for (var i=0;i<json.result.length;i++){
            var result = json.result[i];
            var store = this.find(function(s){
                return s.queryName==result.queryName && s.schemaName==result.schemaName;
            });

            if(!options.jsonData || !options.jsonData.extraContext || !options.jsonData.extraContext.successURL)
                store.processResponse(result.rows);
        }

        this.onComplete((options.jsonData ? options.jsonData.extraContext : null));
    },

    onComplete: function(extraContext){
        this.fireEvent("commitcomplete");

        if(extraContext && extraContext.successURL){
            window.onbeforeunload = Ext.emptyFn;
            window.location = extraContext.successURL;
        }
    },

    getJson : function(response) {
        return (response && undefined != response.getResponseHeader && undefined != response.getResponseHeader('Content-Type')
                && response.getResponseHeader('Content-Type').indexOf('application/json') >= 0)
                ? Ext.util.JSON.decode(response.responseText)
                : null;
    },

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

    requestDeleteAllRecords: function(options){
        options = options || {};

        //add a context flag to the request to saveRows
        var extraContext = Ext.apply({
            importPathway: 'ehr-importPanel'
            //,targetQC : 'Delete Requested'
        }, options);

        var commands = [];
        var records = [];
        this.each(function(s){
            s.removePhantomRecords();
            s.each(function(r){
                var recs = [];
                r.beginEdit();
                if(r.get('requestid') || r.get('requestId')){
                    //note: we reject changes since we dont want to retain modifications made in this form
                    r.reject();

                    //reset the date
                    if(r.get('daterequested'))
                        r.set('date', r.get('daterequested'));

                    //remove from this task
                    if(s.queryName!='tasks')
                        r.set('taskid', null);

                    r.set('QCState', EHR.permissionMap.qcMap.label['Request: Approved'].RowId);
                    r.set('qcstate', EHR.permissionMap.qcMap.label['Request: Approved'].RowId);
                }
                else {
                    r.set('QCState', EHR.permissionMap.qcMap.label['Delete Requested'].RowId);
                    r.set('qcstate', EHR.permissionMap.qcMap.label['Delete Requested'].RowId);
                }
                recs.push(r);


                if(recs.length){
                    var changes = s.getChanges(recs);
                    if(changes.length){
                        commands = commands.concat(changes);
                        records = records.concat(recs);
                    }
                }
            }, this);
        }, this);

        //NOTE: since this will navigate away from this page, we dont need to bother removing
        //these records from the store
        if(commands.length){
            this.commit(commands, records, extraContext);
        }
        else {
            this.onComplete(extraContext);
        }
    },

    getAllRecords: function(){
        var records = [];
        this.each(function(s){
            s.each(function(r){
                records.push(r)
            }, this);
        }, this);
        return records;
    },

    //NOTE: used for development.  should get removed eventually
    showStores: function(){
        this.each(function(s){
            if(s.getCount()){
                console.log(s.storeId);
                console.log(s);
                console.log('Num Records: '+s.getCount());
                console.log('Total Records: '+s.getTotalCount());
                console.log('Modified Records:');
                console.log(s.getModifiedRecords());
                s.each(function(rec)
                {
                    console.log('record ID: '+rec.id);
                    console.log('record is dirty?: '+rec.dirty);
                    console.log('record is phantom?: '+rec.phantom);
                    console.log('saveOperationInProgress? '+rec.saveOperationInProgress);
                    Ext.each(rec.fields.keys, function(f){
                        console.log(f + ': ' + rec.get(f));
                    }, s);
                }, s)
            }
        }, this);
    },
    showErrors: function(){
        console.log(this.getErrors());
    }
});


EHR.ext.StoreInheritance = {
    initInheritance: function(store) {
        store.on('beforemetachange', this.addInheritanceListeners, this);

        //if the store is already loaded, we need to refresh metadata
        if(store.reader.meta.fields){
            this.addInheritanceListeners(store);
        }
    },
    relationships: new Ext.util.MixedCollection(false, function(s){return s.key}),
    addInheritanceListeners: function(store, meta, field){
        meta = meta || store.reader.meta;

        if(!field){
            Ext.each(meta.fields, function(f){
                this.handleField(store, meta, f);
            }, this);
        }
        else {
            this.handleField(store, meta, field);
        }
        //b/c store.fields is read only, we need to manually reload metadata
        //this is necessary for setInitialValue() to be copied
        //console.log('refreshing metadata for store: '+store.storeId);
        store.reader.onMetaChange(meta);
    },
    handleField: function(store, meta, field){
        if(field.parentConfig){
            if(!field.parentConfig.parent)
                this.findParent(store, meta, field);

            if(field.parentConfig.parent)
                this.addInheritanceListener(store, field);
        }
    },
    findParent: function(store, meta, field){
        var targetStore;
        if(Ext.isFunction(field.parentConfig.storeIdentifier)){
            targetStore = field.parentConfig.storeIdentifier();
        }
        else {
            targetStore = this.find(function(s){
                for (var i in field.parentConfig.storeIdentifier){
                    if(s[i] != field.parentConfig.storeIdentifier[i])
                        return false;
                }
                return true;
            });
        }
        if(!targetStore){
            console.log('ERROR: target store not found');
            console.log(field.parentConfig);
            this.on('add', function(){
                this.addInheritanceListeners(store, meta, field)
            }, this, {single: true});
            return;
        }

        if(targetStore == store){
            //console.log('target store is parent, skipping')
            return;
        }

        //this function is used to retry a store when records are not found
        function retryStore(){
            //console.log('retrying store: '+targetStore.storeId+' for field :'+field.name);
            this.addInheritanceListeners(store, meta, field)
        }

        //in this case the store has not loaded yet
        if(!targetStore.fields){
            targetStore.on('load', retryStore, this, {single: true});
            return;
        }
//        //the store is loaded, but has no records
//        else if (!targetStore.getCount()){
//            //console.log('no records in store: '+targetStore.storeId);
//            targetStore.on('add', retryStore, this, {single: true});
//            return;
//        }
//
//        //console.log('parent found: '+targetStore.storeId+" for table "+store.storeId+' for field '+field.name);
//        if(field.parentConfig.recordIdentifier){
//            field.parentConfig.parent = field.parentConfig.recordIdentifier(targetStore);
//            if(!field.parentConfig.parent){
//                targetStore.on('add', retryStore, this, {single: true});
//            }
//        }
//        else {
//            //if recordIdentifier is not provided, we always take the first record
//            field.parentConfig.parent = targetStore.getAt(0);
//        }
        field.parentConfig.parent = targetStore;

    },
    addInheritanceListener: function(store, field){
        var key = [store.storeId, field.name].join(':');
        var config = {
            key: key,
            store: store,
            field: field,
            listeners: {},
            listenerTarget: null,
            parent: null
        };

        field.oldSetInitialValue = field.setInitialValue;
        var parent = field.parentConfig.parent;
        config.parent = parent;

        if (parent instanceof Ext.data.Store){
            config.listenerTarget = parent;

            function findParentRec(field, parent, childRecord){
                var parentRec;
                if(!field.parentConfig.recordIdentifier){
                    parentRec = parent.getAt(0);
                }
                else {
                    var idx = parent.findBy(function(record){return field.parentConfig.recordIdentifier.call(this, record, childRecord)}, this);
                    if(idx != -1)
                        parentRec = parent.getAt(idx);
                }

                return parentRec;
            }

            //console.log('adding '+field.name+' from : '+parent.store.storeId + '/to: '+store.storeId);
            config.listeners.update = function(parent, childStore){return function(store, rec, idx){
                var parentRec;
                childStore.each(function(rec){
                    parentRec = findParentRec(field, parent, rec);

                    if(!parentRec){
                        console.log('No matching record');
                        return;
                    }

                    //console.log('inheritance listener called on '+field.dataIndex+'/childStore: '+childStore.storeId+' /parentStore: '+store.storeId+'/rec: '+rec.id);
                    //console.log('setting value to: '+parentRec.get(field.parentConfig.dataIndex));
                    rec.set(field.dataIndex, parentRec.get(field.parentConfig.dataIndex));
                }, config);
            }}(parent, store);

            //TODO: we might need to account for the possibility of head records being deleted
//            config.listeners.remove = function(store, rec){
//                if(rec === field.parentConfig.parent){
//                    this.removeInheritanceListeners(store);
//                    this.addInheritanceListeners(store);
//                }
//            };

            field.setInitialValue = function(v, rec, f){
                var parentRec = findParentRec(field, parent, rec);
                if(!parentRec){
                    return;
                }

                //console.log('setting initial val for: '+f.name + ' to ' +parentRec.get(f.parentConfig.dataIndex));
                return parentRec.get(f.parentConfig.dataIndex);
            }
        }
        else {
            console.log('problem with parent');
            console.log(field.parentConfig.parent);
            return;
        }

        if(this.relationships.contains(key)){
            var oldConfig = this.relationships.get(key);
            console.log('key already exists: '+key);
            if(oldConfig.parent === config.parent){
                console.log('same parent - aborting');
                return;
            }
            else
                this.removeInheritanceListener(key);
        }

        this.relationships.add(config);
        for (var l in config.listeners){
            //console.log('adding  '+l+' listener from: '+config.store.storeId+' to: '+config.listenerTarget.storeId+'/'+config.field.name)
            config.listenerTarget.on(l, config.listeners[l], this);
        };

        //update any pre-existing records
        //NOTE: if called before render the grid throws an error
        store.each(function(rec){
            var parentRec = findParentRec(field, parent, rec);
            if(!parentRec)
                return;

            var initialVal = parentRec.get(field.parentConfig.dataIndex);

            rec.beginEdit();
            if(rec.get(field.dataIndex) != initialVal){
                rec.set(field.dataIndex, initialVal);
            }
            rec.endEdit();
        }, this);

    },
    removeInheritanceListeners: function(store){
        store.fields.each(function(f){
            this.removeInheritanceListener([store.storeId, f.name].join(':'));
        }, this);
    },
    removeInheritanceListener: function(key){
        var config = this.relationships.get(key);
        if(config){
            Ext.each(config.listeners, function(l){
                config.listenerTarget.un(l, config.listeners[l], this);
            }, this);
        }
    }
};
