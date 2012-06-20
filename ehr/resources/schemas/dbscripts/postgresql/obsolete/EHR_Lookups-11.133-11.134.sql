/*
 * Copyright (c) 2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */


DELETE FROM ehr_lookups.clinpath_sampletype;

INSERT INTO ehr_lookups.clinpath_sampletype
(sampletype) VALUES
('Bone'),
('Feces'),
('Hair'),
('Blood - Heparinized Whole Blood'),
('Blood - EDTA Whole Blood'),
('Blood - Plasma Lithium Heparin'),
('Blood - Sodium Citrate Whole Blood'),
('Blood - Serum'),
('Blood - Plasma EDTA'),
('Fluid, abdominal'),
('Fluid, thorax'),
('Fluid, uterine'),
('Mass (list tissue/location)'),
('Nail'),
('Skin'),
('Swab - Buccal'),
('Swab - Left Eye'),
('Swab - Right Eye'),
('Swab - Genital'),
('Swab - Rectal'),
('Urine'),
('Vaginal Swab Specimen Collection Kit'),
('Wound/abscess (list tissue/location)')
;


update ehr_lookups.gender_codes set meaning = 'female' where meaning = 'Female';