    /*
 * Copyright (c) 2011-2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

var {EHR, LABKEY, Ext, console, init, beforeInsert, afterInsert, beforeUpdate, afterUpdate, beforeDelete, afterDelete, complete} = require("ehr/triggers");

function setDescription(row, errors){
    //we need to set description for every field
    var description = new Array();

    if (row.score)
        description.push('BCS: '+ row.score);
    if (row.weightStatus)
        description.push('Weight Monitoring Needed? '+ row.weightStatus);

    if(row.tattoo_chest)
        description.push('Tattoo Chest '+ row.tattoo_chest);
    if(row.tattoo_thigh)
        description.push('Tattoo Thigh '+ row.tattoo_thigh);
    if(row.tattoo_remark)
        description.push('Tattoo Remark '+ row.tattoo_remark);

    return description;
}