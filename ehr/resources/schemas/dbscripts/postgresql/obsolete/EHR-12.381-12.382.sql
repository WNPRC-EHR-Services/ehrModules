/*
 * Copyright (c) 2013-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
ALTER TABLE ehr.formtemplates drop column template;
ALTER TABLE ehr.formtemplaterecords ADD targettemplate varchar(100);