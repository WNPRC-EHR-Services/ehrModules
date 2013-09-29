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
package org.labkey.test.tests;

import org.junit.experimental.categories.Category;
import org.labkey.remoteapi.Connection;
import org.labkey.remoteapi.query.Filter;
import org.labkey.remoteapi.query.SelectRowsCommand;
import org.labkey.remoteapi.query.SelectRowsResponse;
import org.labkey.remoteapi.query.Sort;
import org.labkey.test.Locator;
import org.labkey.test.TestTimeoutException;
import org.labkey.test.categories.EHR;
import org.labkey.test.categories.External;
import org.labkey.test.categories.ONPRC;
import org.labkey.test.util.DataRegionTable;
import org.labkey.test.util.Ext4HelperWD;
import org.labkey.test.util.LogMethod;
import org.labkey.test.util.PasswordUtil;
import org.labkey.test.util.ext4cmp.Ext4CmpRefWD;
import org.labkey.test.util.ext4cmp.Ext4FieldRefWD;
import org.labkey.test.util.ext4cmp.Ext4GridRefWD;
import org.openqa.selenium.Alert;
import org.openqa.selenium.Keys;
import org.testng.Assert;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * User: bimber
 * Date: 1/25/13
 * Time: 4:31 PM
 */
@Category({External.class, EHR.class, ONPRC.class})
public class ONPRC_EHRTest extends AbstractEHRTest
{
    protected String PROJECT_NAME = "ONPRC_EHR_TestProject";

    @Override
    protected String getProjectName()
    {
        return PROJECT_NAME;
    }

    @Override
    public String getContainerPath()
    {
        return PROJECT_NAME;
    }

    @Override
    protected void goToEHRFolder()
    {
        goToProjectHome();
    }

//    @Override
//    public void doCleanup(boolean afterTest) throws TestTimeoutException
//    {
//        super.doCleanup(afterTest);
//    }

    public void runUITests() throws Exception
    {
        initProject();

        //TODO: these should be separated to run independently so 1 failure doesnt kill the others
        doCustomActionsTests();
        doNotificationTests();
        doDataEntryTests();
        doReportingTests();
        doApiTests();
    }

    protected void doApiTests()
    {
        //blood draw volumes

        //all other custom trigger script code
    }

    protected void doReportingTests()
    {
        //animal history

    }

    protected void doCustomActionsTests()
    {
        //colony overview
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Colony Overview"));
        waitForElement(Locator.tagContainingText("div", "No animals were found"), WAIT_FOR_JAVASCRIPT * 2);

        waitAndClick(Locator.tagContainingText("span", "SPF Colony"));
        waitForElement(Locator.tagContainingText("b", "SPF 9 (ESPF)"), WAIT_FOR_JAVASCRIPT * 2);

        waitAndClick(Locator.tagContainingText("span", "Housing Summary"));
        waitForElement(Locator.tagContainingText("div", "No records were found"), WAIT_FOR_JAVASCRIPT * 2);

        waitAndClick(Locator.tagContainingText("span", "Utilization"));
        waitForElement(Locator.tagContainingText("div", "No records found"), WAIT_FOR_JAVASCRIPT * 2);

        waitAndClick(Locator.tagContainingText("span", "Clinical"));
        waitForElement(Locator.tagContainingText("div", "There are no open cases or problems"), WAIT_FOR_JAVASCRIPT * 2);

        //bulk history export
        log("testing bulk history export");
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Bulk History Export"));
        waitForElement(Locator.tagContainingText("label", "Enter Animal Id(s)"));
        Ext4FieldRefWD.getForLabel(this, "Enter Animal Id(s)").setValue("12345;23432\nABCDE");
        Ext4FieldRefWD.getForLabel(this, "Show Snapshot Only").setValue(true);
        Ext4FieldRefWD.getForLabel(this, "Redact Information").setValue(true);
        clickAndWait(Locator.ext4Button("Submit"));
        assertElementPresent(Locator.tagContainingText("b", "12345"));
        assertElementPresent(Locator.tagContainingText("b", "23432"));
        assertElementPresent(Locator.tagContainingText("b", "ABCDE"));
        assertElementNotPresent(Locator.tagContainingText("b", "Chronological History").notHidden()); //check hide history
        assertElementNotPresent(Locator.tagContainingText("label", "Projects").notHidden()); //check redaction

        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Bulk History Export"));
        waitForElement(Locator.tagContainingText("label", "Enter Animal Id(s)"));
        Ext4FieldRefWD.getForLabel(this, "Enter Animal Id(s)").setValue("12345;23432\nABCDE");
        clickAndWait(Locator.ext4Button("Submit"));
        assertElementPresent(Locator.tagContainingText("b", "12345"));
        assertElementPresent(Locator.tagContainingText("b", "23432"));
        assertElementPresent(Locator.tagContainingText("b", "ABCDE"));
        assertElementPresent(Locator.tagContainingText("b", "Chronological History").notHidden()); //check hide history
        assertElementPresent(Locator.tagContainingText("label", "Projects").notHidden()); //check redaction

        //exposure report
        log("testing exposure export");
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Exposure Report"));
        waitForElement(Locator.tagContainingText("label", "Enter Animal Id"));
        Ext4FieldRefWD.getForLabel(this, "Enter Animal Id").setValue("12345");
        clickAndWait(Locator.ext4Button("Submit"));
        assertElementPresent(Locator.tagContainingText("b", "12345"));
        assertElementPresent(Locator.tagContainingText("b", "Chronological History"));

        //compare lists of animals
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Compare Lists of Animals"));
        waitForElement(Locator.id("unique"));
        setFormElement(Locator.id("unique"), "1,2,1\n3,3;4");
        click(Locator.id("uniqueButton"));
        waitForElement(Locator.id("uniqueInputTotal").withText("6 total"));
        assertElementPresent(Locator.id("uniqueTargetTotal").withText("4 total"));
        Assert.assertEquals(getDriver().findElement(Locator.id("uniqueTarget").toBy()).getAttribute("value"), "1\n2\n3\n4", "Incorrect text");

        setFormElement(Locator.id("subtract1"), "1,2,1\n3,3;4");
        setFormElement(Locator.id("subtract2"), "1,4;23 48");
        click(Locator.id("compareButton"));
        waitForElement(Locator.id("subtractList1Total").withText("6 total"));
        assertElementPresent(Locator.id("subtractList2Total").withText("4 total"));

        assertElementPresent(Locator.id("intersectTargetTotal").withText("2 total"));
        Assert.assertEquals(getDriver().findElement(Locator.id("intersectTarget").toBy()).getAttribute("value"), "1\n4", "Incorrect text");

        assertElementPresent(Locator.id("subtractTargetTotal").withText("3 total"));
        Assert.assertEquals(getDriver().findElement(Locator.id("subtractTarget").toBy()).getAttribute("value"), "2\n3\n3", "Incorrect text");

        assertElementPresent(Locator.id("subtractTargetTotal2").withText("2 total"));
        Assert.assertEquals(getDriver().findElement(Locator.id("subtractTarget2").toBy()).getAttribute("value"), "23\n48", "Incorrect text");

        //animal groups
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Animal Groups"));
        waitForElement(Locator.tagContainingText("span", "Active Groups"));
        DataRegionTable dr = new DataRegionTable("query", this);
        //TODO: create dummy groups


        //more reports
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "More Reports"));
        waitForElement(Locator.tagContainingText("a", "View Summary of Clinical Tasks"));
        //TODO: consider walking links?


        //printable reports
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "Printable Reports"));
        waitForElement(Locator.ext4Button("Print Version"));
    }

    protected void doDataEntryTests() throws Exception
    {
        doLabworkResultEntryTest();

    }

    protected void doLabworkResultEntryTest() throws Exception
    {
        _helper.goToTaskForm("Lab Results");
        _helper.getExt4FieldForFormSection("Task", "Title").setValue("Test Task 1");

        Ext4GridRefWD panelGrid = _helper.getExt4GridForFormSection("Panels / Services");

        //panel, tissue, type
        String[][] panels = new String[][]{
                {"BASIC Chemistry Panel in-house", "T-0X500", "Biochemistry", "chemistry_tests"},
                {"Anaerobic Culture", null, "Microbiology", null, "T-0X000"},  //NOTE: cultures dont have a default tissue, so we set it using value
                {"CBC with automated differential", "T-0X000", "Hematology", "hematology_tests"},
                {"Antibiotic Sensitivity", null, "Antibiotic Sensitivity", null},
                {"Fecal parasite exam", "T-6Y100", "Parasitology", null},
                {"ESPF Surveillance - Monthly", "T-0X500", "Serology/Virology", null},
                {"Urinalysis", "T-7X100", "Urinalysis", "urinalysis_tests"},
                {"Occult Blood", "T-6Y100", "Misc Tests", "misc_tests"}
        };

        int panelIdx = 1;
        for (String[] arr : panels)
        {
            _helper.addRecordToGrid(panelGrid);
            panelGrid.setGridCell(panelIdx, "Id", "Animal" + panelIdx);
            panelGrid.setGridCell(panelIdx, "servicerequested", arr[0]);

            if (arr[1] != null && arr.length == 4)
            {
                Assert.assertEquals(panelGrid.getFieldValue(panelIdx, "tissue"), arr[1], "Tissue not set properly");
            }
            else if (arr.length > 4)
            {
                //for some panels, tissue will not have a default.  therefore we set one and verify it gets copied into the results downstream
                panelGrid.setGridCell(panelIdx, "tissue", arr[4]);
                arr[1] = arr[4];
            }

            Assert.assertEquals(panelGrid.getFieldValue(panelIdx, "type"), arr[2], "Category not set properly");

            validatePanelEntry(arr[0], arr[1], arr[2], arr[3]);

            panelIdx++;
        }

        click(_helper.getDataEntryButton("More Actions"));
        _ext4Helper.clickExt4MenuItem("Discard");
        waitForElement(Ext4HelperWD.ext4Window("Discard Form"));
        clickAndWait(Locator.ext4Button("Yes"));
    }

    @LogMethod
    private void validatePanelEntry(String panelName, String tissue, String title, String lookupTable) throws Exception
    {
        SelectRowsCommand cmd = new SelectRowsCommand("ehr_lookups", "labwork_panels");
        cmd.addFilter(new Filter("servicename", panelName));
        cmd.addSort(new Sort("sort_order"));
        SelectRowsResponse srr = cmd.execute(new Connection(getBaseURL(), PasswordUtil.getUsername(), PasswordUtil.getPassword()), getContainerPath());
        List<Map<String, Object>> expectedRows = srr.getRows();

        waitAndClick(Ext4HelperWD.ext4Tab(title));
        Ext4GridRefWD grid = _helper.getExt4GridForFormSection(title);
        waitForElement(Locator.id(grid.getId()).notHidden());

        grid.clickTbarButton("Copy From Above");
        waitForElement(Ext4HelperWD.ext4Window("Copy From Above"));
        Ext4CmpRefWD submitBtn = _ext4Helper.queryOne("button[text='Submit']", Ext4CmpRefWD.class);
        submitBtn.waitForEnabled();
        click(Locator.ext4Button("Submit"));

        if (expectedRows.size() == 0)
        {
            grid.waitForRowCount(1);

            if (tissue != null && grid.isColumnPresent("tissue", true))
            {
                Assert.assertEquals(grid.getFieldValue(1, "tissue"), tissue, "Tissue was not copied from runs action");
            }
        }
        else
        {
            grid.waitForRowCount(expectedRows.size());

            int rowIdx = 1;  //1-based
            String testFieldName = null;
            for (Map<String, Object> row : expectedRows)
            {
                testFieldName = (String)row.get("testfieldname");
                String testname = (String)row.get("testname");
                Assert.assertEquals(grid.getFieldValue(rowIdx, testFieldName), testname, "Wrong testId");

                String method = (String)row.get("method");
                if (method != null)
                {
                    Assert.assertEquals(grid.getFieldValue(rowIdx, "method"), method, "Wrong method");
                }

                if (lookupTable != null)
                {
                    String units = getUnits(lookupTable, testname);
                    if (units != null)
                    {
                        Assert.assertEquals(grid.getFieldValue(rowIdx, "units"), units, "Wrong units");
                    }
                }

                rowIdx++;
            }

            //iterate rows, checking keyboard navigation
            if (testFieldName != null)
            {
                Long rowCount = grid.getRowCount();

                //TODO: test keyboard navigation
                //            grid.startEditing(1, grid.getIndexOfColumn(testFieldName));

                // click through each testId and make sure the value persists.
                // this might not occur if the lookup is invalid
                for (int j = 1; j <= rowCount; j++)
                {
                    Object origVal = grid.getFieldValue(j, testFieldName);

                    grid.startEditing(j, testFieldName);

                    //TODO: test keyboard navigation
                    grid.completeEdit();
                    //grid.getActiveGridEditor().sendKeys(Keys.ENTER);

                    Object newVal = grid.getFieldValue(j, testFieldName);
                    Assert.assertEquals(newVal, origVal, "Test Id value did not match after key navigation");
                }
            }
        }
    }

    private Map<String, Map<String, String>> _unitsMap = new HashMap<>();

    private String getUnits(String queryName, String testId) throws Exception
    {
        if (_unitsMap.containsKey(queryName))
        {
            return _unitsMap.get(queryName).get(testId);
        }

        Map<String, String> queryResults = new HashMap<>();
        SelectRowsCommand cmd = new SelectRowsCommand("ehr_lookups", queryName);
        SelectRowsResponse srr = cmd.execute(new Connection(getBaseURL(), PasswordUtil.getUsername(), PasswordUtil.getPassword()), getContainerPath());
        for (Map<String, Object> row : srr.getRows())
        {
            if (row.get("units") != null)
                queryResults.put((String)row.get("testid"), (String)row.get("units"));
        }

        _unitsMap.put(queryName, queryResults);

        return _unitsMap.get(queryName).get(testId);
    }

    protected void doNotificationTests()
    {
        goToProjectHome();
        waitAndClickAndWait(Locator.tagContainingText("a", "EHR Admin Page"));
        waitAndClickAndWait(Locator.tagContainingText("a", "Notification Admin"));

        //set general settings
        _helper.waitForCmp("field[fieldLabel='Notification User']");
        Ext4FieldRefWD.getForLabel(this, "Notification User").setValue(PasswordUtil.getUsername());
        Ext4FieldRefWD.getForLabel(this, "Reply Email").setValue("fakeEmail@fakeDomain.com");
        Ext4CmpRefWD btn = _ext4Helper.queryOne("button[text='Save']", Ext4CmpRefWD.class);
        btn.waitForEnabled();
        waitAndClick(Locator.ext4Button("Save"));
        waitForElement(Ext4HelperWD.ext4Window("Success"));
        waitAndClickAndWait(Locator.ext4Button("OK"));
        _helper.waitForCmp("field[fieldLabel='Notification User']");

        Locator manageLink = Locator.tagContainingText("a", "Manage Subscribed Users/Groups").index(1);
        waitAndClick(manageLink);
        waitForElement(Ext4HelperWD.ext4Window("Manage Subscribed Users"));
        Ext4FieldRefWD combo = Ext4FieldRefWD.getForLabel(this, "Add User Or Group");
        _ext4Helper.selectComboBoxItem(Locator.id(combo.getId()), PasswordUtil.getUsername(), true);
        waitForElement(Locator.ext4Button("Remove"));

        combo = Ext4FieldRefWD.getForLabel(this, "Add User Or Group");

        _ext4Helper.selectComboBoxItem(Locator.id(combo.getId()), BASIC_SUBMITTER.getEmail(), true);
        waitForElement(Locator.ext4Button("Remove"), 2);
        waitAndClick(Locator.ext4Button("Close"));

        waitAndClick(manageLink);
        waitForElement(Ext4HelperWD.ext4Window("Manage Subscribed Users"));
        waitForElement(Locator.tagContainingText("div", PasswordUtil.getUsername()));
        waitForElement(Locator.tagContainingText("div", BASIC_SUBMITTER.getEmail()));
        assertElementPresent(Locator.ext4Button("Remove"), 2);
        waitAndClick(Locator.ext4Button("Remove").index(1));
        waitAndClick(Locator.ext4Button("Close"));

        waitAndClick(manageLink);
        waitForElement(Ext4HelperWD.ext4Window("Manage Subscribed Users"));
        waitForElement(Locator.tagContainingText("div", PasswordUtil.getUsername()));
        assertElementPresent(Locator.ext4Button("Remove"), 1);
        waitAndClick(Locator.ext4Button("Close"));

        //iterate all notifications and run them.
        log("running all notifications");

        int count = getElementCount(Locator.tagContainingText("a", "Run Report In Browser"));
        for (int i = 0; i < count; i++)
        {
            beginAt(getBaseURL() + "/ldk/" + getContainerPath() + "/notificationAdmin.view");
            waitAndClickAndWait(Locator.tagContainingText("a", "Run Report In Browser").index(i));
            waitForText("The notification email was last sent on:");
            assertTextNotPresent("not configured");
        }
    }

    @Override
    protected void createProjectAndFolders()
    {
        _containerHelper.createProject(PROJECT_NAME, "ONPRC EHR");
    }

    @Override
    protected void populateInitialData()
    {
        beginAt(getBaseURL() + "/onprc_ehr/" + getContainerPath() + "/populateData.view");

        waitAndClickButton("Delete Data From Lookup Sets", 0);
        waitForElement(Locator.tagContainingText("div", "Delete Complete"), 200000);
        waitAndClickButton("Populate Lookup Sets", 0);
        waitForElement(Locator.tagContainingText("div", "Populate Complete"), 200000);
        sleep(2000);

        waitAndClickButton("Delete All", 0);
        waitForElement(Locator.tagContainingText("div", "Delete Complete"), 200000);
        waitAndClickButton("Populate All", 0);
        waitForElement(Locator.tagContainingText("div", "Populate Complete"), 200000);

        //NOTE: this is excluded from populate all since it changes rarely
        waitAndClickButton("Delete Data From SNOMED Codes", 0);
        waitForElement(Locator.tagContainingText("div", "Delete Complete"), 200000);
        waitAndClickButton("Populate SNOMED Codes", 0);
        waitForElement(Locator.tagContainingText("div", "Populate Complete"), 200000);
    }

    @Override
    protected void doStudyImport()
    {
        File path = new File(getLabKeyRoot(), "/server/customModules/onprc_ehr/resources/referenceStudy");
        setPipelineRoot(path.getPath());

        goToModule("Pipeline");
        waitAndClickButton("Process and Import Data");

        _extHelper.selectFileBrowserRoot();
        _extHelper.clickFileBrowserFileCheckbox("study.xml");

        if (isTextPresent("Reload Study"))
            selectImportDataAction("Reload Study");
        else
            selectImportDataAction("Import Study");

        waitForPipelineJobsToComplete(1, "Study import", false);
    }

    @Override
    protected String getStudyPolicyXML()
    {
        return "/sampledata/study/onprcEHRStudyPolicy.xml";
    }
}