/*
 * Copyright (c) 2017 LabKey Corporation
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

package org.labkey.ehr_billing;

import org.jetbrains.annotations.NotNull;
import org.labkey.api.data.Container;
import org.labkey.api.data.ContainerManager;
import org.labkey.api.ehr_billing.EHR_BillingDomainKind;
import org.labkey.api.exp.property.PropertyService;
import org.labkey.api.module.Module;
import org.labkey.api.module.ModuleContext;
import org.labkey.api.module.SpringModule;
import org.labkey.api.query.DefaultSchema;
import org.labkey.api.query.QuerySchema;
import org.labkey.api.view.WebPartFactory;
import org.labkey.api.security.roles.RoleManager;
import org.labkey.ehr.security.EHR_BillingRole;

import java.util.Collection;
import java.util.Collections;
import java.util.Set;

public class EHR_BillingModule extends SpringModule
{
    public static final String NAME = "EHR_Billing";

    @Override
    public String getName()
    {
        return NAME;
    }

    @Override
    public double getVersion()
    {
        return 17.32;
    }

    @Override
    public boolean hasScripts()
    {
        return true;
    }

    @Override
    @NotNull
    protected Collection<WebPartFactory> createWebPartFactories()
    {
        return Collections.emptyList();
    }

    @Override
    protected void init()
    {
        addController(org.labkey.ehr_billing.EHR_BillingController.NAME, EHR_BillingController.class);
        PropertyService.get().registerDomainKind(new EHR_BillingDomainKind());
        RoleManager.registerRole(new EHR_BillingRole());
    }

    @Override
    protected void startupAfterSpringConfig(ModuleContext moduleContext)
    {
        // add a container listener so we'll know when our container is deleted:
        ContainerManager.addContainerListener(new EHR_BillingContainerListener());
        DefaultSchema.registerProvider(EHR_BillingSchema.NAME, new DefaultSchema.SchemaProvider(this)
        {
            public QuerySchema createSchema(final DefaultSchema schema, Module module)
            {
                return new EHR_BillingUserSchema(EHR_BillingSchema.NAME, null, schema.getUser(), schema.getContainer(), EHR_BillingSchema.getInstance().getSchema());
            }
        });
    }

    @Override
    @NotNull
    public Collection<String> getSummary(Container c)
    {
        return Collections.emptyList();
    }

    @Override
    @NotNull
    public Set<String> getSchemaNames()
    {
        return Collections.singleton(EHR_BillingSchema.NAME);
    }
}