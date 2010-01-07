package org.labkey.ehr.query;

import org.labkey.api.query.FilteredTable;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.Container;

/**
 * Copyright (c) 2006-2009 LabKey Corporation
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * <p/>
 * User: brittp
 * Date: Jan 6, 2010 2:00:58 PM
 */
public class WrappedStudyTable extends FilteredTable
{
    public WrappedStudyTable(TableInfo table, Container container)
    {
        super(table, container);
        wrapAllColumns(true);
    }
}
