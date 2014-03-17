/*
 * Copyright (c) 2012-2014 LabKey Corporation
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

import com.google.common.collect.MapDifference;
import com.google.common.collect.Maps;
import org.apache.log4j.Logger;
import org.labkey.api.cache.CacheManager;
import org.labkey.api.cache.StringKeyCache;
import org.labkey.api.data.CompareType;
import org.labkey.api.data.Container;
import org.labkey.api.data.ContainerManager;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.TableSelector;
import org.labkey.api.ehr.EHRService;
import org.labkey.api.ehr.demographics.DemographicsProvider;
import org.labkey.api.module.ModuleLoader;
import org.labkey.api.module.ModuleProperty;
import org.labkey.api.query.FieldKey;
import org.labkey.api.query.QueryService;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.User;
import org.labkey.api.security.permissions.AdminPermission;
import org.labkey.api.study.Study;
import org.labkey.api.util.ConfigurationException;
import org.labkey.api.util.JobRunner;
import org.labkey.ehr.EHRManager;
import org.labkey.ehr.EHRModule;
import org.quartz.CronScheduleBuilder;
import org.quartz.Job;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;
import org.springframework.dao.DeadlockLoserDataAccessException;

import java.util.ArrayList;
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
public class DemographicsService
{
    private static final DemographicsService _instance = new DemographicsService();
    private static final Logger _log = Logger.getLogger(DemographicsService.class);
    private static JobDetail _job = null;

    private StringKeyCache<AnimalRecord> _cache;

//    private static class DemographicsCacheLoader implements CacheLoader<String, AnimalRecord>
//    {
//        @Override
//        public AnimalRecord load(String key, Object argument)
//        {
//            //expects: container, animalId
//            Pair<Container, String> pair = (Pair)argument;
//
//            _log.info("loading animal: " + pair.second);
//            List<AnimalRecord> ret = DemographicsService.get().createRecords(pair.first, Collections.singleton(pair.second));
//
//            return ret.isEmpty() ? null : ret.get(0);
//        }
//    }

    private DemographicsService()
    {
        // NOTE: we expect to recache all living animals each night.  the purpose of a 25HR window is to make sure the
        // existing record is present so we can validate.  any other incidental cached records would expire shortly after
        _cache = CacheManager.getStringKeyCache(10000, (CacheManager.DAY + CacheManager.HOUR), "DemographicsService");
    }

    public static DemographicsService get()
    {
        return _instance;
    }

    private String getCacheKey(Container c, String id)
    {
        assert c != null && c.getId() != null : "Attempting to cache a record without a container: " + id;
        return getClass().getName() + "||" + c.getId() + "||" + id;
    }

    /**
     * Queries the cache for the animal record, creating if not found
     */
    public AnimalRecord getAnimal(Container c, String id)
    {
        List<AnimalRecord> ret = getAnimals(c, Collections.singletonList(id));

        return ret.size() > 0 ? ret.get(0).createCopy() : null;
    }

    /**
     * Queries the cache for the animal record, creating if not found
     */
    public List<AnimalRecord> getAnimals(Container c, Collection<String> ids)
    {
        return getAnimals(c, ids, false);
    }

    private List<AnimalRecord> getAnimals(Container c, Collection<String> ids, boolean validateOnCreate)
    {
        List<AnimalRecord> records = new ArrayList<>();
        Set<String> toCreate = new HashSet<>();
        for (String id : ids)
        {
            AnimalRecord ret = getRecordFromCache(c, id);
            if (ret != null)
            {
                records.add(ret.createCopy());
            }
            else
            {
                toCreate.add(id);
            }
        }

        if (toCreate.size() > 0)
        {
            records.addAll(createRecords(c, toCreate, validateOnCreate));
        }

        return records;
    }

    private synchronized void cacheRecord(AnimalRecord record, boolean validateOnCreate)
    {
        String key = getCacheKey(record.getContainer(), record.getId());

        if (validateOnCreate)
        {
            AnimalRecord existing = _cache.get(key);
            if (existing != null)
            {
                if (existing.getPropsForValidation() == null && record.getPropsForValidation() != null)
                {
                    _log.error("mismatch for cached record for animal: " + record.getId() + ".  cached record has properties, but new record does not");
                }
                else if (existing.getPropsForValidation() != null && record.getPropsForValidation() == null)
                {
                    _log.error("mismatch for cached record for animal: " + record.getId() + ".  cached record has no properties, but new record does");
                }
                else if (existing.getPropsForValidation() == null && record.getPropsForValidation() == null)
                {
                    //ignore
                }
                else
                {
                    MapDifference diff = Maps.difference(existing.getPropsForValidation(), record.getPropsForValidation());
                    if (!diff.areEqual())
                    {
                        _log.error("mismatch for cached record for animal: " + record.getId());
                        Map<String, MapDifference.ValueDifference> diffEntries = diff.entriesDiffering();
                        for (String prop : diffEntries.keySet())
                        {
                            _log.error("property: " + prop);
                            _log.error("original: ");
                            _log.error(diffEntries.get(prop).leftValue());
                            _log.error("new value: ");
                            _log.error(diffEntries.get(prop).rightValue());
                        }
                    }
                }
            }
        }

        _cache.put(key, record);
    }

    private void recacheRecords(Container c, List<String> ids)
    {
        for (String id : ids)
        {
            _cache.remove(getCacheKey(c, id));
        }

        asyncCache(c, ids);
    }

    public void reportDataChange(final Container c, final String schema, final String query, final List<String> ids)
    {
        final User u = EHRService.get().getEHRUser(c);
        if (u == null)
        {
            _log.error("EHRUser not configured, cannot run demographics service");
            return;
        }

        doUpdateRecords(c, u, schema, query, ids);
    }

    private void doUpdateRecords(Container c, User u, String schema, String query, List<String> ids)
    {
        try
        {
            for (DemographicsProvider p : EHRService.get().getDemographicsProviders(c))
            {
                if (p.requiresRecalc(schema, query))
                {
                    int start = 0;
                    int batchSize = 500;
                    List<String> allIds = new ArrayList<>(ids);
                    while (start < ids.size())
                    {
                        List<String> sublist = allIds.subList(start, Math.min(ids.size(), start + batchSize));
                        start = start + batchSize;

                        Map<String, Map<String, Object>> props = p.getProperties(c, u, sublist);
                        for (String id : ids)
                        {
                            synchronized (this)
                            {
                                String key = getCacheKey(c, id);
                                AnimalRecord ar = _cache.get(key);
                                if (ar != null)
                                {
                                    //NOTE: we want to continue even if the map is NULL.  this is important to clear out the existing values.
                                    ar.update(p, props.get(id));
                                }
                                else
                                {
                                    ar = AnimalRecord.create(c, id, props.get(id));
                                }

                                cacheRecord(ar, false);
                            }
                        }
                    }
                }
            }
        }
        catch (Exception e)
        {
            _log.error(e.getMessage(), e);
            recacheRecords(c, ids);
        }
    }

    // Create and cache IDs in the background
    private void asyncCache(final Container c, final List<String> ids)
    {
        _log.info("Perform async cache for " + ids.size() + " animals");

        JobRunner.getDefault().execute(new Runnable(){
            public void run()
            {
                try
                {
                    DemographicsService.get().createRecords(c, ids, false);
                }
                catch (DeadlockLoserDataAccessException e)
                {
                    _log.error("DemographicsService encountered a deadlock", e);
                }
            }
        });
    }

    /**
     * Queries the DB directly, bypassing the cache.  records are put in the cache on complete
     */
    private List<AnimalRecord> createRecords(Container c, Collection<String> ids, boolean validateOnCreate)
    {
        User u = EHRService.get().getEHRUser(c);
        if (u == null)
        {
            throw new ConfigurationException("EHRUser not set in the container: " + c.getPath());
        }

        Date startTime = new Date();
        Map<String, Map<String, Object>> ret = new HashMap<>();
        //NOTE: SQLServer can complain if requesting more than 2000 at a time, so break into smaller sets
        int start = 0;
        int batchSize = 500;
        List<String> allIds = new ArrayList<>(ids);
        while (start < ids.size())
        {
            List<String> sublist = allIds.subList(start, Math.min(ids.size(), start + batchSize));
            start = start + batchSize;
            _log.info("creating demographics records for " + sublist.size() + " animals");

            for (DemographicsProvider p : EHRService.get().getDemographicsProviders(c))
            {
                Map<String, Map<String, Object>> props = p.getProperties(c, u, sublist);
                for (String id : props.keySet())
                {
                    Map<String, Object> perId = ret.get(id);
                    if (perId == null)
                        perId = new HashMap<>();

                    perId.putAll(props.get(id));

                    ret.put(id, perId);
                }
            }
        }

        // NOTE: the above fill only create an AnimalRecord for IDs that exist in the demographics table.
        // we also want to cache each attempt to find an ID.  requesting a non-existing ID still requires a query,
        // so make note of the fact it doesnt exist
        for (String id : ids)
        {
            if (!ret.containsKey(id))
                ret.put(id, new HashMap<String, Object>());
        }

        List<AnimalRecord> records = new ArrayList<>();
        for (String id : ret.keySet())
        {
            Map<String, Object> props = ret.get(id);
            AnimalRecord record = AnimalRecord.create(c, id, props);
            cacheRecord(record, validateOnCreate);

            records.add(record);
        }

        double duration = ((new Date()).getTime() - startTime.getTime()) / 1000.0;
        if (duration > (2.0 * ids.size()))
        {
            _log.warn("recached " + ids.size() + " records in " + duration + " seconds");
        }
        return records;
    }

    public void cacheLivingAnimals(Container c, User u, boolean validateOnCreate)
    {
        UserSchema us = QueryService.get().getUserSchema(u, c, "study");
        if (us == null)
            throw new IllegalArgumentException("Unable to find study schema");

        TableInfo demographics = us.getTable("demographics");
        if (demographics == null)
            throw new IllegalArgumentException("Unable to find demographics table");

        TableSelector ts = new TableSelector(demographics, Collections.singleton("Id"), new SimpleFilter(FieldKey.fromString("calculated_status"), "Alive", CompareType.EQUAL), null);
        List<String> ids = ts.getArrayList(String.class);

        TableSelector ts2 = new TableSelector(demographics, Collections.singleton("Id"), new SimpleFilter(FieldKey.fromString("death"), "-30d", CompareType.DATE_GTE), null);
        List<String> recentlyDeadIds = ts2.getArrayList(String.class);
        if (recentlyDeadIds.size() > 0)
        {
            ids.addAll(recentlyDeadIds);
        }

        if (ids.size() > 0)
        {
            _log.info("Forcing recache of " + ids.size() + " animals");
            createRecords(c, ids, validateOnCreate);
        }
    }

    /**
     * A helper to query the cache, which will create the record if not present
     */
    private AnimalRecord getRecordFromCache(Container c, String animalId)
    {
        return _cache.get(getCacheKey(c, animalId));
    }

    private int cacheLivingAnimalsForAllContainers(boolean validateOnCreate)
    {
        _log.info("attempting to recache demographics for all living animals on all containers set to do so");

        //cache all living animals to be cached, if set
        ModuleProperty shouldCache = ModuleLoader.getInstance().getModule(EHRModule.class).getModuleProperties().get(EHRManager.EHRCacheDemographicsPropName);
        User rootUser = EHRManager.get().getEHRUser(ContainerManager.getRoot(), false);
        if (rootUser == null)
            return 0;

        int totalCached = 0;

        for (Study s : EHRManager.get().getEhrStudies(rootUser))
        {
            String value = shouldCache.getEffectiveValue(s.getContainer());
            if (value != null)
            {
                Boolean val = Boolean.parseBoolean(value);
                if (val)
                {
                    User u = EHRService.get().getEHRUser(s.getContainer());
                    if (u == null || !s.getContainer().hasPermission(u, AdminPermission.class))
                    {
                        continue;
                    }

                    DemographicsService.get().cacheLivingAnimals(s.getContainer(), u, validateOnCreate);
                    totalCached++;
                }
            }
        }

        return totalCached;
    }

    public void onStartup()
    {
        JobRunner.getDefault().execute(new Runnable(){
            public void run()
            {
                int totalCached = cacheLivingAnimalsForAllContainers(false);
                if (totalCached > 0)
                {
                    try
                    {
                        if (_job == null)
                        {
                            _job = JobBuilder.newJob(DemographicServiceRefreshRunner.class)
                                    .withIdentity(DemographicsService.class.getCanonicalName(), DemographicsService.class.getCanonicalName())
                                    .usingJobData("demographicsService", DemographicsService.class.getName())
                                    .build();
                        }

                        Trigger trigger = TriggerBuilder.newTrigger()
                                .withIdentity(DemographicsService.class.getCanonicalName(), DemographicsService.class.getCanonicalName())
                                .withSchedule(CronScheduleBuilder.dailyAtHourAndMinute(1, 0))
                                .forJob(_job)
                                .build();

                        StdSchedulerFactory.getDefaultScheduler().scheduleJob(_job, trigger);

                        _log.info("DemographicsService scheduled a refresh daily at 1AM");
                    }
                    catch (SchedulerException e)
                    {
                        _log.error("Unable to schedule DemographicsService", e);
                    }
                }
            }
        }, 30000); //30-sec delay, allowing all modules to start
    }

    public static class DemographicServiceRefreshRunner implements Job
    {
        public DemographicServiceRefreshRunner()
        {

        }

        public void execute(JobExecutionContext context) throws JobExecutionException
        {
            DemographicsService.get().cacheLivingAnimalsForAllContainers(true);
        }
    }
}
