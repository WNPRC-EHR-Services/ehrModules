/*
 * Copyright (c) 2018 LabKey Corporation
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
EXEC core.fn_dropifexists 'invoicedItems', 'ehr_billing', 'CONSTRAINT', 'FK_INVOICEDITEMS_INVOICENUM';
GO

EXEC core.fn_dropifexists 'chargeableItems','ehr_billing','TABLE', NULL;
GO

EXEC core.fn_dropifexists 'chargeRateExemptions','ehr_billing','TABLE', NULL;
GO

EXEC core.fn_dropifexists 'chargeUnits','ehr_billing','TABLE', NULL;
GO

EXEC core.fn_dropifexists 'invoice','ehr_billing','TABLE', NULL;
GO

CREATE TABLE ehr_billing.chargeableItems (

  rowId int IDENTITY(1,1),
  name varchar(200),
  shortName varchar(100),
  category varchar(200),
  comment varchar(4000),
  active BIT default 1,
  startDate DATETIME,
  endDate DATETIME,
  itemCode varchar(100),
  departmentCode varchar(100),
  allowsCustomUnitCost BIT DEFAULT 0,
  canRaiseFA BIT DEFAULT 0,
  allowBlankId BIT DEFAULT 0,
  LSID LSIDtype,
  container ENTITYID NOT NULL,
  createdBy USERID,
  created DATETIME,
  modifiedBy USERID,
  modified DATETIME,

  CONSTRAINT PK_chargeableItems PRIMARY KEY (rowId),
  CONSTRAINT FK_EHR_BILLING_CHARGEABLEITEMS_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId)
);

CREATE TABLE ehr_billing.chargeRateExemptions (

  rowId int IDENTITY(1,1),
  project int,
  chargeId int,
  unitcost double precision,
  startDate DATETIME,
  endDate DATETIME,
  remark TEXT,
  LSID LSIDtype,
  container ENTITYID NOT NULL,
  createdBy USERID,
  created DATETIME,
  modifiedBy USERID,
  modified DATETIME,

  CONSTRAINT PK_chargeRateExemptions PRIMARY KEY (rowId),
  CONSTRAINT FK_EHR_BILLING_CHARGERATEEXEMPTIONS_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId)
);

CREATE TABLE ehr_billing.chargeUnits (

  chargetype varchar(100) NOT NULL,
  shownInBlood BIT default 0,
  shownInLabwork BIT default 0,
  shownInMedications BIT default 0,
  shownInProcedures BIT default 0,
  servicecenter varchar(100),
  active BIT default 1,
  LSID LSIDtype,
  container entityid,
  createdBy int,
  created DATETIME,
  modifiedBy int,
  modified DATETIME,

  CONSTRAINT PK_chargeUnits PRIMARY KEY (chargetype),
  CONSTRAINT FK_EHR_BILLING_CHARGEUNITS_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId)
);

CREATE TABLE ehr_billing.invoice (

  rowId int IDENTITY(1,1),
  invoiceNumber varchar(20) NOT NULL,
  invoiceRunId ENTITYID,
  accountNumber varchar(10),
  invoiceSentOn DATETIME,
  invoiceAmount double precision,
  invoiceSentComment varchar(10),
  paymentAmountReceived double precision,
  fullPaymentReceived BIT,
  paymentReceivedOn DATETIME,
  paymentReceivedComment varchar(10),
  LSID LSIDtype,
  container ENTITYID NOT NULL,
  createdBy USERID,
  created DATETIME,
  modifiedBy USERID,
  modified DATETIME,

  CONSTRAINT PK_EHR_BILLING_INVOICE_INVNUM PRIMARY KEY (invoiceNumber),
  CONSTRAINT FK_EHR_BILLING_INVOICE_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId)
);
GO

CREATE INDEX EHR_BILLING_INVOICE_CONTAINER_INDEX ON ehr_billing.invoice (Container);
CREATE INDEX EHR_BILLING_CHARGEUNITS_CONTAINER_INDEX ON ehr_billing.chargeUnits (Container);
CREATE INDEX EHR_BILLING_CHARGERATEEXEMPTIONS_CONTAINER_INDEX ON ehr_billing.chargeRateExemptions (Container);
CREATE INDEX EHR_BILLING_CHARGEABLEITEMS_CONTAINER_INDEX ON ehr_billing.chargeableItems (Container);
GO

ALTER TABLE ehr_billing.invoiceditems ADD Lsid LSIDType;
ALTER TABLE ehr_billing.invoiceruns ADD Lsid LSIDType;
ALTER TABLE ehr_billing.miscCharges ADD Lsid LSIDType;
GO

EXEC core.fn_dropifexists 'invoiceRuns', 'ehr_billing', 'CONSTRAINT', 'FK_EHR_BILLING_INVOICE_RUNS_CONTAINER';
GO

EXEC core.fn_dropifexists 'invoicedItems', 'ehr_billing', 'CONSTRAINT', 'FK_EHR_BILLING_INVOICED_ITEMS_CONTAINER';
GO

EXEC core.fn_dropifexists 'miscCharges', 'ehr_billing', 'CONSTRAINT', 'FK_EHR_BILLING_MISC_CHARGES_CONTAINER';
GO

EXEC core.fn_dropifexists 'invoiceRuns', 'ehr_billing', 'INDEX', 'EHR_BILLING_INVOICE_RUNS_CONTAINER_INDEX';
GO

EXEC core.fn_dropifexists 'invoicedItems', 'ehr_billing', 'INDEX', 'EHR_BILLING_INVOICED_ITEMS_CONTAINER_INDEX';
GO

EXEC core.fn_dropifexists 'miscCharges', 'ehr_billing', 'INDEX', 'EHR_BILLING_MISC_CHARGES_CONTAINER_INDEX';
GO

ALTER TABLE ehr_billing.invoiceRuns ADD CONSTRAINT FK_EHR_BILLING_INVOICE_RUNS_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId);
CREATE INDEX EHR_BILLING_INVOICE_RUNS_CONTAINER_INDEX ON ehr_billing.invoiceRuns (Container);

ALTER TABLE ehr_billing.invoicedItems ADD CONSTRAINT FK_EHR_BILLING_INVOICED_ITEMS_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId);
CREATE INDEX EHR_BILLING_INVOICED_ITEMS_CONTAINER_INDEX ON ehr_billing.invoicedItems (Container);

ALTER TABLE ehr_billing.miscCharges ADD CONSTRAINT FK_EHR_BILLING_MISC_CHARGES_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId);
CREATE INDEX EHR_BILLING_MISC_CHARGES_CONTAINER_INDEX ON ehr_billing.miscCharges (Container);
GO

EXEC core.fn_dropifexists 'invoiceRuns', 'ehr_billing', 'COLUMN', 'invoiceNumber';
GO

EXEC core.fn_dropifexists 'invoicedItems', 'ehr_billing', 'COLUMN', 'invoiceNumber';
GO

TRUNCATE TABLE ehr_billing.invoicedItems;
GO

ALTER TABLE ehr_billing.invoicedItems ADD invoiceNumber varchar(20) NOT NULL;
GO

ALTER TABLE ehr_billing.invoice ADD CONSTRAINT UNIQUE_INVOICE_NUM UNIQUE (invoiceNumber);
ALTER TABLE ehr_billing.invoicedItems ADD CONSTRAINT FK_INVOICEDITEMS_INVOICENUM FOREIGN KEY (invoiceNumber) REFERENCES ehr_billing.invoice (invoiceNumber);
GO

EXEC core.fn_dropifexists 'invoicedItems', 'ehr_billing', 'CONSTRAINT', 'EHR_BILLING_INVOICEDITEMS_INVNUM_INDEX';
GO

CREATE INDEX EHR_BILLING_INVOICEDITEMS_INVNUM_INDEX ON ehr_billing.invoicedItems (invoiceNumber);
GO

CREATE TABLE ehr_billing.chargeableItemCategories (
  rowId int identity(1,1) NOT NULL,
  name varchar(100) NOT NULL,
  dateDisabled datetime,

  container entityid NOT NULL,
  createdBy int,
  created datetime,
  modifiedBy int,
  modified datetime,

  CONSTRAINT PK_chargeableItemCategories PRIMARY KEY (rowId)
);
GO

TRUNCATE TABLE ehr_billing.chargeableItems;
GO
ALTER TABLE ehr_billing.chargeableItems DROP COLUMN category;
GO
ALTER TABLE ehr_billing.chargeableItems ADD chargeCategoryId INT NOT NULL;
GO
ALTER TABLE ehr_billing.chargeableItems ADD CONSTRAINT fk_chargeableItems FOREIGN KEY (chargeCategoryId) REFERENCES ehr_billing.chargeableItemCategories (rowId);
GO
CREATE INDEX IX_ehr_billing_chargebleItems ON ehr_billing.chargeableItems (chargeCategoryId);
GO

ALTER TABLE ehr_billing.chargeRates ALTER COLUMN unitCost DECIMAL(13,2);
GO
ALTER TABLE ehr_billing.invoice ALTER COLUMN invoiceAmount DECIMAL(13,2);
GO
ALTER TABLE ehr_billing.invoice ALTER COLUMN paymentAmountReceived DECIMAL(13,2);
GO
ALTER TABLE ehr_billing.invoicedItems ALTER COLUMN unitCost DECIMAL(13,2);
GO
ALTER TABLE ehr_billing.invoicedItems ALTER COLUMN totalCost DECIMAL(13,2);
GO
ALTER TABLE ehr_billing.miscCharges ALTER COLUMN unitCost DECIMAL(13,2);
GO

CREATE TABLE ehr_billing.dataAccess (
  rowId int identity(1,1) NOT NULL,
  userid int,
  investigatorId int,
  project int,
  allData bit,

  container ENTITYID NOT NULL,
  createdBy USERID,
  created DATETIME,
  modifiedBy USERID,
  modified DATETIME,

  CONSTRAINT PK_dataAccess PRIMARY KEY (rowId),
  CONSTRAINT FK_EHR_BILLING_DATA_ACCESS_CONTAINER FOREIGN KEY (Container) REFERENCES core.Containers (EntityId)
);

CREATE INDEX EHR_BILLING_DATA_ACCESS_CONTAINER_INDEX ON ehr_billing.dataAccess (Container);
GO