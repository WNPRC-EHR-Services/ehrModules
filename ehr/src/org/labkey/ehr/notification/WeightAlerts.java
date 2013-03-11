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
package org.labkey.ehr.notification;

import org.labkey.api.data.ColumnInfo;
import org.labkey.api.data.CompareType;
import org.labkey.api.data.Container;
import org.labkey.api.data.Results;
import org.labkey.api.data.ResultsImpl;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.data.Sort;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.TableSelector;
import org.labkey.api.query.FieldKey;
import org.labkey.api.query.QueryDefinition;
import org.labkey.api.query.QueryException;
import org.labkey.api.query.QueryHelper;
import org.labkey.api.query.QueryService;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.User;
import org.labkey.api.settings.AppProps;
import org.labkey.api.util.PageFlowUtil;
import org.labkey.api.util.ResultSetUtil;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

/**
 * Created by IntelliJ IDEA.
 * User: bbimber
 * Date: 7/23/12
 * Time: 7:41 PM
 */
public class WeightAlerts extends AbstractEHRNotification
{
    public String getName()
    {
        return "Weight Alerts";
    }

    public String getDescription()
    {
        return "This will send an email to alert of any animals with a weight change of +/- 10% in the past 30 days";
    }

    public String getEmailSubject()
    {
        return "Weight Alerts: " + _dateTimeFormat.format(new Date());
    }

    @Override
    public String getCronString()
    {
        //return "0 30 0/1 8-17 * ?";
        return "0 15 9 * * ?";
    }

    @Override
    public String getScheduleDescription()
    {
        //return "every 60 mins, at 30 min past the hour, between 8AM and 5PM";
        return "once per day, at 9:15 AM";
    }

    public String getMessage(Container c, User u)
    {
        StringBuilder msg = new StringBuilder();

        //Find today's date
        Date now = new Date();
        msg.append("This email contains alerts of weight changes of +/- 10% or greater.  It was run on: " + _dateFormat.format(now) + " at " + _timeFormat.format(now) + ".<p>");

        getLivingWithoutWeight(c, u, msg);
        processWeights(c, u, msg, 0, 30, CompareType.LTE, -10);
        processWeights(c, u, msg, 0, 30, CompareType.GTE, 10);

        return msg.toString();
    }

    private void getLivingWithoutWeight(final Container c, User u, final StringBuilder msg)
    {
        SimpleFilter filter = new SimpleFilter(FieldKey.fromString("calculated_status"), "Alive");
        filter.addCondition(FieldKey.fromString("Id/MostRecentWeight/MostRecentWeightDate"), null, CompareType.ISBLANK);
        Sort sort = new Sort(getStudy(c).getSubjectColumnName());

        TableInfo ti = getStudySchema(c, u).getTable("Demographics");
        List<FieldKey> colKeys = new ArrayList<FieldKey>();
        colKeys.add(FieldKey.fromString(getStudy(c).getSubjectColumnName()));
        colKeys.add(FieldKey.fromString("Id/age/AgeFriendly"));
        final Map<FieldKey, ColumnInfo> columns = QueryService.get().getColumns(ti, colKeys);

        TableSelector ts = new TableSelector(ti, columns.values(), filter, sort);
        if (ts.getRowCount() > 0)
        {
            msg.append("<b>WARNING: The following animals do not have a weight:</b><br>\n");
            ts.forEach(new TableSelector.ForEachBlock<ResultSet>(){
                public void exec(ResultSet rs) throws SQLException
                {
                    Results results = new ResultsImpl(rs, columns);
                    msg.append(rs.getString(getStudy(c).getSubjectColumnName()));
                    String age = results.getString(FieldKey.fromString("Id/age/AgeFriendly"));
                    if (age != null)
                        msg.append(" (Age: " + age + ")");

                    msg.append("<br>\n");
                }
            });

            msg.append("<p><a href='" + AppProps.getInstance().getBaseServerUrl() + AppProps.getInstance().getContextPath() + "/query" + c.getPath() + "/executeQuery.view?schemaName=study&query.queryName=Demographics&query.calculated_status~eq=Alive&query.Id/MostRecentWeight/MostRecentWeightDate~isblank'>Click here to view these animals</a></p>\n");
            msg.append("<hr>\n");
        }
    }

    private void processWeights(Container c, User u, final StringBuilder msg, int min, int max, CompareType ct, double pct)
    {
        Results rs = null;
        try
        {
            QueryHelper qh = new QueryHelper(c, u, "study", "weightRelChange", "With Housing");
            SimpleFilter filter = new SimpleFilter(FieldKey.fromString("Id/DataSet/Demographics/calculated_status"), "Alive");
            filter.addCondition(FieldKey.fromString("PctChange"), pct, ct);
            filter.addCondition(FieldKey.fromString("IntervalInDays"), min, CompareType.GTE);
            filter.addCondition(FieldKey.fromString("IntervalInDays"), max, CompareType.LTE);

            Calendar date = Calendar.getInstance();
            date.add(Calendar.DATE, -3);
            filter.addCondition(FieldKey.fromString("LatestWeightDate"), _dateFormat.format(date.getTime()), CompareType.DATE_GTE);

            rs = qh.select(filter);

            msg.append("<b>Weights since " + _dateFormat.format(date.getTime()) + " representing changes of " + (pct > 0 ? "+" : "") + pct + "% in the past " + max + " days:</b><p>");

            FieldKey roomKey = FieldKey.fromString("Id/curLocation/Room");
            FieldKey areaKey = FieldKey.fromString("Id/curLocation/Area");
            FieldKey cageKey = FieldKey.fromString("Id/curLocation/Cage");
            FieldKey ageKey = FieldKey.fromString("Id/age/AgeFriendly");
            FieldKey problemKey = FieldKey.fromString("Id/openProblems/problems");

            final Map<String, Map<String, List<Map<String, Object>>>> summary = new TreeMap<String, Map<String, List<Map<String, Object>>>>();
            while (rs.next())
            {
                String area = rs.getString(areaKey);
                Map<String, List<Map<String, Object>>> areaMap = summary.get(area);
                if (areaMap == null)
                {
                    areaMap = new TreeMap<String, List<Map<String, Object>>>();
                    summary.put(area, areaMap);
                }

                String room = rs.getString(roomKey);
                List<Map<String, Object>> roomList = areaMap.get(room);
                if (roomList == null)
                {
                    roomList = new ArrayList<Map<String, Object>>();
                    summary.get(area).put(room, roomList);
                }

                Map<String, Object> rowMap = new HashMap<String, Object>();
                rowMap.put("area", rs.getString(areaKey));
                rowMap.put("room", rs.getString(roomKey));
                rowMap.put("cage", rs.getString(cageKey));
                rowMap.put("age", rs.getString(ageKey));
                rowMap.put("weight", rs.getDouble("weight"));
                rowMap.put("LatestWeight", rs.getDouble("LatestWeight"));
                rowMap.put("LatestWeightDate", rs.getDate("LatestWeightDate"));
                rowMap.put("date", rs.getDate("date"));
                rowMap.put("IntervalInDays", rs.getInt("IntervalInDays"));
                rowMap.put("PctChange", rs.getDouble("PctChange"));
                rowMap.put("OpenProblems", rs.getString(problemKey));
                rowMap.put("Id", rs.getString("Id"));

                roomList.add(rowMap);

            }

            if (summary.size() > 0)
            {
                msg.append("<table border=1><tr><td>Id</td><td>Area</td><td>Room</td><td>Cage</td><td>Current Weight (kg)</td><td>Weight Date</td><td>Previous Weight (kg)</td><td>Date</td><td>Percent Change</td><td>Days Between</td><td>Age</td><td>Open Problems</td></tr>");
                for (String area : summary.keySet())
                {
                    Map<String, List<Map<String, Object>>> areaValue = summary.get(area);
                    for (String room : areaValue.keySet())
                    {
                        List<Map<String, Object>> roomValue = areaValue.get(room);
                        for (Map<String, Object> map : roomValue)
                        {
                            msg.append("<tr><td><a href='" + AppProps.getInstance().getBaseServerUrl() + AppProps.getInstance().getContextPath() + "/ehr" + c.getPath());
                            msg.append("/animalHistory.view?#inputType:singleSubject&showReport:1&subjects:");
                            msg.append(map.get("Id")).append("&combineSubj:true&activeReport:abstract'>").append(map.get("Id"));
                            msg.append("</a></td><td>").append(area).append("</td><td>").append(room).append("</td><td>").append(map.get("cage") == null ? "" : map.get("cage")).append("</td><td>");
                            msg.append(map.get("LatestWeight")).append("</td><td>").append(_dateTimeFormat.format(map.get("LatestWeightDate"))).append("</td><td>");
                            msg.append(map.get("weight")).append("</td><td>").append(_dateTimeFormat.format(map.get("date"))).append("</td><td>").append(map.get("PctChange"));
                            msg.append("</td><td>").append(map.get("IntervalInDays")).append("</td>");
                            msg.append("<td>").append(map.get("age") == null ? "" : map.get("age")).append("</td>");
                            msg.append("<td>").append(map.get("OpenProblems") == null ? "" : map.get("OpenProblems")).append("</td></tr>");
                        }
                    }
                }
                msg.append("</table><p>\n");
                msg.append("<hr>");
            }
            else
            {
                msg.append("There are no changes during this period.<hr>");
            }
        }
        catch (SQLException e)
        {
            throw new RuntimeException(e);
        }
        finally
        {
            ResultSetUtil.close(rs);
        }
    }
}
