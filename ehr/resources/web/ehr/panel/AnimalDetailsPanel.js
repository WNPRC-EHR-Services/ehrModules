/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 * 
 * @param subjectId
 */
Ext4.define('EHR.panel.AnimalDetailsPanel', {
    extend: 'EHR.panel.SnapshotPanel',
    alias: 'widget.ehr-animaldetailspanel',

    border: true,
    showExtendedInformation: false,

    initComponent: function(){
        Ext4.apply(this, {
            border: true,
            bodyStyle: 'padding: 5px;',
            minHeight: 200,
            defaults: {
                border: false
            }
        });

        this.callParent(arguments);

        if (this.dataEntryPanel){
            this.mon(this.dataEntryPanel, 'animalchange', this.loadAnimal, this, {buffer: 500});
        }
    },

    loadAnimal: function(animalId, forceReload){
        if (!forceReload && animalId == this.subjectId){
            return;
        }

        this.subjectId = animalId;

        if (animalId)
            EHR.DemographicsCache.getDemographics([this.subjectId], this.onLoad, this);
    },

    onLoad: function(ids, resultMap){
        if (ids && ids.length && ids[0] != this.subjectId){
            return;
        }

        this.callParent(arguments);
    },

    getItems: function(){
        return [{
            layout: 'column',
            defaults: {
                border: false,
                bodyStyle: 'padding-right: 20px;'
            },
            items: [{
                width: 380,
                defaults: {
                    xtype: 'displayfield',
                    labelWidth: this.defaultLabelWidth
                },
                items: [{
                    fieldLabel: 'Id',
                    itemId: 'animalId'
                },{
                    fieldLabel: 'Location',
                    itemId: 'location'
                },{
                    fieldLabel: 'Gender',
                    itemId: 'gender'
                },{
                    fieldLabel: 'Species',
                    itemId: 'species'
                },{
                    fieldLabel: 'Age',
                    itemId: 'age'
                },{
                    fieldLabel: 'Projects / Groups',
                    itemId: 'assignmentsAndGroups'
                }]
            },{
                minWidth: 200,
                defaults: {
                    xtype: 'displayfield'
                },
                items: [{
                    fieldLabel: 'Status',
                    itemId: 'calculated_status'
                },{
                    fieldLabel: 'Flags',
                    itemId: 'flags'
                },{
                    fieldLabel: 'Weight',
                    itemId: 'weights'
                }]
            }]
        }];
    },

    appendWeightResults: function(results){
        if (results && results.length){
            var row = results[0];
            var date = LDK.ConvertUtils.parseDate(row.date);
            var interval = '';
            if (date){
                //round to day for purpose of this comparison
                var d1 = Ext4.Date.clearTime(new Date(), true);
                var d2 = Ext4.Date.clearTime(date, true);
                var interval = Ext4.Date.getElapsed(d1, d2);
                interval = interval / (1000 * 60 * 60 * 24);
                interval = Math.floor(interval);
                interval = interval + ' days ago';
            }

            var text = row.weight + ' kg, ' + date.format('Y-m-d') + (Ext4.isDefined(interval) ? ' (' + interval + ')' : '');
            this.safeAppend('#weights', '<table>' + text + '</table>');
        }
    },

    appendAssignmentsAndGroups: function(record){
        if (this.redacted)
            return;

        var values = [];
        if (record.getActiveAssignments() && record.getActiveAssignments().length){
            Ext4.each(record.getActiveAssignments(), function(row){
                var val = row['project/investigatorId/lastName'] || '';
                val += ' [' + row['project/displayName'] + ']';

                if (val)
                    values.push(val);
            }, this);
        }

        if (record.getActiveAnimalGroups() && record.getActiveAnimalGroups.length){
            Ext4.each(record.getActiveAnimalGroups(), function(row){
                values.push(row['groupId/name']);
            }, this);
        }

        if (values.length)
            this.safeAppend('#assignmentsAndGroups', values.join('<br>'));
    }
});