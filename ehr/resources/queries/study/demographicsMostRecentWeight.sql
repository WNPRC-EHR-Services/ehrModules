/*
 * Copyright (c) 2010-2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
SELECT

w.id,
w.MostRecentWeightDate,
timestampdiff('SQL_TSI_DAY', w.MostRecentWeightDate, curdate()) AS DaysSinceWeight,

-- t2.weight as MostRecentWeight,
null as weightField,
-- could also be performed as a subquery
  cast((
    SELECT AVG(w2.weight) AS _expr
    FROM study.weight w2
    WHERE w.id=w2.id AND w.MostRecentWeightDate=w2.date
  ) as numeric) AS MostRecentWeight

FROM (
SELECT
  w.Id AS Id,
  max(w.date) AS MostRecentWeightDate,

FROM study.weight w
WHERE w.qcstate.publicdata = true and w.weight is not null
GROUP BY w.id
) w

--NOTE: altered to a subselect to avoid duplicate entries from weights with identical time
-- --find the most recent weight associated with that date
-- LEFT JOIN study.weight T2
--   ON (w.MostRecentWeightDate = t2.date AND w.Id = t2.Id)
--
-- WHERE t2.qcstate.publicdata = true