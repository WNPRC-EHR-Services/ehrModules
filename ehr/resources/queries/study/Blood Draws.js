/*
 * Copyright (c) 2010-2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

require("ehr/triggers").initScript(this);

function onInit(event, helper){
    helper.decodeExtraContextProperty('bloodInTransaction');

    helper.registerRowProcessor(function(helper, row){
        if (!row.row)
            return;

        row = row.row;

        if (!row.Id || !row.quantity){
            return;
        }

        var bloodInTransaction = helper.getProperty('bloodInTransaction');
        bloodInTransaction = bloodInTransaction || {};
        bloodInTransaction[row.Id] = bloodInTransaction[row.Id] || [];

        var shouldAdd = true;
        if (row.objectid){
            LABKEY.ExtAdapter.each(bloodInTransaction[row.Id], function(r){
                if (r.objectid == row.objectid){
                    if (r.quantity != row.quantity){
                        r.quantity = row.quantity;
                    }
                    else {
                        shouldAdd = false;
                        return false;
                    }
                }
            }, this);
        }

        if (shouldAdd){
            bloodInTransaction[row.Id].push({
                objectid: row.objectid,
                date: row.date,
                qcstate: row.QCState,
                quantity: row.quantity
            });
        }

        helper.setProperty('bloodInTransaction', bloodInTransaction);
    });
}

function afterBecomePublic(scriptErrors, helper, row, oldRow){
console.log('creating requests');

    if (row.additionalServices && row.requestid == null){
        helper.getJavaHelper().createRequestsForBloodAdditionalServices(row.Id, row.project, row.additionalServices);
    }
}

function onUpsert(helper, scriptErrors, row, oldRow){
    if (!helper.isETL() && row.date && !row.daterequested){
        if (!oldRow || !oldRow.daterequested){
            row.daterequested = row.date;
        }
    }

    if (!row.quantity && row.num_tubes && row.tube_vol){
        row.quantity = row.num_tubes * row.tube_vol;
    }

    if (row.quantity === 0){
        EHR.Server.Utils.addError(scriptErrors, 'quantity', 'This field is required', 'WARN');
    }

    if (!helper.isETL()){
        if (row.date && !row.requestdate)
            row.requestdate = row.date;

        if (!row.quantity && row.num_tubes && row.tube_vol){
            row.quantity = row.num_tubes * row.tube_vol;
        }

        if (row.additionalServices) {
            if (row.tube_type || row.tube_vol){
                var tubeType = row.tube_type || null;
                var quantity = row.quantity || 0;
                var msgs = helper.getJavaHelper().validateBloodAdditionalServices(row.additionalServices, tubeType, quantity);
                if (msgs && msgs.length){
                    LABKEY.ExtAdapter.each(msgs, function(msg){
                        EHR.Server.Utils.addError(scriptErrors, 'additionalServices', msg, 'WARN');
                    }, this);
                }
            }
        }

        if (row.quantity && row.tube_vol){
            if (row.quantity != (row.num_tubes * row.tube_vol)){
                EHR.Server.Utils.addError(scriptErrors, 'quantity', 'Quantity does not match tube vol / # tubes', 'INFO');
                EHR.Server.Utils.addError(scriptErrors, 'num_tubes', 'Quantity does not match tube vol / # tubes', 'INFO');
            }
        }

        EHR.Server.Validation.checkRestraint(row, scriptErrors);

        if (row.Id && row.date && row.quantity){
            // volume is handled differently for requests vs actual draws
            var errorQC;
            if (EHR.Server.Security.getQCStateByLabel(row.QCStateLabel)['metadata/isRequest'] && !row.taskid)
                errorQC = 'ERROR';
            else
                errorQC = 'INFO';

            var map = helper.getProperty('bloodInTransaction');
            var draws = [];
            if (map && map[row.Id]){
                draws = map[row.Id];
            }

            var msg = helper.getJavaHelper().verifyBloodVolume(row.id, row.date, draws, row.objectid, row.quantity);
            if (msg != null){
                EHR.Server.Utils.addError(scriptErrors, 'num_tubes', msg, errorQC);
                EHR.Server.Utils.addError(scriptErrors, 'quantity', msg, errorQC);
            }
        }
    }
}