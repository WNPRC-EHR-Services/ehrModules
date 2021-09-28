CREATE TABLE ehr_compliancedb.EmployeePerEssential
(
    RowId INT IDENTITY(1,1) NOT NULL,
    EmployeeId varchar(255) not null,
    trackingflag varchar(50) null,
    RequirementName varchar(255) null,
    Container ENTITYID NOT NULL,
    CreatedBy USERID,
    Created datetime,
    ModifiedBy USERID,
    Modified datetime,
    taskid entityid,
    objectid entityid


        CONSTRAINT PK_EmployeePerEssential PRIMARY KEY (RowId)
);