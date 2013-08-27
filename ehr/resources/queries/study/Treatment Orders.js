/*
 * Copyright (c) 2010-2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

require("ehr/triggers").initScript(this);

function onInit(event, helper){
    //TODO: I dont think this should be set, but it used to be.  Might need in WNPRC_Overrides?
//    helper.setScriptOptions({
//        removeTimeFromDate: true,
//        removeTimeFromEndDate: true
//    });
}

function onUpsert(helper, scriptErrors, row, oldRow){
    if (!helper.isETL()){
        if (row.volume && row.concentration){
            var expected = Math.round(row.volume * row.concentration * 1000) / 1000;
            if (row.amount != expected){
                EHR.Server.Utils.addError(scriptErrors, 'amount', 'Amount does not match volume for this concentration. Expected: '+expected, 'WARN');
                //EHR.Server.Utils.addError(scriptErrors, 'volume', 'Volume does not match amount for this concentration. Expected: '+expected, 'WARN');
            }
        }
    }
}