package org.labkey.ehr.security;

import org.labkey.api.security.permissions.AbstractPermission;

/**
 * User: bbimber
 * Date: Mar 24, 2011
 */
public class EHRCompletedUpdatePermission extends AbstractPermission
{
    public EHRCompletedUpdatePermission()
    {
        super("EHRCompletedUpdatePermission", "Can update data with the QC State: Completed");
    }
}
