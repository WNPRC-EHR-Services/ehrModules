/**
 * @cfg dataRegionName
 */
Ext4.define('EHR.window.GetDistinctWindow', {
    extend: 'Ext.window.Window',

    initComponent: function(){
        var dataRegion = LABKEY.DataRegions[this.dataRegionName];

        //NOTE: this allows queries to redirect to a query other than themselves (ie. if a query is a derivative of a dataset)
        this.queryName = this.queryName || dataRegion.queryName;
        this.schemaName = this.schemaName || dataRegion.schemaName;

        Ext4.apply(this, {
            defaults: {
                border: false
            },
            width: 400,
            modal: true,
            bodyStyle: 'padding:5px',
            closeAction: 'destroy',
            title: 'Return Distinct Values',
            items: [{
                xtype: 'radiogroup',
                fieldLabel: 'Rows to Inspect',
                itemId: 'selectionType',
                columns: 1,
                defaults: {
                    xtype: 'radio',
                    name: 'selectionType'
                },
                items: [{
                    boxLabel: 'Checked Rows Only',
                    inputValue: 'checked',
                    checked: true
                },{
                    boxLabel: 'All Rows',
                    inputValue: 'all'
                }]
            },{
                emptyText: '',
                fieldLabel: 'Select Field',
                itemId: 'field',
                xtype: 'combo',
                displayField:'name',
                valueField: 'value',
                queryMode: 'local',
                width: 260,
                editable: true,
                value: 'id',
                required: true,
                store: {
                    type: 'array',
                    fields: ['name', 'value'],
                    data: [['Animal Id','id'], ['Project','project'], ['Date','date']]
                }
            }],
            buttons: [{
                text: 'Submit',
                disabled: false,
                scope: this,
                handler: this.onSubmit
            },{
                text: 'Close',
                scope: this,
                handler: function(btn){
                    btn.up('window').destroy();
                }
            }]
        });

        this.callParent();
    },

    onSubmit: function(){
        var type = this.down('#selectionType').getValue().selectionType;

        if (type == 'all'){
            this.selectDistinct();
        }
        else {
            this.runSQL();
        }

        this.close();
    },

    selectDistinct: function(){
        var dataRegion = LABKEY.DataRegions[this.dataRegionName];
        var field = this.down('#field').getValue();

        Ext4.Msg.wait('Loading...');
        LABKEY.Query.selectDistinctRows({
            column: field,
            schemaName: dataRegion.schemaName,
            queryName: dataRegion.queryName,
            filterArray: dataRegion.getUserFilterArray(),
            viewName: dataRegion.viewName,
            scope: this,
            success: function(results){
                Ext4.Msg.hide();

                this.displayResults(results.values)
            },
            failure: LDK.Utils.getErrorCallback()
        });
    },

    displayResults: function(ids){
        Ext4.create('Ext.window.Window', {
            width: 280,
            modal: true,
            bodyStyle: 'padding:5px',
            closeAction: 'destroy',
            title: 'Distinct Values',
            defaults: {
                border: false
            },
            items: [{
                html: 'Total: ' + ids.length
            },{
                xtype: 'textarea',
                itemId: 'distinctValues',
                width: 260,
                height: 350,
                value: ids.join('\n')
            }],
            buttons: [{
                text: 'Close',
                scope: this,
                handler: function(btn){
                    btn.up('window').close();
                }
            }]
        }).show();
    },

    runSQL: function (){
        var dataRegion = LABKEY.DataRegions[this.dataRegionName];
        var checked = dataRegion.getChecked();
        if (!checked.length){
            Ext4.Msg.alert('Error', 'No Rows Are Checked');
            return;
        }

        var field = this.down('#field').getValue();
        var selectorCols = !Ext4.isEmpty(dataRegion.selectorCols) ? dataRegion.selectorCols : dataRegion.pkCols;
        LDK.Assert.assertNotEmpty('Unable to find selector columns for: ' + this.schemaName + '.' + this.queryName, selectorCols);

        var colExpr = '(s.' + selectorCols.join(" || ',' || s.") + ')';
        var sql = "SELECT DISTINCT s." + field + " as field FROM " + this.schemaName + ".\"" + this.queryName + "\" s WHERE " + colExpr + " IN ('" + checked.join("', '") + "')";

        LABKEY.Query.executeSql({
            schemaName: 'study',
            sql: sql,
            scope: this,
            failure: LDK.Utils.getErrorCallback(),
            success: function(data){
                var ids = {};
                for (var i = 0; i < data.rows.length; i++){
                    if (!data.rows[i].field)
                        continue;

                    if (data.rows[i].field && !ids[data.rows[i].field])
                        ids[data.rows[i].field] = 0;

                    ids[data.rows[i].field] += 1;

                }

                this.displayResults(Ext4.Object.getKeys(ids));
            }
        });
    }

});