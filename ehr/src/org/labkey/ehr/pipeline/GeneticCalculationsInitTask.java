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
package org.labkey.ehr.pipeline;

import au.com.bytecode.opencsv.CSVWriter;
import org.labkey.api.data.RuntimeSQLException;
import org.labkey.api.data.Selector;
import org.labkey.api.data.Table;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.TableSelector;
import org.labkey.api.gwt.client.util.StringUtils;
import org.labkey.api.pipeline.AbstractTaskFactory;
import org.labkey.api.pipeline.AbstractTaskFactorySettings;
import org.labkey.api.pipeline.PipelineJob;
import org.labkey.api.pipeline.PipelineJobException;
import org.labkey.api.pipeline.RecordedAction;
import org.labkey.api.pipeline.RecordedActionSet;
import org.labkey.api.pipeline.file.FileAnalysisJobSupport;
import org.labkey.api.query.QueryService;
import org.labkey.api.query.UserSchema;
import org.labkey.api.util.FileType;
import org.labkey.api.util.PageFlowUtil;
import org.labkey.api.util.ResultSetUtil;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: bbimber
 * Date: 8/6/12
 * Time: 12:57 PM
 */
public class GeneticCalculationsInitTask extends PipelineJob.Task<GeneticCalculationsInitTask.Factory>
{
    protected GeneticCalculationsInitTask(Factory factory, PipelineJob job)
    {
        super(factory, job);
    }

    public static class Factory extends AbstractTaskFactory<AbstractTaskFactorySettings, GeneticCalculationsInitTask.Factory>
    {
        public Factory()
        {
            super(GeneticCalculationsInitTask.class);
            setJoin(true);
        }

        public List<FileType> getInputTypes()
        {
            return Collections.singletonList(new FileType(".r"));
        }

        public String getStatusName()
        {
            return "RUNNING";
        }

        public List<String> getProtocolActionNames()
        {
            return Arrays.asList("Calculating Genetics Values");
        }

        public PipelineJob.Task createTask(PipelineJob job)
        {
            GeneticCalculationsInitTask task = new GeneticCalculationsInitTask(this, job);
            setJoin(false);

            return task;
        }

        public boolean isJobComplete(PipelineJob job)
        {
            return false;
        }
    }

    public RecordedActionSet run() throws PipelineJobException
    {
        PipelineJob job = getJob();
        FileAnalysisJobSupport support = (FileAnalysisJobSupport) job;

        //we expect to keep reusing the same job, so we truncate the logfile
        try
        {
            File log = job.getLogFile();
            log.delete();
            log.createNewFile();
        }
        catch (IOException e)
        {
            throw new PipelineJobException(e);
        }

        RecordedAction action = new RecordedAction();

        job.getLogger().info("Creating TSV with pedigree data");

        try
        {
            UserSchema us = QueryService.get().getUserSchema(job.getUser(), job.getContainer(), "study");
            TableInfo pedTable = us.getTable("Pedigree");
            TableSelector ts = new TableSelector(pedTable, new HashSet<String>(PageFlowUtil.set("Id", "Dam", "Sire", "Gender")), null, null);

            File outputFile = new File(support.getAnalysisDirectory(), GeneticCalculationsImportTask.PEDIGREE_FILE);
            final CSVWriter writer = new CSVWriter(new OutputStreamWriter(new FileOutputStream(outputFile)), '\t', CSVWriter.NO_QUOTE_CHARACTER);
            try
            {
                long count = ts.getRowCount();
                if (count > 0)
                {
                    ts.forEach(new Selector.ForEachBlock<ResultSet>()
                    {
                        @Override
                        public void exec(ResultSet rs) throws SQLException
                        {
                            String[] row = new String[]{rs.getString("Id"), rs.getString("Dam"), rs.getString("Sire"), rs.getString("Gender")};
                            for (int i=0;i<row.length;i++)
                            {
                                //R wont accept empty strings in the input, so we need to replace them with NA
                                if (StringUtils.isEmpty(row[i]))
                                    row[i] = "NA";
                            }
                            writer.writeNext(row);
                        }
                    });
                }
                else
                {
                    outputFile.delete();
                    throw new PipelineJobException("No rows present in pedigree table");
                }
            }
            finally
            {
                if (writer != null)
                    writer.close();
            }

            action.addOutput(outputFile, "Pedigree TSV", false);
        }
        catch (IOException e)
        {
            throw new RuntimeException(e);
        }

        return new RecordedActionSet(Collections.singleton(action));
    }
}