/*
 * Copyright (c) 2010-2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
SELECT
  d.Id AS Id,

  d.MostRecentWeightDate,
  TIMESTAMPDIFF('SQL_TSI_DAY', d.MostRecentWeightDate, now()) as exp,
  d.MostRecentWeight AS MostRecentWeight,
  d.DaysSinceWeight,

  --30 days
  w.avgLast30,
  w.minLast30,
  w.maxLast30,
  w.numLast30,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    WHEN (abs((d.MostRecentWeight - w.MinLast30) * 100 / d.MostRecentWeight) > abs((d.MostRecentWeight - w.MaxLast30) * 100 / d.MostRecentWeight))
    THEN Round(((d.MostRecentWeight-w.MinLast30) * 100 / d.MostRecentWeight), 1)
    ELSE Round(((d.MostRecentWeight - w.MaxLast30) * 100 / d.MostRecentWeight), 1)
  END as MaxChange30,

  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight-w.MinLast30) * 100 / d.MostRecentWeight), 1)
  END as MaxGain30,

  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight - w.MaxLast30) * 100 / d.MostRecentWeight), 1)
  END as MaxLoss30,
  
  --90 days
  w.avgLast90,
  w.minLast90,
  w.maxLast90,
  w.numLast90,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    WHEN (abs((d.MostRecentWeight - w.MinLast90) * 100 / d.MostRecentWeight) > abs((d.MostRecentWeight - w.MaxLast90) * 100 / d.MostRecentWeight)) THEN Round(((d.MostRecentWeight-w.MinLast90) * 100 / d.MostRecentWeight), 1)
    ELSE Round(((d.MostRecentWeight - w.MaxLast90) * 100 / d.MostRecentWeight), 1)
  END as MaxChange90,

  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight-w.MinLast90) * 100 / d.MostRecentWeight), 1)
  END as MaxGain90,

  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight - w.MaxLast90) * 100 / d.MostRecentWeight), 1)
  END as MaxLoss90,

  --180 days
  w.avgLast180,
  w.minLast180,
  w.maxLast180,
  w.numLast180,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    WHEN (abs((d.MostRecentWeight - w.MinLast180) * 100 / d.MostRecentWeight) > abs((d.MostRecentWeight - w.MaxLast180) * 100 / d.MostRecentWeight)) THEN Round(((d.MostRecentWeight-w.MinLast180) * 100 / d.MostRecentWeight), 1)
    ELSE Round(((d.MostRecentWeight - w.MaxLast180) * 100 / d.MostRecentWeight), 1)
  END as MaxChange180,

  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight-w.MinLast180) * 100 / d.MostRecentWeight), 1)
  END as MaxGain180,

  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight - w.MaxLast180) * 100 / d.MostRecentWeight), 1)
  END as MaxLoss180,

  --365 days
  w.avgLast365,
  w.minLast365,
  w.maxLast365,
  w.numLast365,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    WHEN (abs((d.MostRecentWeight - w.MinLast365) * 100 / d.MostRecentWeight) > abs((d.MostRecentWeight - w.MaxLast365) * 100 / d.MostRecentWeight)) THEN Round(((d.MostRecentWeight-w.MinLast365) * 100 / d.MostRecentWeight), 1)
    ELSE Round(((d.MostRecentWeight - w.MaxLast365) * 100 / d.MostRecentWeight), 1)
  END as MaxChange365,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight-w.MinLast365) * 100 / d.MostRecentWeight), 1)
  END as MaxGain365,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight - w.MaxLast365) * 100 / d.MostRecentWeight), 1)
  END as MaxLoss365,

  --2 years
  w.avgLast2Years,
  w.minLast2Years,
  w.maxLast2Years,
  w.numLast2Years,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    WHEN (abs((d.MostRecentWeight - w.MinLast2Years) * 100 / d.MostRecentWeight) > abs((d.MostRecentWeight - w.MaxLast2Years) * 100 / d.MostRecentWeight)) THEN Round(((d.MostRecentWeight-w.MinLast2Years) * 100 / d.MostRecentWeight), 1)
    ELSE Round(((d.MostRecentWeight - w.MaxLast2Years) * 100 / d.MostRecentWeight), 1)
  END as MaxChange2Years,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight-w.MinLast2Years) * 100 / d.MostRecentWeight), 1)
  END as MaxGain2Years,
  CASE
    WHEN (d.MostRecentWeight = 0 or d.MostRecentWeight is null) THEN null
    else Round(((d.MostRecentWeight - w.MaxLast2Years) * 100 / d.MostRecentWeight), 1)
  END as MaxLoss2Years

FROM study.demographicsMostRecentWeight d     
LEFT JOIN (     
SELECT  
  w.Id,

  --30 days
  avg(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 30) THEN w.weight
    ELSE NULL
  END) as avgLast30,
  max(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 30) THEN w.weight
    ELSE NULL
  END) as maxLast30,
  min(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 30) THEN w.weight
    ELSE null
  END) as minLast30,
  sum(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 30) THEN 1
    ELSE NULL
  END) as numLast30,

  --90 days
  avg(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 90) THEN w.weight
    ELSE NULL
  END) as avgLast90,
  max(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 90) THEN w.weight
    ELSE NULL
  END) as maxLast90,
  min(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 90) THEN w.weight
    ELSE null
  END) as minLast90,
  sum(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 90) THEN 1
    ELSE NULL
  END) as numLast90,

  --180 days
  avg(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 180) THEN w.weight
    ELSE NULL
  END) as avgLast180,
  max(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 180) THEN w.weight
    ELSE NULL
  END) as maxLast180,
  min(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 180) THEN w.weight
    ELSE null
  END) as minLast180,
  sum(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 180) THEN 1
    ELSE NULL
  END) as numLast180,

  --365 days
  avg(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 365) THEN w.weight
    ELSE NULL
  END) as avgLast365,
  max(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 365) THEN w.weight
    ELSE NULL
  END) as maxLast365,
  min(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 365) THEN w.weight
    ELSE null
  END) as minLast365,
  sum(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 365) THEN 1
    ELSE NULL
  END) as numLast365,

  --2 years
  avg(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 730) THEN w.weight
    ELSE NULL
  END) as avgLast2Years,
  max(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 730) THEN w.weight
    ELSE NULL
  END) as maxLast2Years,
  min(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 730) THEN w.weight
    ELSE null
  END) as minLast2Years,
  sum(CASE
    WHEN (TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 730) THEN 1
    ELSE NULL
  END) as numLast2Years
              
FROM study.weight w   

WHERE TIMESTAMPDIFF('SQL_TSI_DAY', w.date, now()) <= 730
  
GROUP BY w.Id


) w ON (w.id = d.Id)