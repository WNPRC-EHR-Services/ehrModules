/*
 * Copyright (c) 2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
var LABKEY = require("labkey");
var console = require("console");

function updateTable(row, oldRow, schemaName, tableName, pk, sourceField, targetField){
    var toUpdate = [];
    console.log('Table: '+tableName);

    LABKEY.Query.selectRows({
        schemaName: schemaName,
        queryName: tableName,
        scope: this,
        filterArray: [
            LABKEY.Filter.create(targetField, oldRow[sourceField], LABKEY.Filter.Types.EQUAL)
        ],
        success: function(data){
            if(data.rows && data.rows.length){
                var rowData;
                for (var i=0;i<data.rows.length;i++){
                    rowData = data.rows[i];
                    var object = {};
                    object[pk] = rowData[pk];
                    object[targetField] = row[sourceField];
                    toUpdate.push(object);
                }
            }
        },
        error: function(error){
            console.log('Select rows error');
            console.log(error);
        }
    });

    console.log('Records to update: '+toUpdate.length);

    if(toUpdate.length){
//        console.log(toUpdate[0]);
        LABKEY.Query.updateRows({
            schemaName: schemaName,
            queryName: tableName,
            rows: toUpdate,
            success: function(data){
                console.log('Success updating '+tableName)
            },
            error: function(error){
                console.log('updateRows Error');
                console.log(error);
            }
        });
    }
}
exports.updateTable = updateTable;