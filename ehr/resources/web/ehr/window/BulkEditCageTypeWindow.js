Ext4.define('EHR.window.BulkEditCageTypeWindow', {
    extend: 'Ext.window.Window',

    statics: {
        buttonHandler: function(dataRegionName){
            var dataRegion = LABKEY.DataRegions[dataRegionName];
            LDK.Assert.assertNotEmpty('Unable to find DataRegion with name: ' + dataRegionName, dataRegion);

            var checked = dataRegion.getChecked();
            if (!checked){
                Ext4.Msg.alert('Error', 'Must select at least one row');
                return;
            }

            Ext4.create('EHR.window.BulkEditCageTypeWindow', {
                dataRegionName: dataRegionName
            }).show();
        }
    },

    initComponent: function(){
        LABKEY.ExtAdapter.apply(this, {
            modal: true,
            title: 'Bulk Edit Cages',
            bodyStyle: 'padding: 5px;',
            width: 500,
            items: [{
                html: 'This helper allows you to bulk edit the cage type and/or divider type for the selected cages.  If you pick a value for either field below, it will set this on all the selected rows.  If you leave either field blank, that field will be ignored.',
                border: false,
                style: 'padding-bottom: 20px;'
            },{
                xtype: 'labkey-combo',
                displayField: 'cagetype',
                fieldLabel: 'Cage Type',
                width: 450,
                valueField: 'cagetype',
                itemId: 'typeField',
                queryMode: 'local',
                store: {
                    type: 'labkey-store',
                    schemaName: 'ehr_lookups',
                    queryName: 'cage_type',
                    autoLoad: true
                }
            },{
                xtype: 'labkey-combo',
                displayField: 'divider',
                fieldLabel: 'Divider Type',
                width: 450,
                valueField: 'rowid',
                itemId: 'dividerField',
                queryMode: 'local',
                store: {
                    type: 'labkey-store',
                    schemaName: 'ehr_lookups',
                    queryName: 'divider_types',
                    autoLoad: true
                }
            }],
            buttons: [{
                text: 'Submit',
                scope: this,
                handler: this.onSubmit
            },{
                text: 'Cancel',
                handler: function(btn){
                    btn.up('window').close();
                }
            }]
        });

        this.callParent(arguments);
    },

    onSubmit: function(){
        var divider = this.down('#dividerField').getValue();
        var cagetype = this.down('#typeField').getValue();

        if (!divider && !cagetype){
            Ext4.Msg.alert('Error', 'Must select either a cage type or divider');
            return;
        }

        var toUpdate = [];
        var dataRegion = LABKEY.DataRegions[this.dataRegionName];
        LDK.Assert.assertNotEmpty('Unable to find DataRegion with name: ' + this.dataRegionName, dataRegion);

        Ext4.Array.forEach(dataRegion.getChecked(), function(pk){
            var obj = {
                location: pk
            };

            if (divider){
                obj.divider = divider;
            }

            if (cagetype){
                obj.cage_type = cagetype;
            }

            toUpdate.push(obj);
        });

        if (toUpdate.length){
            Ext4.Msg.wait('Saving...');
            LABKEY.Query.updateRows({
                schemaName: 'ehr_lookups',
                queryName: 'cage',
                rows: toUpdate,
                scope: this,
                failure: LDK.Utils.getErrorCallback(),
                success: function(results){
                    this.close();
                    Ext4.Msg.hide();
                    Ext4.Msg.alert('Success', 'Success!', function(){
                        window.location.reload();
                    }, this);
                }
            });
        }
        else {
            Ext4.Msg.alert('Error', 'Rows not found, cannot update');
        }
    }
});