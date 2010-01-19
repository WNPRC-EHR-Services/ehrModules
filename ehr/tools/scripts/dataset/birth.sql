/*
 * Copyright (c) 2010 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
SELECT id, FixDate(date) AS Date, (sex) AS sex, (weight) AS weight, (wdate) AS wdate, Timestamp(Date('1970-01-01'), wtime)  AS wtime, (dam) AS dam, (sire) AS sire, (room) AS room, (cage) AS cage, (cond) AS cond, (origin) AS origin, (conception) AS conception, (type) AS type, (remark) AS remark, ( CONCAT_WS(', ',      CASE WHEN sex IS NULL  OR sex=''  THEN NULL ELSE CONCAT('sex: ', sex)  END, 
     CASE WHEN weight IS NULL  THEN NULL ELSE CONCAT('weight: ', CAST(weight AS CHAR))  END, 
     CASE WHEN wdate IS NULL  THEN NULL ELSE CONCAT('wdate: ', CAST(wdate AS CHAR))  END, 
     CASE WHEN wtime IS NULL  THEN NULL ELSE CONCAT('wtime: ', CAST(wtime AS CHAR))  END, 
     CASE WHEN dam=''  THEN NULL ELSE CONCAT('dam: ', dam)  END, 
     CASE WHEN sire=''  THEN NULL ELSE CONCAT('sire: ', sire)  END, 
     CASE WHEN room=''  THEN NULL ELSE CONCAT('room: ', room)  END, 
     CASE WHEN cage=''  THEN NULL ELSE CONCAT('cage: ', cage)  END, 
     CASE WHEN cond IS NULL  OR cond=''  THEN NULL ELSE CONCAT('cond: ', cond)  END, 
     CASE WHEN origin IS NULL  OR origin=''  THEN NULL ELSE CONCAT('origin: ', origin)  END, 
     CASE WHEN conception IS NULL  THEN NULL ELSE CONCAT('conception: ', CAST(conception AS CHAR))  END, 
     CASE WHEN type IS NULL  OR type=''  THEN NULL ELSE CONCAT('type: ', type)  END, 
     CASE WHEN remark IS NULL  OR remark=''  THEN NULL ELSE CONCAT('remark: ', remark)  END) ) AS Description FROM birth
