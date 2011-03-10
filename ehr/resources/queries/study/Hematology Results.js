/*
 * Copyright (c) 2010-2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

var {EHR, LABKEY, Ext, shared, console, init, beforeInsert, afterInsert, beforeUpdate, afterUpdate, beforeDelete, afterDelete, complete} = require("ehr/validation");




function onETL(row, errors){
    if(row.stringResults){
        EHR.ETL.fixChemValue(row, errors);
    }
}

function setDescription(row, errors){
    //we need to set description for every field
    var description = new Array();

    if(row.testid)
        description.push('Test: '+EHR.validation.nullToString(row.testid));

    if(row.result)
        description.push('Result: '+EHR.validation.nullToString(row.result));

    if(row.qualResult)
        description.push('Qualitative Result: '+EHR.validation.nullToString(row.qualResult));

    return description;
}
