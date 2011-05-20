/*
 * Copyright (c) 2010-2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */


var {EHR, LABKEY, Ext, console, init, beforeInsert, afterInsert, beforeUpdate, afterUpdate, beforeDelete, afterDelete, complete} = require("ehr/validation");

function onUpsert(context, errors, row, oldRow){
    if (
        row.feces ||
        row.menses ||
        row.behavior ||
        row.breeding ||
        row.other ||
        row.tlocation ||
        row.remark ||
        row.otherbehavior
    ){
        row.isIrregular = true;
    }
    else {
        row.isIrregular = false;
    }

    //todo: testing needed

    //store room at time / cage at time
    if(context.extraContext.dataSource != 'etl' && row.id && row.date){
        var sql = "SELECT h.room, h.cage FROM study.housing h " +
            "WHERE h.id='"+row.Id+"' AND h.date <= '"+EHR.validation.dateTimeToString(row.date) +"' " +
                "AND (h.enddate > '"+EHR.validation.dateTimeToString(row.date)+"' OR h.enddate IS NULL) " +
                "AND h.qcstate.publicdata = TRUE";
        LABKEY.Query.executeSql({
            schemaName: 'study',
            sql: sql,
            scope: this,
            success: function(data){
                if(data && data.rows && data.rows.length){
                    row.RoomAtTime = data.rows[0].room;
                    row.CageAtTime = data.rows[0].cage;
                    console.log('Room at time: '+row);
                }
            },
            failure: EHR.onFailure
        });
    }

    //if reporting menses, make sure the anmimal is female
    if(row.menses && row.id)
        EHR.validation.verifyIsFemale(row, errors, 'menses');

}

//TODO: cascade delete/update records in observations table
function onDelete(errors, context, row){
    var toDelete = [];
    var sql = "SELECT distinct lsid from study.\"Clinical Observations\" WHERE  parentid='"+row.lsid+"'";
    LABKEY.Query.executeSql({
        schemaName: 'study',
        sql: sql,
        scope: this,
        success: function(data){
            if(data && data.rows && data.rows.length){
                toDelete.push({lsid: row.lsid});
            }
        },
        failure: EHR.onFailure
    });

    if(toDelete.length){
        LABKEY.Query.deleteRows({
            schemaName: 'study',
            queryName: 'Clinical Observations',
            scope: this,
            rows: toDelete,
            extraContext: {
                schemaName: 'study',
                queryName: 'Clinical Observations'
            },
            success: function(data){
                console.log('Deleted child records in clinical observations');
            },
            failure: EHR.onFailure
        });
    }
}

function onBecomePublic(errors, scriptContext, row, oldRow){
    var rows = [];
    //auto-update observations table with mens, diar.
    if(row.menses){
        rows.push({category: 'Irregular Obs', parentid: row.objectid, observation: row.mens, remark: 'mens: '+row.menses, QCStateLabel: row.QCStateLabel})
    }

    if(row.feces){
        rows.push({category: 'Irregular Obs', parentid: row.objectid, observation: row.feces, remark: 'diar: '+row.feces, QCStateLabel: row.QCStateLabel})
    }

    if(rows.length){
        LABKEY.Query.insertRows({
            schemaName: 'study',
            queryName: 'Clinical Observations',
            rows: rows,
            scope: this,
            success: function(data){
                console.log('Success')
            },
            failure: function(error){
                console.log(error.exceptionClass)
            }
        });
    }
}


function setDescription(row, errors){
    //we need to set description for every field
    var description = new Array();

    if(row.feces)
        description.push('Feces: '+row.feces);
    if(row.menses)
        description.push('Menses: '+row.menses);
    if(row.behavior)
        description.push('Behavior: '+row.behavior);
    if(row.breeding)
        description.push('Breeding: '+row.breeding);
    if(row.other)
        description.push('Other: '+row.other);
    if(row.tlocation)
        description.push('Trauma Location: '+row.tlocation);
    if(row.otherbehavior)
        description.push('Other Behavior: '+row.otherbehavior);

    if(!row.isIrregular)
        description.push('No Irregular Observations');

    return description;
}


