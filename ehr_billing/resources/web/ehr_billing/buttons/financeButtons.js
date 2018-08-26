/**
 * A button specific to the charges form
 */
var ctx = LABKEY.moduleContext.ehr_billing;

EHR.DataEntryUtils.registerDataEntryFormButton('FINANCESUBMIT', {
    text: 'Submit',
    name: 'submit',
    requiredQC: 'Completed',
    targetQC: 'Completed',
    errorThreshold: 'ERROR',
    successURL: LABKEY.ActionURL.buildURL('project', 'begin.view', (ctx ? ctx['BillingContainer'] : null), null),
    itemId: 'submitBtn',
    handler: function(btn){
        var panel = btn.up('ehr-dataentrypanel');
        Ext4.Msg.confirm('Finalize Form', 'You are about to finalize this form.  Do you want to do this?', function(v){
            if(v == 'yes')
                this.onSubmit(btn);
        }, this);
    },
    disableOn: 'ERROR'
});