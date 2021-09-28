CREATE TABLE ehr_compliancedb.EmployeePerUnit
(
    RowId INT IDENTITY(1,1) NOT NULL,
    EmployeeId varchar(255) not null,
    unit varchar(255) not null,
    Container ENTITYID NOT NULL,
    CreatedBy USERID,
    Created datetime,
    ModifiedBy USERID,
    Modified datetime,
    taskid entityid,
    objectid entityid


    CONSTRAINT PK_EmployeePerUnit PRIMARY KEY (RowId)
);
GO