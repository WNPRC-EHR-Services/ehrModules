/*
 * Copyright (c) 2010-2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

--we find the most recent assignment date
SELECT
  a.project,
  max(a.date) AS LastAssignmentDate
FROM study.Assignment a
GROUP BY a.project


