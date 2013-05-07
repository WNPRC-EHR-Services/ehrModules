/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.labkey.ehr.history;

import org.labkey.api.data.Results;
import org.labkey.api.query.FieldKey;

import java.sql.SQLException;

/**
 * Created with IntelliJ IDEA.
 * User: bimber
 * Date: 2/17/13
 * Time: 4:52 PM
 */
public class DefaultHousingDataSource extends AbstractDataSource
{
    public DefaultHousingDataSource()
    {
        super("study", "Housing", "Housing Transfer");
    }

    @Override
    protected String getHtml(Results rs) throws SQLException
    {
        StringBuilder sb = new StringBuilder();

        FieldKey room = FieldKey.fromString("room");
        FieldKey cage = FieldKey.fromString("cage");
        String value = "";
        if (rs.hasColumn(room) && rs.getObject(room) != null)
            value = rs.getString(room);

        if (rs.hasColumn(cage) && rs.getObject(cage) != null)
            value += " / " + rs.getString(cage);

        sb.append("Moved to: " + value).append("\n");

        safeAppend(rs, "Reason", "reason");
        safeAppend(rs, "Remark", "remark");

        return sb.toString();
    }
}
