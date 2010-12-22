/*
 * Copyright (c) 2010 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
SELECT
a.id,
a.date,
a.ts,
a.objectid,
t2.objectid as key2
FROM study.obs	 a
full join col_dump.obs	 t2
on a.objectid = t2.objectid
WHERE t2.objectid is null or a.objectid is null