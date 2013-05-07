DROP INDEX snomed_tags_id_recordid ON ehr.snomed_tags;

CREATE INDEX snomed_tags_id_recordid_code on ehr.snomed_tags (id, recordid, code);