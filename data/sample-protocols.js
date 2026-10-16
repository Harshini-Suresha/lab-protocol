/* LabCheck hand-written sample protocols (synthetic teaching cases). Loaded before js/app.js. */
const FAULT=[[1,'buffer','A1',100],[2,'buffer','B1',100],[3,'sample','B1',50],[4,'dye','B1',15],[5,'dye','B2',30],[6,'buffer','B2',250],[7,'buffer','I1',100]];

const FIXED=[[1,'buffer','A1',100],[2,'buffer','B1',100],[3,'sample','B1',50],[4,'dye','B1',20],[5,'dye','B2',20],[6,'buffer','B2',100],[7,'buffer','H12',100],[8,'sample','A12',50]];

const LIB=[
['Blank and positive control','buffer in A1, sample in A12',[[1,'buffer','A1',100],[2,'sample','A12',50]]],
['Three-sample series','sample in B1–D1 over a buffer base',[[1,'buffer','A1',100],[2,'buffer','B1',100],[3,'buffer','C1',100],[4,'buffer','D1',100],[5,'sample','B1',30],[6,'sample','C1',30],[7,'sample','D1',30],[8,'sample','A12',30]]],
['Dye gradient','two dye wells, 20 µL each',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','B1',20],[4,'dye','B2',20],[5,'buffer','B1',100],[6,'buffer','B2',150]]],
['Full row of buffer','80 µL into A1–A12',[...Array(12)].map((_,i)=>[i+1,'buffer','A'+(i+1),80])],
['Double dose into one well','B1 gets 120 µL twice',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','B1',120],[4,'buffer','B1',120]]],
['Dye below pipette minimum','10 µL dye into B1',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','B1',10]]],
['Sample overdraw','three 50 µL draws from 120 µL',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'sample','B1',50],[4,'sample','C1',50]]],
['Typo in a well name','B13 does not exist',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','B13',100]]],
['No controls dispensed','only B1 and C1 are filled',[[1,'buffer','B1',100],[2,'sample','C1',50]]],
['Minimal passing pair','two controls, nothing else',[[1,'buffer','A1',20],[2,'sample','A12',20]]],
['Max-volume transfers','300 µL at the pipette ceiling',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','C3',300]]],
['Over the ceiling','301 µL, one above max',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','C3',301]]],
['At the floor','20 µL, exactly the minimum',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','D4',20]]],
['Below the floor','19 µL, one below minimum',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','D4',19]]],
['Well at capacity','exactly 200 µL in E5',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','E5',120],[4,'buffer','E5',80]]],
['Well over capacity','205 µL in E5',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','E5',120],[4,'buffer','E5',85]]],
['Stock exactly spent','dye ends at 0 µL',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','F1',20],[4,'dye','F2',20]]],
['Stock short by one','dye overdrawn 41 from 40',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'dye','F1',20],[4,'dye','F2',21]]],
['Lowercase well','b1 instead of B1',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','b1',50]]],
['Column zero','A0 does not exist',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','A0',50]]],
['Full column','A1, A12 plus 80 µL down column 6',[[1,'buffer','A1',100],[2,'sample','A12',50],[3,'buffer','A6',80],[4,'buffer','B6',80],[5,'buffer','C6',80],[6,'buffer','D6',80],[7,'buffer','E6',80],[8,'buffer','F6',80],[9,'buffer','G6',80],[10,'buffer','H6',80]]]];
/* real transcribed protocols (Opentrons Protocol Library; volumes/labware/pipettes are library defaults) */
