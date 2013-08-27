/*
 * Copyright (c) 2012-2013 LabKey Corporation
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
package org.labkey.ehr.demographics;

import org.apache.log4j.Logger;
import org.labkey.api.cache.CacheManager;
import org.labkey.api.data.Container;
import org.labkey.api.ehr.demographics.DemographicsProvider;
import org.labkey.api.ehr.EHRService;
import org.labkey.api.query.FieldKey;
import org.labkey.api.security.User;
import org.labkey.api.util.ConfigurationException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * User: bimber
 * Date: 9/17/12
 * Time: 8:35 PM
 */
public class DemographicsCache
{
    private static final DemographicsCache _instance = new DemographicsCache();
    private static final Logger _log = Logger.getLogger(DemographicsCache.class);

    //track stats
    private int _totalCached = 0;
    private int _totalUncached = 0;
    private int _cacheSize = 0;

    private DemographicsCache()
    {

    }

    public static DemographicsCache get()
    {
        return _instance;
    }

    public AnimalRecord getAnimal(Container c, User u, String id)
    {
        List<AnimalRecord> ret = getAnimals(c, u, Collections.singletonList(id));
        return ret.size() > 0 ? ret.get(0) : null;
    }

    public List<AnimalRecord> getAnimals(Container c, User u, List<String> ids)
    {
        //TODO: check security?

        List<AnimalRecord> records = new ArrayList<AnimalRecord>();
        Set<String> toCreate = new HashSet<String>();
        for (String id : ids)
        {
            String key = getCacheKey(c, id);
            if (CacheManager.getSharedCache().get(key) == null)
            {
                toCreate.add(id);
            }
            else
            {
                records.add((AnimalRecord)CacheManager.getSharedCache().get(key));
            }
        }

        if (toCreate.size() > 0)
        {
            records.addAll(createRecords(c, toCreate));
        }

        return records;
    }

    public void reportDataChange(Container c, String schema, String query, List<String> ids)
    {
        for (DemographicsProvider p : EHRService.get().getDemographicsProviders(c))
        {
            if (p.requiresRecalc(schema, query))
            {
                uncacheRecords(c, ids);
                break;
            }
        }
    }

    private String getCacheKey(Container c, String id)
    {
        return getClass().getName() + "||" + c.getId() + "||" + id;
    }

    synchronized public void cacheRecord(Container c, AnimalRecord record)
    {
        _log.info("caching demographics record: " + record.getId());
        CacheManager.getSharedCache().put(getCacheKey(record.getContainer(), record.getId()), record);
        _totalCached++;
        _cacheSize++;
    }

    synchronized public void uncacheRecords(Container c, String... ids)
    {
        uncacheRecords(c, Arrays.asList(ids));
    }

    synchronized public void uncacheRecords(Container c, Collection<String> ids)
    {
        for (String id : ids)
        {
            _log.info("attempting to uncache: " + id);
            CacheManager.getSharedCache().remove(getCacheKey(c, id));
        }
        _totalUncached += ids.size();
        _cacheSize -= ids.size();
    }

    public List<AnimalRecord> createRecords(Container c, Collection<String> ids)
    {
        User u = EHRService.get().getEHRUser(c);
        if (u == null)
        {
            throw new ConfigurationException("EHRUser not set in the container: " + c.getPath());
        }

        Map<String, Map<String, Object>> ret = new HashMap<String, Map<String, Object>>();
        for (DemographicsProvider p : EHRService.get().getDemographicsProviders(c))
        {
            Map<String, Map<String, Object>> props = p.getProperties(c, u, ids);
            for (String id : props.keySet())
            {
                Map<String, Object> perId = ret.get(id);
                if (perId == null)
                    perId = new HashMap<String, Object>();

                perId.putAll(props.get(id));

                ret.put(id, perId);
            }
        }

        //NOTE: we want to keep track of attempt to find an ID.  requesting a non-existing ID still requires a query, so make note of the fact it doesnt exist
        for (String id : ids)
        {
            if (!ret.containsKey(id))
                ret.put(id, new HashMap<String, Object>());
        }

        List<AnimalRecord> records = new ArrayList<AnimalRecord>();
        for (String id : ret.keySet())
        {
            Map<String, Object> props = ret.get(id);
            AnimalRecord record = AnimalRecord.create(c, id, props);

            cacheRecord(c, record);
            records.add(record);
        }

        return records;
    }

    public int getTotalCached()
    {
        return _totalCached;
    }

    public int getTotalUncached()
    {
        return _totalUncached;
    }

    public int getCacheSize()
    {
        return _cacheSize;
    }
}
