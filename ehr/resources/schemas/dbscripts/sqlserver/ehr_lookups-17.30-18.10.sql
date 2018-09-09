/* ehr_lookups-17.30-17.31.sql */

-- add some base table columns (i.e. description, dateDisabled, etc.)
ALTER TABLE ehr_lookups.snomed ADD description VARCHAR(4000);
ALTER TABLE ehr_lookups.snomed ADD dateDisabled DATETIME;
ALTER TABLE ehr_lookups.source ADD description VARCHAR(4000);
ALTER TABLE ehr_lookups.species_codes ADD genus VARCHAR(255);
ALTER TABLE ehr_lookups.species_codes ADD species VARCHAR(255);
ALTER TABLE ehr_lookups.species_codes ADD description VARCHAR(4000);
ALTER TABLE ehr_lookups.species_codes ADD dateDisabled DATETIME;
ALTER TABLE ehr_lookups.calculated_status_codes ADD description VARCHAR(4000);
ALTER TABLE ehr_lookups.cage_type ADD description VARCHAR(4000);
ALTER TABLE ehr_lookups.cage_type ADD dateDisabled DATETIME;

/* ehr_lookups-17.32-17.33.sql */

-- add Lsid column to ehr_lookups tables to allow them to be extensible
ALTER TABLE ehr_lookups.geographic_origins ADD Lsid LSIDtype;
ALTER TABLE ehr_lookups.rooms ADD Lsid LsidType;
ALTER TABLE ehr_lookups.buildings ADD Lsid LsidType;
ALTER TABLE ehr_lookups.treatment_codes ADD Lsid LsidType;
GO

-- add Container column to the same ehr_lookups tables (values to be populated in Java upgrade script)
ALTER TABLE ehr_lookups.geographic_origins ADD Container ENTITYID;
ALTER TABLE ehr_lookups.rooms ADD Container ENTITYID;
ALTER TABLE ehr_lookups.buildings ADD Container ENTITYID;
ALTER TABLE ehr_lookups.treatment_codes ADD Container ENTITYID;
GO

-- add the FK for those Container columns
ALTER TABLE ehr_lookups.geographic_origins ADD CONSTRAINT FK_geographic_origins_Container FOREIGN KEY (Container) REFERENCES core.Containers(EntityId);
ALTER TABLE ehr_lookups.rooms ADD CONSTRAINT FK_rooms_Container FOREIGN KEY (Container) REFERENCES core.Containers(EntityId);
ALTER TABLE ehr_lookups.buildings ADD CONSTRAINT FK_buildings_Container FOREIGN KEY (Container) REFERENCES core.Containers(EntityId);
ALTER TABLE ehr_lookups.treatment_codes ADD CONSTRAINT FK_treatment_codes_Container FOREIGN KEY (Container) REFERENCES core.Containers(EntityId);
GO

-- Java upgrade script to populate the Container column from site-level EHRStudyContainer module property
EXEC core.executeJavaUpgradeCode 'setEhrLookupsContainerFirstSet';
GO

-- remove any NULL rows for Container
DELETE FROM ehr_lookups.geographic_origins WHERE Container IS NULL;
DELETE FROM ehr_lookups.rooms WHERE Container IS NULL;
DELETE FROM ehr_lookups.buildings WHERE Container IS NULL;
DELETE FROM ehr_lookups.treatment_codes WHERE Container IS NULL;
GO

--set NOT NULL constraint for the Container columns
ALTER TABLE ehr_lookups.geographic_origins ALTER COLUMN Container ENTITYID NOT NULL;
ALTER TABLE ehr_lookups.rooms ALTER COLUMN Container ENTITYID NOT NULL;
ALTER TABLE ehr_lookups.buildings ALTER COLUMN Container ENTITYID NOT NULL;
ALTER TABLE ehr_lookups.treatment_codes ALTER COLUMN Container ENTITYID NOT NULL;
GO

-- add the INDEX for those Container columns
CREATE INDEX IX_geographic_origins_Container ON ehr_lookups.geographic_origins (Container);
CREATE INDEX IX_rooms_Container ON ehr_lookups.rooms (Container);
CREATE INDEX IX_buildings_Container ON ehr_lookups.buildings (Container);
CREATE INDEX IX_treatment_codes_Container ON ehr_lookups.treatment_codes (Container);
GO