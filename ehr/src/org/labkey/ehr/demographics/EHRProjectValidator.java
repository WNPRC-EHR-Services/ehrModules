package org.labkey.ehr.demographics;

import org.apache.log4j.Logger;
import org.labkey.api.data.CompareType;
import org.labkey.api.data.Container;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.TableSelector;
import org.labkey.api.ehr.demographics.AbstractProjectValidator;
import org.labkey.api.ehr.demographics.ProjectValidator;
import org.labkey.api.module.Module;
import org.labkey.api.query.FieldKey;
import org.labkey.api.security.User;
import org.labkey.api.util.PageFlowUtil;
import org.labkey.ehr.utils.TriggerScriptHelper;

import java.util.Date;

/**
 * A core project validator providing validation for assigned projects for animal
 *
 * Author: ankurj
 * Date: 7/6/2018
 *
 */
public class EHRProjectValidator extends AbstractProjectValidator implements ProjectValidator
{
    private static final Logger _log = Logger.getLogger(EHRProjectValidator.class);
    private TriggerScriptHelper _scriptHelper;

    public EHRProjectValidator(Module owner)
    {
        super(owner);
    }


    @Override
    public boolean validateAssignment(String id, Integer projectId, Date date, User user, Container container, String protocol)
    {
        TableInfo ti = getTableInfo(container, user,"study", "Assignment");

        SimpleFilter filter = new SimpleFilter(FieldKey.fromString("Id"), id);

        filter.addCondition(FieldKey.fromString("date"), date, CompareType.DATE_LTE);
        filter.addClause(new SimpleFilter.OrClause(new CompareType.EqualsCompareClause(FieldKey.fromString("project"), CompareType.EQUAL, projectId), new CompareType.CompareClause(FieldKey.fromString("project/protocol"), CompareType.EQUAL, protocol)));
        filter.addClause(new SimpleFilter.OrClause(new CompareType.EqualsCompareClause(FieldKey.fromString("enddate"), CompareType.DATE_GTE, date), new CompareType.CompareClause(FieldKey.fromString("enddate"), CompareType.ISBLANK, null)));
        filter.addCondition(FieldKey.fromString("qcstate/publicdata"), true, CompareType.EQUAL);

        TableSelector ts = new TableSelector(ti, PageFlowUtil.set("project"), filter, null);

        return ts.exists();
    }
}