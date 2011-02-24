Ext.ns('EHR.ext.Metadata');

/*
 new properties:

 noDuplicateByDefault
 allowDuplicateValue

 noSaveInTemplateByDefault
 allowSaveInTemplate

 ignoreColWidths
 defaultValue
 colModel = {}
 setInitialValue()
 parentConfig: {
 storeIdentifier:  {queryName: 'tasks', schemaName: 'ehr'}
 ,dataIndex: 'taskid'
 }
 shownInGrid
 shownInForm
 useNull  //this is ext, but not documented
 editorConfig
 gridEditorConfig
 formEditorConfig
 isAutoExpandColumn

 */
EHR.ext.getTableMetadata = function(queryName, sources)
{
    var meta = {};

    EHR.UTILITIES.rApplyClone(meta, EHR.ext.Metadata.Standard.allQueries);
//
    if (EHR.ext.Metadata.Standard.byQuery[queryName])
    {
        EHR.UTILITIES.rApplyClone(meta, EHR.ext.Metadata.Standard.byQuery[queryName]);
    }

    if (sources && sources.length)
    {
        Ext.each(sources, function(source)
        {
            if (EHR.ext.Metadata[source])
            {
                if (EHR.ext.Metadata[source].allQueries)
                {
                    EHR.UTILITIES.rApplyClone(meta, EHR.ext.Metadata[source].allQueries);
                }

                if (EHR.ext.Metadata[source].byQuery && EHR.ext.Metadata[source].byQuery[queryName])
                {
                    EHR.UTILITIES.rApplyClone(meta, EHR.ext.Metadata[source].byQuery[queryName]);
                }

            }
        }, this);
    }

    return meta;
};

EHR.ext.Metadata.Standard = {
    allQueries: {
        fieldDefaults: {
            lazyCreateStore: false,
            ignoreColWidths: true
        },
        Id: {
            xtype: 'ehr-participant',
            dataIndex: 'Id',
            nullable: false,
            allowBlank: false,
            lookups: false,
            colModel: {
                width: 70
            },
            noDuplicateByDefault: true
        },
        'id/curlocation/location': {
            hidden: true,
            allowBlank: true,
            nullable: true,
            shownInGrid: true,
            caption: 'Current Location',
            header: 'Current Location',
            lookups: false,
            allowDuplicateValue: false
        }
        ,date: {
            allowBlank: false,
            nullable: false,
            noDuplicateByDefault: true,
            format: 'Y-m-d H:i',
            editorConfig: {
                dateFormat: 'Y-m-d',
                timeFormat: 'H:i'
            },
            xtype: 'xdatetime',
            colModel: {
                fixed: true,
                width: 130
            },
            setInitialValue: function(v, rec)
            {
                return v ? v : new Date()
            }
        }
        ,begindate: {
            xtype: 'xdatetime',
            hidden: true,
            format: 'Y-m-d H:i',
            editorConfig: {
                dateFormat: 'Y-m-d',
                timeFormat: 'H:i'
            },
            colModel: {
                fixed: true,
                width: 130
            }
        }
        ,enddate: {
            xtype: 'xdatetime',
            colModel: {
                fixed: true,
                width: 130
            },
            format: 'Y-m-d H:i',
            editorConfig: {
                dateFormat: 'Y-m-d',
                timeFormat: 'H:i'
            }
        }
        ,code: {
            xtype: 'ehr-snomedcombo'
            ,lookups: true
            ,colModel: {
                width: 150
            }
        }
        ,tissue: {
            xtype: 'ehr-snomedcombo',
            editorConfig: {
                defaultSubset: ''
            }
        }
        ,performedby: {
            colModel: {
                width: 65
            }
        }
        ,userid: {
            lookup: {
                schemaName: 'core',
                queryName: 'users',
                displayColumn: 'Email',
                keyColumn: 'UserId',
                sort: 'Email'
            }
            ,formEditorConfig:{readOnly: true}
            ,defaultValue: LABKEY.Security.currentUser.id
            ,shownInGrid: false
        }
        ,created: {hidden: true}
        //,CreatedBy: {hidden: true, shownInGrid: false}
        ,AnimalVisit: {hidden: true}
        ,Modified: {hidden: true}
        ,ModifiedBy: {hidden: true, shownInGrid: false, useNull: true}
        ,SequenceNum: {hidden: true}
        ,Description: {hidden: true}
        ,Dataset: {hidden: true}
        ,category: {hidden: true}
        ,QCState: {
            allowBlank: false,
            defaultValue: 2,
            shownInGrid: false,
            hidden: true
        }
        ,parentId: {
            lookups: false
        }
        ,taskid: {
            lookups: false
        }
        ,AgeAtTime: {hidden: true}
        ,Notes: {hidden: true}
        ,DateOnly: {hidden: true}
        ,Survivorship: {hidden: true}
        ,remark: {
            xtype: 'ehr-remark',
            isAutoExpandColumn: true,
            editorConfig: {
                style: 'width: 100%;max-width: 600px;min-width: 200px;'
            }
        }
        ,project: {
            xtype: 'ehr-project'
            ,shownInGrid: false
            ,lookup: {
                columns: 'project,account'
            }
        }
        ,account: {
            shownInGrid: false
        }
    },
    byQuery: {
        tasks: {
            taskid: {
                setInitialValue: function(v, rec)
                {
                    v = v || this.taskId || LABKEY.Utils.generateUUID();
                    this.taskId = v;
                    return v;
                },
                parentConfig: false,
                hidden: false
            },
            qcstate: {
                allowBlank: false,
                defaultValue: 2,
                shownInGrid: false,
                parentConfig: false,
                hidden: false
            },
            assignedto: {
                useNull: true
            }
        },
        Histology: {
            diagnosis: {
                xtype: 'ehr-snomedcombo'
            },
            slideNum: {
                setInitialValue: function(v, rec){
                    var idx = Ext.StoreMgr.get('study||Histology||').getCount()+1;
                    return v || idx;
                }
            }
        },
        'Clinical Encounters': {
            objectid: {
                setInitialValue: function(v, rec)
                {
                    return v || LABKEY.Utils.generateUUID();
                }
            }
        },
        'Dental Status': {
            gingivitis: {allowBlank: false, lookupNullCaption: 'N/A'},
            tartar: {allowBlank: false, lookupNullCaption: 'N/A'}
        },
        'Necropsy Diagnosis': {
            duration: {
                xtype: 'ehr-snomedcombo',
                editorConfig: {
                    defaultSubset: ''
                }
            },
            severity: {
                xtype: 'ehr-snomedcombo',
                editorConfig: {
                    defaultSubset: ''
                }
            },
            distribution: {
                xtype: 'ehr-snomedcombo',
                editorConfig: {
                    defaultSubset: ''
                }
            },
            process: {
                xtype: 'ehr-snomedcombo',
                editorConfig: {
                    defaultSubset: ''
                }
            }
        },
        'Treatment Orders': {
            date: {
                allowBlank: false,
                setInitialValue: function(v, rec)
                {
                    return v ? v : new Date()
                },
                shownInGrid: true
            }
            ,CurrentRoom: {lookups: false}
            ,CurrentCage: {lookups: false}
            ,volume: {shownInGrid: false}
            ,vunits: {shownInGrid: false}
            ,conc: {shownInGrid: false}
            ,cunits: {shownInGrid: false}
            ,amount: {shownInGrid: false}
            ,units: {shownInGrid: false}
            ,route: {shownInGrid: false}
            ,code: {
                editorConfig: {
                    defaultSubset: 'Treatment Codes'
                }
            }
        },
        Project: {
            project: {
                xtype: 'textfield',
                lookups: false
            }
        },
        Alopecia: {
            head: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            dorsum: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            rump: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            shoulders: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            upperArms: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            lowerArms: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            hips: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            upperLegs: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            lowerLegs: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            other: {xtype: 'ehr-remoteradiogroup', includeNullRecord: false, defaultValue: 'NA', formEditorConfig: {columns: 3}},
            score: {lookupNullCaption: '', useNull: true}
        },
        Restraint: {
//            enddate: {
//                hidden: true
//            },
            type: {
                formEditorConfig: {xtype: 'ehr-remoteradiogroup', columns: 2},
                defaultValue: ''
            }
        },
        cage_observations: {
            date: {
                parentConfig: false,
                hidden: false,
                allowBlank: false,
                setInitialValue: function(v, rec)
                {
                    return v ? v : new Date()
                }
            },
            //NOTE: labkey is reporting the table as '_select' otherwise
            room: {
                lookup: {queryName: 'rooms'}
            }
        },
        Charges: {
            type: {
                includeNullRecord: false,
                lookup: {
                    columns: 'category,description,cost',
                    sort: 'category,description',
                    displayColumn: 'description'
                },
                editorConfig: {
                    tpl : function()
                    {
                        var tpl = new Ext.XTemplate(
                                '<tpl for=".">' +
                                        '<div class="x-combo-list-item">{[ values["category"] ? "<b>"+values["category"]+":</b> "  : "" ]}{[ values["description"] ]}' +
                                        '&nbsp;</div></tpl>'
                                );
                        return tpl.compile()
                    }(),
                    listeners: {
                        select: function(combo, rec)
                        {
                            if (this.ownerCt.boundRecord)
                            {
                                this.ownerCt.boundRecord.set('unitCost', rec.get('cost'));
                                this.ownerCt.boundRecord.set('type', rec.get('description'));
                            }
                        }
                    }
                }
            },
            unitCost: {
                xtype: 'displayfield'
            },
            quantity: {
                allowBlank: false,
                defaultValue: 1
            },
            performedby: {
                hidden: true
            },
            remark: {
                shownInGrid: false
            }
        },
        'Irregular Observations': {
            RoomAtTime: {hidden: true}
            ,CageAtTime: {hidden: true}
            ,feces: {shownInGrid: false, xtype: 'ehr-remotecheckboxgroup', includeNullRecord: false, formEditorConfig: {columns: 3}}
            ,menses: {shownInGrid: false, xtype: 'ehr-remoteradiogroup', defaultValue: null, value: null, includeNullRecord: true, lookupNullCaption: '[none]', formEditorConfig: {columns: 3}}
            ,other: {shownInGrid: false, xtype: 'ehr-remotecheckboxgroup', includeNullRecord: false, formEditorConfig: {columns: 3}}
            ,tlocation: {shownInGrid: false, xtype: 'multiselect', includeNullRecord: false, lookup: {schemaName: 'ehr_lookups', queryName: 'obs_tlocation', displayColumn: 'location', keyColumn: 'location', sort: 'sort_order'}}
            ,breeding: {shownInGrid: false, xtype: 'ehr-remotecheckboxgroup', includeNullRecord: false, formEditorConfig: {columns: 3}}
            ,project: {hidden: true}
            ,account: {hidden: true}
            ,performedby: {allowBlank: false}
            ,remark: {
                shownInGrid: false,
                formEditorConfig: {
                    storeCfg: {
                        schemaName: 'ehr_lookups',
                        queryName: 'obs_remarks',
                        valueField: 'remark',
                        displayField: 'title'
                    }
                }
            }
            ,behavior: {shownInGrid: false, xtype: 'ehr-remotecheckboxgroup', includeNullRecord: false, formEditorConfig: {columns: 3}}
            ,otherbehavior: {shownInGrid: false}
//            ,certified: {
//                xtype: 'ehr-approveradio',
//                isAutoExpandColumn: true,
//                colModel: {
//                    width: 30
//                },
//                //we allow either true or null, so it works with client-side 'allowBlank'
//                convert: function(v){
//                    return (v===true ? true : null);
//                },
//                allowDuplicateValue: false
//            }
        },
        'Clinpath Requests': {
            dateCompleted: {hidden: true}
            ,status: {hidden: true}
            ,requestor: {defaultValue: LABKEY.Security.currentUser.email}
            ,notify1: {shownInGrid: false}
            ,notify2: {shownInGrid: false}

        },
        Menses: {
            project: {hidden: true},
            account: {hidden: true}
        },
        'Pair Tests': {
            project: {hidden: true},
            account: {hidden: true}
        },
        'Behavior Remarks': {
            project: {hidden: true},
            account: {hidden: true}
        },
        Arrival: {
            project: {hidden: true},
            account: {hidden: true}
        },
        Departure: {
            project: {hidden: true},
            account: {hidden: true}
        },
        Deaths: {
            project: {hidden: true},
            account: {hidden: true},
            necropsy: {lookups: false}
        },
        'Error Reports': {
            project: {hidden: true},
            account: {hidden: true}
        },
        Birth: {
            project: {hidden: true},
            account: {hidden: true},
            dam: {lookups: false, allowBlank: false},
            sire: {lookups: false},
            gender: {includeNullRecord: false, allowBlank: false}
        },
        'Blood Draws' : {
            caretaker: {shownInGrid: false}
            ,remark: {shownInGrid: false}
            ,project: {shownInGrid: false}
            ,done_for: {shownInGrid: false, formEditorConfig:{readOnly: true}}
            ,done_by: {shownInGrid: false}
            ,sampleId: {shownInGrid: false}
            ,tube_type: {
                xtype: 'combo',
                lookup: {
                    schemaName: 'ehr_lookups',
                    queryName: 'blood_draw_tube_type',
                    displayColumn: 'type',
                    keyColumn: 'type',
                    columns: 'type,volume'
                },
                editorConfig: {
                    listeners: {
                        select: function(field, rec){
                            if(this.ownerCt.boundRecord){
                                this.ownerCt.boundRecord.set('tube_type', rec.get('type'));
                                this.ownerCt.boundRecord.set('tube_vol', rec.get('volume'));
                            }
                            else {
                                var theField = this.ownerCt.getForm().findField('tube_vol');
                                theField.setValue.defer(200, theField, [rec.get('volume')]);
                            }
                        }
                    }
                }
            }
            ,quantity: {
                xtype: 'displayfield',
                editorConfig: {
                    calculateQuantity: function(){
                        var form = this.ownerCt.getForm();
                        var numTubes = form.findField('num_tubes').getValue();
                        var tube_vol = form.findField('tube_vol').getValue();

                        var quantity = numTubes*tube_vol;
                        if(this.ownerCt.boundRecord)
                            this.ownerCt.boundRecord.set.defer(200, this.ownerCt.boundRecord, ['quantity', quantity]);
                        else
                            this.setValue.defer(200, this, [quantity]);
                    }
                }
            }
            ,num_tubes: {
                editorConfig: {
                    listeners: {
                        change: function(field, val){
                            var qField = this.ownerCt.getForm().findField('quantity');
                            qField.calculateQuantity.call(qField);
                        }
                    }
                }
            }
            ,tube_vol: {
                editorConfig: {
                    listeners: {
                        change: function(field, val){
                            var qField = this.ownerCt.getForm().findField('quantity');
                            qField.calculateQuantity.call(qField);
                        }
                    }
                }
            }
        },
        'Procedure Codes': {
            code: {
                editorConfig: {
                    defaultSubset: 'Procedures'
                }
            },
            performedby: {
                hidden: true
            }
        },
        'Drug Administration': {
            enddate: {
                shownInGrid: false
            }
            ,code: {
                editorConfig: {
                    defaultSubset: 'Drugs'
                }
            }
            ,date: {
                header: 'Start Time'
                ,label: 'Start Time'
                ,hidden: false
            }
            ,HeaderDate: {
                xtype: 'xdatetime'
                ,hidden: true
                ,shownInGrid: false
            }
            ,remark: {shownInGrid: false}
            ,dosage: {
                xtype: 'ehr-drugdosefield',
                shownInGrid: false,
                combineWithNext: true
            }
            ,dosage_units: {
                shownInGrid: false
                //TODO: lookup against list of known drugs
                ,editorConfig: {
                    fieldLabel: null
                }
            }
            ,concentration: {
                //TODO: lookup against list of known drugs
                shownInGrid: false,
                combineWithNext: true,
                editorConfig: {
                    decimalPrecision: 10
                }
            }
            ,conc_units: {
                //TODO: lookup against list of known drugs
                shownInGrid: false
                ,lookup: {columns: '*'}
                ,editorConfig: {
                    fieldLabel: null
                    ,listeners: {
                        select: function(combo, rec)
                        {
                            var parent = this.findParentByType('ehr-formpanel');
                            if (parent && parent.boundRecord)
                            {
                                parent.boundRecord.set('amount_units', rec.get('numerator'));
                                parent.boundRecord.set('conc_units', rec.get('unit'));
                                parent.boundRecord.set('vol_units', rec.get('denominator'));
                                parent.boundRecord.set('dosage_units', rec.get('numerator')+'/kg');
                            }
//                            else {
//                            theField.setValue(rec.get('denominator'));
//                            theField.fireEvent('change', theField, rec.get('denominator'));
//                            }
                        }
                    }
                }
            }
            ,route: {shownInGrid: false}
            ,volume: {
                combineWithNext: true
            }
            ,vol_units: {
                editorConfig: {
                    fieldLabel: null
                }
            }
            ,amount: {
                //xtype: 'ehr-drugamountfield'
                combineWithNext: true
                ,shownInGrid: false
                ,colModel: {
                    width: 40
                }
            }
            ,amount_units: {
                shownInGrid: false
                ,colModel: {
                    width: 70
                }
                ,editorConfig: {
                    fieldLabel: null
                }
            }
        },
        Notes: {
            project: {hidden: true},
            account: {hidden: true}
        },
        'Problem List': {
            project: {hidden: true},
            account: {hidden: true},
            performedby: {hidden: true},
            problem_no: {shownInInsertView: false}
        },
        'Clinical Observations': {
            observation: {
                xtype: 'ehr-remoteradiogroup',
                //defaultValue: 'Normal',
                allowBlank: false,
                includeNullRecord: false,
                editorConfig: {columns: 2},
                lookup: {
                    schemaName: 'ehr_lookups',
                    queryName: 'normal_abnormal',
                    displayColumn: 'state',
                    keyColumn: 'state',
                    sort: '-state'
                }
            },
            date: {
                label: 'Time'
            }
        },
//        'TB Tests': {
//            date: {xtype: 'xdatetime'}
//        },
        Weight: {
            project: {
                hidden: true
            }
            ,account: {
                hidden: true
            }
            ,weight: {
                allowBlank: false
            }
        }
    }
};

EHR.ext.Metadata.Task = {
    allQueries: {
        QCState: {
            parentConfig: {
                storeIdentifier: {queryName: 'tasks', schemaName: 'ehr'},
                dataIndex: 'qcstate'
            }
            ,hidden: true
            ,defaultValue: 2
        }
        ,taskid: {
            parentConfig: {
                storeIdentifier:  {queryName: 'tasks', schemaName: 'ehr'}
                ,dataIndex: 'taskid'
            }
            ,hidden: true
        }
    },
    byQuery: {
        tasks: {
            category: {defaultValue: 'Task'}
        }
        ,'Blood Draws': {
            done_for:{xtype: 'displayfield'}
        }
    }
};

EHR.ext.Metadata.SimpleForm = {
    allQueries: {
        QCState: {
            parentConfig: {
                storeIdentifier: {queryName: 'tasks', schemaName: 'ehr'},
                dataIndex: 'qcstate'
            }
            ,hidden: true
            ,defaultValue: 2
        }
        ,taskid: {
            parentConfig: {
                storeIdentifier:  {queryName: 'tasks', schemaName: 'ehr'}
                ,dataIndex: 'taskid'
            }
            ,hidden: true
        }
    },
    byQuery: {
        tasks: {
            category: {
                defaultValue: 'Generic Form'
            }
        }
    }
};


EHR.ext.Metadata.Encounter = {
    allQueries: {
        Id: {
            parentConfig: {
                storeIdentifier: {queryName: 'Clinical Encounters', schemaName: 'study'},
                dataIndex: 'Id'
            }
            ,hidden: true
            ,shownInGrid: false
        }
        ,date: {
            parentConfig: {
                storeIdentifier: {queryName: 'Clinical Encounters', schemaName: 'study'},
                dataIndex: 'date'
            }
            ,hidden: true
            ,shownInGrid: false
        }
        ,parentId: {
            parentConfig: {
                storeIdentifier: {queryName: 'Clinical Encounters', schemaName: 'study'},
                dataIndex: 'objectid'
            }
            ,hidden: true
            ,shownInGrid: false
            ,allowBlank: false
        }
        ,project: {
            parentConfig: {
                storeIdentifier: {queryName: 'Clinical Encounters', schemaName: 'study'},
                dataIndex: 'project'
            }
            ,hidden: true
            ,shownInGrid: false
        }
        ,account: {
            parentConfig: {
                storeIdentifier: {queryName: 'Clinical Encounters', schemaName: 'study'},
                dataIndex: 'account'
            }
            ,hidden: true
            ,shownInGrid: false
        }
    },
    byQuery: {
        'Treatment Orders': {
            date: {
                parentConfig: false,
                hidden: false,
                allowBlank: false,
                setInitialValue: function(v, rec)
                {
                    return v ? v : new Date()
                },
                shownInGrid: true
            }
        },
        'Drug Administration': {
            HeaderDate: {
                parentConfig: {
                    storeIdentifier: {queryName: 'Clinical Encounters', schemaName: 'study'},
                    dataIndex: 'date'
                }
            }
            ,begindate: {
                hidden: false
            }
        },
        'Clinical Encounters': {
            parentId: {
                parentConfig: false,
                allowBlank: true
            },
            Id: {
                parentConfig: null,
                hidden: false
            },
            date: {
                parentConfig: null,
                hidden: false,
                label: 'Start Time'
            },
            project: {
                parentConfig: null,
                allowBlank: false,
                hidden: false
            },
            type: {
                hidden: false
            },
            remark: {
                label: 'Procedures or Remarks',
                height: 200,
                width: 600,
                editorConfig: {
                    style: null
                }
            },
            title: {
                parentConfig: {
                    storeIdentifier:  {queryName: 'tasks', schemaName: 'ehr'}
                    ,dataIndex: 'title'
                },
                hidden: true
            }
        }
    }
};

EHR.ext.Metadata.Request = {
    allQueries: {

    },
    byQuery: {
        project: {
            protocol: {
                hidden: true
            },
            avail: {
                hidden: true
            }
        }
    }
};


EHR.ext.Metadata.Necropsy = {
    allQueries: {
        Id: {
            parentConfig: {
                storeIdentifier: {queryName: 'Necropsies', schemaName: 'study'},
                dataIndex: 'Id'
            }
            ,hidden: true
            ,shownInGrid: false
        }
        ,date: {
            parentConfig: {
                storeIdentifier: {queryName: 'Necropsies', schemaName: 'study'},
                dataIndex: 'date'
            }
            ,hidden: true
            ,shownInGrid: false
        }
        ,begindate: {
            hidden: false
        }
        ,parentId: {
            parentConfig: {
                storeIdentifier: {queryName: 'Necropsies', schemaName: 'study'},
                dataIndex: 'objectid'
            }
            ,hidden: true
            ,shownInGrid: false
            ,allowBlank: false
        }
        ,project: {
            parentConfig: {
                storeIdentifier: {queryName: 'Necropsies', schemaName: 'study'},
                dataIndex: 'project'
            }
            ,hidden: true
            ,shownInGrid: false
        }
        ,account: {
            parentConfig: {
                storeIdentifier: {queryName: 'Necropsies', schemaName: 'study'},
                dataIndex: 'account'
            }
            ,hidden: true
            ,shownInGrid: false
        }
    },
    byQuery: {
        Necropsies: {
            parentId: {
                parentConfig: false,
                allowBlank: true
            },
            Id: {
                parentConfig: null,
                hidden: false
            },
            date: {
                parentConfig: null,
                hidden: false,
                label: 'Start Time'
            },
            project: {
                parentConfig: null,
                allowBlank: false,
                hidden: false
            },
            account: {
                parentConfig: null,
                allowBlank: true,
                hidden: false
            },
            title: {
                parentConfig: {
                    storeIdentifier:  {queryName: 'tasks', schemaName: 'ehr'}
                    ,dataIndex: 'title'
                }
            }
        }
    }
};


EHR.ext.Metadata.Anesthesia = {
//    allQueries: {
//
//    },
    byQuery: {
        'Clinical Observations': {
            area: {
                hidden: true,
                preventMark: true,
                xtype: 'displayfield',
                allowBlank: true,
                defaultValue: 'Anesthesia'
            }
            ,code: {
                hidden: true
            }
            ,observation: {
                xtype: 'ehr-remoteradiogroup',
                //defaultValue: 'Normal',
                allowBlank: false,
                //includeNullRecord: false,
                editorConfig: {columns: 1},
                lookup: {
                    schemaName: 'ehr_lookups',
                    queryName: 'observations_anesthesia_recovery',
                    displayColumn: 'value',
                    keyColumn: 'value',
                    sort: 'sort_order'
                }
            }
            ,date: {
                parentConfig: null
                ,hidden: false
                ,shownInGrid: true
            }
        }

    }
};

EHR.ext.Metadata.PE = {
    allQueries: {

    },
    byQuery: {
        'Clinical Observations': {
            area: {
                allowBlank: false,
                includeNullRecord: false,
                lookup: {
                    schemaName: 'ehr_lookups',
                    queryName: 'pe_region',
                    displayColumn: 'region',
                    keyColumn: 'region',
                    sort: 'region'
                }
            }
        }
    }
};

EHR.ext.hiddenCols = 'lsid,objectid,qcstate,parentid,taskid,requestid';
EHR.ext.topCols = 'id,date,project,account';
EHR.ext.bottomCols = 'remark,performedBy,'+EHR.ext.hiddenCols;
EHR.ext.sharedCols = EHR.ext.hiddenCols + ',id,date,project,account,remark,performedby';

EHR.ext.FormColumns = {
    'Clinical Encounters': EHR.ext.hiddenCols + ',Id,project,account,date,enddate,title,type,performedby,remark',
    Alopecia: 'score,cause,upperlegs,lowerarms,shoulders,rump,head,upperarms,lowerlegs,hips,dorsum,other,' + EHR.ext.sharedCols,
    'Behavior Remarks': EHR.ext.topCols+',so,a,p,'+EHR.ext.bottomCols,
    'Body Condition': 'score,weightstatus,' + EHR.ext.sharedCols,
    'Clinical Remarks': EHR.ext.topCols+',so,a,p,'+EHR.ext.bottomCols,
    'Clinical Observations': 'area,observation,code,' + EHR.ext.sharedCols,
    'Teeth': 'jaw,side,tooth,status,' + EHR.ext.sharedCols,
    'Dental Status': 'priority,extractions,gingivitis,tartar,' + EHR.ext.sharedCols,
    Vitals: 'temp,heartrate,resprate,' + EHR.ext.sharedCols,
    tasks: 'title,created,createdby,assignedto,qcstate,duedate,formtype,taskid,category,rowid',
    requests: 'title,created,createdby,assignedto,qcstate,duedate,requesttype,requestid',
    'Irregular Observations': EHR.ext.topCols + ',id/curlocation/location,feces,menses,other,tlocation,behavior,otherbehavior,other,breeding,'+EHR.ext.bottomCols,
    cage_observations: 'room,cage,userId,' + EHR.ext.sharedCols,
    'Treatment Orders': 'id,date,enddate,frequency,code,volume,vunits,conc,cunits,amount,units,route,project,account,remark,' + EHR.ext.hiddenCols,
    'Blood Draws': EHR.ext.topCols+',tube_type,tube_vol,num_tubes,quantity,done_for,caretaker,sampleId,remark,performedby,' + EHR.ext.hiddenCols, //p_s,a_v,
    'Drug Administration': 'id,date,begindate,enddate,project,account,code,route,concentration,conc_units,dosage,dosage_units,amount,amount_units,volume,vol_units,headerdate,remark,performedby,' + EHR.ext.hiddenCols,
    'TB Tests': EHR.ext.sharedCols + ',lot,dilution,eye,result1,result2,result3',
    Weight: EHR.ext.sharedCols + ',weight',
    Charges: EHR.ext.topCols+',type,unitCost,quantity,remark,performedby'+EHR.ext.hiddenCols,
    'Necropsy Diagnosis': 'tissue,duration,severity,distribution,process,'+EHR.ext.sharedCols,
    'Tissue Samples': 'tissue,diagnosis,'+EHR.ext.sharedCols,
    'Organ Weights': 'tissue,weight,'+EHR.ext.sharedCols,
    Histology: 'slideNum,tissue,diagnosis,'+EHR.ext.sharedCols,
    Necropsies: EHR.ext.topCols+',caseno,pathologist,assistant,billing,perfusion_area,perfusion_soln,bcs,'+EHR.ext.bottomCols,
    Restraint: EHR.ext.topCols+',enddate,type,totaltime,'+EHR.ext.bottomCols,
    'Problem List': EHR.ext.topCols+',date_resolved,code,'+EHR.ext.bottomCols

    //clinpath requests
    //Id/Date/Project/Quantity/Tube type/Remark/CBC (yes or no)/Requestor/Performed by/Caretaker/a_v/p_s (is this relevant when they are only doing the draw and that is fixed by the tube type?)/Code
};
