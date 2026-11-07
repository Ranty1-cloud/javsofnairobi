-- 33-seater Nganya bus: 2 passengers beside the driver, a door row (left side is the entrance), 6 rows of 2+2, back bench of 5 = 33.
-- Only the vehicle template changes. Events that already exist keep the seats they were created with.
-- Plan legend: S seat, . empty space, | aisle, D driver. Keep in sync with NGANYA_33_PLAN in src/lib/layout.ts.
UPDATE "Vehicle"
SET "layout" = '{"rows":["A","B","C","D","E","F","G","H","I"],"cols":[1,2,3,4,5],"plan":[{"row":"A","cells":"SS|.D"},{"row":"B","cells":"..|SS"},{"row":"C","cells":"SS|SS"},{"row":"D","cells":"SS|SS"},{"row":"E","cells":"SS|SS"},{"row":"F","cells":"SS|SS"},{"row":"G","cells":"SS|SS"},{"row":"H","cells":"SS|SS"},{"row":"I","cells":"SSSSS"}]}'::jsonb
WHERE "name" = '33-seater Nganya Bus';
