/*
 * Copyright (c) 2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

var {EHR, LABKEY, Ext, console, init, beforeInsert, afterInsert, beforeUpdate, afterUpdate, beforeDelete, afterDelete, complete} = require("ehr/validation");




//TODO: cascade deletes to ehr.cage_obs


//insert into ehr.cage_obs
function onAfterInsert(errors, scriptContext, row, oldRow){
    //find animals overlapping with this record
    if(row.Date && row.room){
        var sql = "SELECT * FROM study.housing h " +
        "WHERE h.room='"+row.room+"' AND " +
        "h.date <= '"+row.Date+"' AND " +
        "(h.odate >= '"+row.Date+"' OR h.odate IS NULL) AND " +
        "h.qcstate.publicdata = true ";

        if(row.cage)
            sql += " AND h.cage='"+row.cage+"'";
        //console.log(sql);
        var toInsert = [];
        LABKEY.Query.executeSql({
            schemaName: 'study',
            sql: sql,
            success: function(data){
                if(data && data.rows && data.rows.length){
                    var obj;
                    Ext.each(data.rows, function(r){
                        obj = {Id: r.Id, QCStateLabel: row.QCStateLabel, RoomAtTime: r.room, date: new Date(row.date), observationRecord: row.lsid, housingRecord: r.lsid, remark: row.remark, taskid: row.taskid, performedby: row.performedby};

                        if(row.cage)
                            obj.CageAtTime = r.cage;

                        toInsert.push(obj);
                    }, this);
                }
                else {
                    console.log('No animals found in this room/cage: '+row.room + '/'+row.cage)
                }
            },
            failure: EHR.onFailure
        });

        if(toInsert.length){
            LABKEY.Query.insertRows({
                schemaName: 'study',
                queryName: 'Cage Observations',
                rows: toInsert,
                scope: this,
                success: function(data){
                    console.log('Success Cascade Inserting')
                },
                failure: function(error){
                    console.log(error.exceptionClass)
                }
            });
        }
    }
}

//TODO
//insert into ehr.cage_obs
//function onAfterUpdate(errors, scriptContext, row, oldRow){
//    //find animals overlapping with this record
//    if(row.Date && row.room){
//        //first we locate existing records to avoid unnecessary inserts
//        var existingRecords = [];
//        var distinctIds = [];
//        LABKEY.Query.selectRows({
//            schemaName: 'study',
//            queryName: 'Cage Observations',
//            filterArray: [
//                LABKEY.Filter.create('observationRecord', row.lsid, LABKEY.Filter.Types.EQUAL)
//            ],
//            scope: this,
//            success: function(data){
//                Ext.each(data.rows, function(r){
//                    distinctIds.push(r.Id);
//                    existingRecords.push(r);
//                }, this);
//            },
//            failure: EHR.onFailure
//        });
//        distinctIds = distinctIds.unique();
//
//        var sql = "SELECT * FROM study.housing h " +
//        "WHERE h.room='"+row.room+"' AND " +
//        "h.date <= '"+row.Date+"' AND " +
//        "(h.odate >= '"+row.Date+"' OR h.odate IS NULL) AND " +
//        "h.qcstate.publicdata = true ";
//
//        if(row.cage)
//            sql += " AND h.cage='"+row.cage+"'";
//        //console.log(sql);
//        var toInsert = [];
//        LABKEY.Query.executeSql({
//            schemaName: 'study',
//            sql: sql,
//            success: function(data){
//                if(data && data.rows && data.rows.length){
//                    var obj;
//                    Ext.each(data.rows, function(r){
//                        obj = {Id: r.Id, QCStateLabel: row.QCStateLabel, RoomAtTime: r.room, date: new Date(row.date), observationRecord: row.lsid, housingRecord: r.lsid, remark: row.remark, taskid: row.taskid, performedby: row.performedby};
//
//                        if(row.cage)
//                            obj.CageAtTime = r.cage;
//
//                        toInsert.push(obj);
//                    }, this);
//                }
//                else {
//                    console.log('No animals found in this room/cage: '+row.room + '/'+row.cage)
//                }
//            },
//            failure: EHR.onFailure
//        });
//
//        if(toInsert.length){
//            LABKEY.Query.insertRows({
//                schemaName: 'study',
//                queryName: 'Cage Observations',
//                rows: toInsert,
//                scope: this,
//                success: function(data){
//                    console.log('Success Cascade Inserting')
//                },
//                failure: function(error){
//                    console.log(error.exceptionClass)
//                }
//            });
//        }
//    }
//}

//cascade delete
function onAfterDelete(errors, scriptContext, row, oldRow){
    var toDelete = [];
    if(row.lsid){
        LABKEY.Query.selectRows({
            schemaName: 'study',
            queryName: 'Cage Observations',
            filterArray: [
                LABKEY.Filter.create('observationRecord', row.lsid, LABKEY.Filter.Types.EQUAL)
            ],
            scope: this,
            success: function(data){
                Ext.each(data.rows, function(r){
                    toDelete.push({lsid: r.lsid});
                }, this);
            },
            failure: EHR.onFailure
        });
    }
console.log(toDelete);
    if(toDelete.length){
        LABKEY.Query.deleteRows({
            schemaName: 'study',
            queryName: 'Cage Observations',
            rows: toDelete,
            scope: this,
            success: function(data){
                console.log('Success Cascade Deleting');
            },
            failure: function(error){
                console.log(error.exceptionClass)
            }
        });
    }
}


function setDescription(row, errors){
    return ['Cage Observation'];
}
