/*
 * Copyright (c) 2015-2016 LabKey Corporation
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
package org.labkey.test.pages.ehr;

import org.labkey.test.Locator;
import org.labkey.test.WebDriverWrapper;
import org.labkey.test.WebTestHelper;
import org.labkey.test.components.ehr.panel.LocationFilterType;
import org.labkey.test.components.ehr.panel.MultiAnimalFilterType;
import org.labkey.test.components.ldk.panel.NoFiltersFilterType;
import org.labkey.test.components.ldk.panel.SingleSubjectFilterType;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.Arrays;
import java.util.List;

import static org.labkey.test.components.ldk.panel.AbstractFilterType.FILTER_SIGNAL;
import static org.labkey.test.util.Ext4Helper.Locators.ext4Button;

public class AnimalHistoryPage<A extends AnimalHistoryPage> extends ParticipantViewPage<AnimalHistoryPage.ElementCache>
{
    public AnimalHistoryPage(WebDriver driver)
    {
        super(driver);
    }

    public static AnimalHistoryPage beginAt(WebDriverWrapper test)
    {
        return beginAt(test, test.getCurrentContainerPath());
    }

    public static AnimalHistoryPage beginAt(WebDriverWrapper test, String containerPath)
    {
        test.beginAt(WebTestHelper.buildURL("ehr", containerPath, "animalHistory"));
        return new AnimalHistoryPage<>(test.getDriver());
    }

    @Override
    protected void waitForPage()
    {
        super.waitForPage();
        org.labkey.test.Locators.pageSignal(FILTER_SIGNAL).waitForElement(shortWait());
    }

    public A refreshReport()
    {
        doAndWaitForPageSignal(
            () -> elementCache().updateButton.click(),
            REPORT_TAB_SIGNAL, new WebDriverWait(getDriver(), 60));
        return (A)this;
    }

    public void searchSingleAnimal(String animalId)
    {
        selectSingleAnimalSearch().searchFor(animalId);
    }

    public void appendMultipleAnimals(String... animalIds)
    {
        selectMultiAnimalSearch().addSubjects(String.join(" ", Arrays.asList(animalIds)));
        for (String animalId : animalIds)
            elementCache().findRemoveIdButton(animalId);
        refreshReport();
    }

    public SingleSubjectFilterType<A> selectSingleAnimalSearch()
    {
        return new SingleSubjectFilterType<>((A)this).select();
    }

    public MultiAnimalFilterType<A> selectMultiAnimalSearch()
    {
        return new MultiAnimalFilterType<>((A)this).select();
    }

    public LocationFilterType<A> selectCurrectLocation()
    {
        return new LocationFilterType<>((A)this).select();
    }

    public NoFiltersFilterType<A> selectEntireDatabaseSearch()
    {
        return new NoFiltersFilterType<>((A)this).select();
    }

    public List<String> getFoundIds()
    {
        return getTexts(elementCache().findFoundIdButtons());
    }

    public List<String> getAliasIds()
    {
        return getTexts(elementCache().findAliasedIdButtons());
    }

    public List<String> getConflictedIds()
    {
        return getTexts(elementCache().findConflictedIdButtons());
    }

    public List<String> getNotFoundIds()
    {
        return getTexts(elementCache().findNotFoundIdButtons());
    }

    public List<String> getIds()
    {
        return getTexts(elementCache().findAllIdButtons());
    }

    @Override
    protected ElementCache newElementCache()
    {
        return new ElementCache();
    }

    protected class ElementCache extends ParticipantViewPage.ElementCache
    {
        protected final WebElement updateButton = ext4Button("Update Report").findWhenNeeded(this).withTimeout(10000);

        private static final String btnPanelPrefix = "btnPanel";
        private static final String totalPanelPrefix = "totalPanel";
        private static final String subjects = "Subjects";
        private static final String aliases = "Aliases";
        private static final String conflicted = "Conflicted";
        private static final String notfound = "NotFound";

        protected WebElement findRemoveIdButton(String animalId)
        {
            return MultiAnimalFilterType.subjectButtonPanel.append(ext4Button(animalId)).waitForElement(this, 1000);
        }

        protected List<WebElement> findAllIdButtons()
        {
            return MultiAnimalFilterType.subjectButtonPanel.append(ext4Button()).waitForElements(this, 1000);
        }

        protected List<WebElement> findFoundIdButtons()
        {
            return MultiAnimalFilterType.subjectButtonPanel.append(Locator.id(btnPanelPrefix + subjects))
                    .append(ext4Button()).findElements(this);
        }

        protected List<WebElement> findAliasedIdButtons()
        {
            return MultiAnimalFilterType.subjectButtonPanel.append(Locator.id(btnPanelPrefix + aliases))
                    .append(ext4Button()).findElements(this);
        }

        protected List<WebElement> findConflictedIdButtons()
        {
            return MultiAnimalFilterType.subjectButtonPanel.append(Locator.id(btnPanelPrefix + conflicted))
                    .append(ext4Button()).findElements(this);
        }

        protected List<WebElement> findNotFoundIdButtons()
        {
            return MultiAnimalFilterType.subjectButtonPanel.append(Locator.id(btnPanelPrefix + notfound))
                    .append(ext4Button()).findElements(this);
        }
    }
}