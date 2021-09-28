CREATE TABLE ehr_compliancedb.EmployeePerEssential
(
    RowId INT IDENTITY(1,1) NOT NULL,
    EmployeeId varchar(255) not null,
    requirementname varchar(255) null,
    trackingflag varchar(50) null,
    Container ENTITYID NOT NULL,
    CreatedBy USERID,
    Created timestamp,
    ModifiedBy USERID,
    Modified timestamp,
    taskid entityid,
    objectid entityid


        CONSTRAINT PK_EmployeePerEssential PRIMARY KEY (RowId)
);

GO

