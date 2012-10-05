/*
 * Copyright (c) 2012 LabKey Corporation
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
package org.labkey.ehr.utils;

import org.json.JSONObject;
import org.labkey.api.data.Container;

/**
 * Created with IntelliJ IDEA.
 * User: bimber
 * Date: 9/17/12
 * Time: 2:02 PM
 */
public class EHRQCState
{
    private int _rowId;
    private String _label;
    private Container _container;
    private String _description;
    private boolean _publicData;
    private boolean _draftData;
    private boolean _isDeleted;
    private boolean _isRequest;
    private boolean _allowFutureDates;

    public int getRowId()
    {
        return _rowId;
    }

    public void setRowId(int rowId)
    {
        _rowId = rowId;
    }

    public String getLabel()
    {
        return _label;
    }

    public void setLabel(String label)
    {
        _label = label;
    }

    public Container getContainer()
    {
        return _container;
    }

    public void setContainer(Container container)
    {
        _container = container;
    }

    public String getDescription()
    {
        return _description;
    }

    public void setDescription(String description)
    {
        _description = description;
    }

    public boolean isPublicData()
    {
        return _publicData;
    }

    public void setPublicData(boolean publicData)
    {
        _publicData = publicData;
    }

    public boolean isDraftData()
    {
        return _draftData;
    }

    public void setDraftData(boolean draftData)
    {
        _draftData = draftData;
    }

    public boolean isDeleted()
    {
        return _isDeleted;
    }

    public void setDeleted(boolean deleted)
    {
        _isDeleted = deleted;
    }

    public boolean isRequest()
    {
        return _isRequest;
    }

    public void setRequest(boolean request)
    {
        _isRequest = request;
    }

    public boolean isAllowFutureDates()
    {
        return _allowFutureDates;
    }

    public void setAllowFutureDates(boolean allowFutureDates)
    {
        _allowFutureDates = allowFutureDates;
    }

    public JSONObject toJson()
    {
        JSONObject json = new JSONObject();
        json.put("RowId", getRowId());
        json.put("Label", getLabel());
        json.put("PublicData", isPublicData());
        json.put("isRequest", isRequest());
        json.put("allowFutureDates", isAllowFutureDates());
        return json;
    }
}
