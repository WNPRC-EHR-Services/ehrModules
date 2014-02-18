/*
 * Copyright (c) 2013-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
EHR.model.DataModelManager.registerMetadata('ClinicalReport', {
    allQueries: {
        date: {
            getInitialValue: function(v, rec){
                if (v){
                    return v;
                }
                else if (rec && rec.storeCollection && rec.storeCollection.getRemarksRec){
                    var rr = rec.storeCollection.getRemarksRec();
                    if (rr && rr.get('date')){
                        return rr.get('date');
                    }
                }

                return new Date();
            }
        }
    },
    byQuery: {
        'study.clinremarks': {
            project: {
                hidden: false,
                allowBlank: false
            },
            hx: {
                hidden: false
            }
        }
    }
});