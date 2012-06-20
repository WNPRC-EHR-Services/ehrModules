/*
 * Copyright (c) 2010-2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
SELECT
e.employeeid,
CASE WHEN u1.DisplayName is null THEN 'NO' ELSE 'YES' END AS HasUsername,
CASE WHEN u2.email is NULL THEN 'NO' ELSE 'YES' END AS EmailExists,
CASE WHEN (u2.email is NOT NULL AND u1.displayName is not null) THEN 'YES' ELSE 'NO' END AS BothCorrect,
CASE WHEN u3.displayname is NULL THEN 'NO' ELSE 'YES' END AS SOPAccess,
CASE WHEN u4.displayname is NULL THEN 'NO' ELSE 'YES' END AS ColonyAccess

FROM ehr_compliancedb.employees e

LEFT JOIN core.users u1
ON (e.employeeid = u1.DisplayName)

LEFT JOIN core.users u2
ON (e.email = u2.email)

LEFT JOIN "/WNPRC/WNPRC_Units/Animal_Services/Compliance_Training/Private/EmployeeDB/".core.users u3
  ON (e.employeeid = u3.displayname)

LEFT JOIN "/WNPRC/EHR/".core.users u4
  ON (e.employeeid = u4.displayname)