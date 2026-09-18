'use strict';
// NXT Gen Plans 0.1 R3 traffic-control reference catalog.
// Sign codes/names are plan-review references; exact fabrication geometry should be verified
// against the current TMUTCD / TxDOT SHSD / applicable TxDOT standard sheet.

const MUTCD_SIGNS = [
  // Regulatory
  ['R1-1','STOP','regulatory','octagon','red'],['R1-2','YIELD','regulatory','triangle','white-red'],['R1-3P','ALL-WAY plaque','regulatory','rectangle','white'],
  ['R1-5','Yield Here to Pedestrians','regulatory','rectangle','white'],['R1-5b','Stop Here for Pedestrians','regulatory','rectangle','white'],
  ['R2-1','Speed Limit','regulatory','rectangle','white'],['R2-2P','Truck Speed Limit plaque','regulatory','rectangle','white'],['R2-4P','Minimum Speed plaque','regulatory','rectangle','white'],
  ['R2-5P','Unless Otherwise Posted plaque','regulatory','rectangle','white'],['R2-6P','Fines Higher plaque','regulatory','rectangle','white'],['R2-12','End Work Zone Speed Limit','ttc','rectangle','white'],
  ['R3-1','No Right Turn','regulatory','rectangle','white'],['R3-2','No Left Turn','regulatory','rectangle','white'],['R3-3','No Turns','regulatory','rectangle','white'],
  ['R3-4','No U-Turn','regulatory','rectangle','white'],['R3-5','Mandatory Movement Lane Control','regulatory','rectangle','white'],['R3-6','Optional Movement Lane Control','regulatory','rectangle','white'],
  ['R3-7','Right Lane Must Turn Right','regulatory','rectangle','white'],['R3-8','Advance Intersection Lane Control','regulatory','rectangle','white'],['R3-9','Two-Way Left Turn Only','regulatory','rectangle','white'],
  ['R3-11','HOV Lane','regulatory','rectangle','white'],['R3-17','Bike Lane','regulatory','rectangle','white'],['R3-18','No U or Left Turn','regulatory','rectangle','white'],
  ['R4-1','Do Not Pass','regulatory','rectangle','white'],['R4-2','Pass With Care','regulatory','rectangle','white'],['R4-3','Slower Traffic Keep Right','regulatory','rectangle','white'],
  ['R4-5','Trucks Use Right Lane','regulatory','rectangle','white'],['R4-7','Keep Right','regulatory','rectangle','white'],['R4-8','Keep Left','regulatory','rectangle','white'],
  ['R4-9','Stay in Lane','regulatory','rectangle','white'],['R4-9a','Stay in Lane to Merge Point','ttc','rectangle','white'],['R4-10','Runaway Vehicles Only','regulatory','rectangle','white'],
  ['R5-1','Do Not Enter','regulatory','rectangle','red-white'],['R5-1a','Wrong Way','regulatory','rectangle','red-white'],['R5-2','No Trucks','regulatory','rectangle','white'],
  ['R5-3','No Motor Vehicles','regulatory','rectangle','white'],['R5-6','No Bicycles','regulatory','rectangle','white'],['R5-10','No Pedestrians','regulatory','rectangle','white'],
  ['R6-1','One Way','regulatory','rectangle','black-white'],['R6-2','One Way','regulatory','rectangle','black-white'],['R6-3','Two-Way Traffic','regulatory','rectangle','white'],
  ['R7-1','No Parking Any Time','regulatory','rectangle','white'],['R7-2','No Parking','regulatory','rectangle','white'],['R7-6','No Parking Loading Zone','regulatory','rectangle','white'],
  ['R8-1','No Parking on Pavement','regulatory','rectangle','white'],['R8-3','No Parking','regulatory','rectangle','white'],['R8-4','Emergency Parking Only','regulatory','rectangle','white'],
  ['R9-3','No Pedestrian Crossing','regulatory','rectangle','white'],['R9-8','Pedestrian Crosswalk','ttc','rectangle','white'],['R9-9','Sidewalk Closed','ttc','rectangle','white'],
  ['R9-10','Sidewalk Closed - Use Other Side','ttc','rectangle','white'],['R9-11','Sidewalk Closed Ahead - Cross Here','ttc','rectangle','white'],['R9-11a','Sidewalk Closed - Cross Here','ttc','rectangle','white'],['R9-12','Bike Lane Closed','ttc','rectangle','white'],
  ['R10-6','Stop Here on Red','regulatory','rectangle','white'],['R10-11','No Turn on Red','regulatory','rectangle','white'],['R10-12','Left on Green Arrow Only','regulatory','rectangle','white'],
  ['R11-2','Road Closed','ttc','rectangle','white'],['R11-2a','Street Closed','ttc','rectangle','white'],['R11-2b','Ramp Closed','ttc','rectangle','white'],['R11-3a','Road Closed - Local Traffic Only','ttc','rectangle','white'],
  ['R12-1','Weight Limit','regulatory','rectangle','white'],['R12-2','Axle Weight Limit','regulatory','rectangle','white'],['R12-5','Weight Limit Symbol','regulatory','rectangle','white'],
  ['R14-1','Truck Route','regulatory','rectangle','white'],['R14-2','Hazardous Material Route','regulatory','rectangle','white'],['R14-3','Hazardous Material Prohibited','regulatory','rectangle','white'],
  ['R15-1','Railroad Crossing','regulatory','crossbuck','white'],['R15-2P','Number of Tracks plaque','regulatory','rectangle','white'],
  // Warning
  ['W1-1','Turn','warning','diamond','yellow'],['W1-2','Curve','warning','diamond','yellow'],['W1-3','Reverse Turn','warning','diamond','yellow'],['W1-4','Reverse Curve','warning','diamond','yellow'],
  ['W1-5','Winding Road','warning','diamond','yellow'],['W1-6','Large Arrow','warning','rectangle','yellow'],['W1-7','Two-Direction Large Arrow','warning','rectangle','yellow'],['W1-8','Chevron Alignment','warning','rectangle','yellow'],
  ['W2-1','Crossroad','warning','diamond','yellow'],['W2-2','Side Road','warning','diamond','yellow'],['W2-3','Oblique Side Road','warning','diamond','yellow'],['W2-4','T-Intersection','warning','diamond','yellow'],['W2-5','Y-Intersection','warning','diamond','yellow'],['W2-6','Circular Intersection','warning','diamond','yellow'],
  ['W3-1','Stop Ahead','warning','diamond','yellow'],['W3-2','Yield Ahead','warning','diamond','yellow'],['W3-3','Signal Ahead','warning','diamond','yellow'],['W3-4','Be Prepared to Stop','warning','diamond','yellow'],['W3-5','Reduced Speed Limit Ahead','warning','diamond','yellow'],
  ['W4-1','Merge','warning','diamond','yellow'],['W4-2','Lane Ends','warning','diamond','yellow'],['W4-3','Added Lane','warning','diamond','yellow'],['W4-5','Entering Roadway Merge','warning','diamond','yellow'],['W4-6','Entering Roadway Added Lane','warning','diamond','yellow'],
  ['W5-1','Road Narrows','warning','diamond','yellow'],['W5-2','Narrow Bridge','warning','diamond','yellow'],['W5-3','One Lane Bridge','warning','diamond','yellow'],['W5-4','Ramp Narrows','warning','diamond','yellow'],
  ['W6-1','Divided Highway Begins','warning','diamond','yellow'],['W6-2','Divided Highway Ends','warning','diamond','yellow'],['W6-3','Two-Way Traffic','warning','diamond','yellow'],['W6-4','Narrow Two-Way Traffic','ttc','diamond','orange'],
  ['W7-1','Hill','warning','diamond','yellow'],['W7-3','Grade','warning','diamond','yellow'],['W8-1','Bump','warning','diamond','yellow'],['W8-2','Dip','warning','diamond','yellow'],['W8-3','Pavement Ends','warning','diamond','yellow'],
  ['W8-4','Soft Shoulder','warning','diamond','yellow'],['W8-5','Slippery When Wet','warning','diamond','yellow'],['W8-7','Loose Gravel','warning','diamond','yellow'],['W8-11','Uneven Lanes','warning','diamond','yellow'],['W8-24','Steel Plate Ahead','ttc','diamond','orange'],
  ['W9-1','Lane Ends','warning','diamond','yellow'],['W9-2','Lane Ends Merge','warning','diamond','yellow'],['W9-2a','Merge Here Take Turns','ttc','diamond','orange'],['W9-3','Interior Lane Shift Ahead','ttc','diamond','orange'],
  ['W10-1','Railroad Advance','warning','diamond','yellow'],['W10-2','Railroad Intersection','warning','diamond','yellow'],['W11-1','Bicycle','warning','diamond','yellow'],['W11-2','Pedestrian','warning','diamond','yellow'],['W11-8','Emergency Vehicle','warning','diamond','yellow'],
  ['W11-10','Truck','warning','diamond','yellow'],['W11-15','Trail Crossing','warning','diamond','yellow'],['W12-1','Double Arrow','warning','diamond','yellow'],['W12-2','Low Clearance','warning','diamond','yellow'],
  ['W13-1P','Advisory Speed plaque','warning','rectangle','yellow'],['W13-4P','On Ramp plaque','ttc','rectangle','orange'],['W14-1','Dead End','warning','diamond','yellow'],['W14-2','No Outlet','warning','diamond','yellow'],['W14-3','No Passing Zone','warning','pennant','yellow'],
  ['W16-2P','Distance plaque','warning','rectangle','yellow'],['W16-3P','Miles plaque','warning','rectangle','yellow'],['W16-9P','Ahead plaque','warning','rectangle','yellow'],['W17-1','Speed Hump','warning','diamond','yellow'],
  ['W18-1','No Traffic Signs','warning','diamond','yellow'],['W19-1','Freeway Ends','warning','diamond','yellow'],['W19-2','Expressway Ends','warning','diamond','yellow'],
  // Temporary traffic control / work-zone signs
  ['W20-1','Road Work (with distance)','ttc','diamond','orange'],['W20-1b','Path Work Ahead','ttc','diamond','orange'],['W20-2','Detour (with distance)','ttc','diamond','orange'],['W20-2a','Bike Detour Ahead','ttc','diamond','orange'],
  ['W20-3','Road Closed (with distance)','ttc','diamond','orange'],['W20-3a','Path Closed Ahead','ttc','diamond','orange'],['W20-4','One Lane Road (with distance)','ttc','diamond','orange'],['W20-5','Lane Closed (with distance)','ttc','diamond','orange'],
  ['W20-5a','2 Lanes Closed (with distance)','ttc','diamond','orange'],['W20-5b','Bike Lane Closed Ahead','ttc','diamond','orange'],['W20-7','Flagger','ttc','diamond','orange'],['W20-7a','Flagger','ttc','diamond','orange'],['W20-8','STOP/SLOW Paddle','ttc','rectangle','orange'],
  ['W21-1','Workers','ttc','diamond','orange'],['W21-1a','Workers','ttc','diamond','orange'],['W21-2','Fresh Oil','ttc','diamond','orange'],['W21-3','Road Machinery Ahead','ttc','diamond','orange'],['W21-4','Slow Moving Vehicle','ttc','diamond','orange'],
  ['W21-5','Shoulder Work','ttc','diamond','orange'],['W21-5a','Shoulder Closed','ttc','diamond','orange'],['W21-5b','Shoulder Closed (with distance)','ttc','diamond','orange'],['W21-6','Survey Crew','ttc','diamond','orange'],['W21-7','Utility Work (with distance)','ttc','diamond','orange'],['W21-8','Mowing Ahead','ttc','diamond','orange'],
  ['W22-1','Blasting Zone Ahead','ttc','diamond','orange'],['W22-3','End Blasting Zone','ttc','rectangle','orange'],['W23-1','Slow Traffic Ahead','ttc','diamond','orange'],['W23-2','New Traffic Pattern Ahead','ttc','diamond','orange'],['W23-2a','New Signal Operation Ahead','ttc','diamond','orange'],
  ['G20-1','Road Work Next XX Miles','ttc','rectangle','orange'],['G20-2','End Road Work','ttc','rectangle','orange'],['M4-8','Detour','ttc','rectangle','orange'],['M4-9','Detour Direction','ttc','rectangle','orange'],['M4-10','Detour Arrow','ttc','arrow','orange'],
  // Guide / service basics useful in plan markup
  ['D3-1','Street Name','guide','rectangle','green'],['D9-2','Hospital','guide','rectangle','blue'],['D9-6','Accessible','guide','rectangle','blue'],['D9-7','Gas','guide','rectangle','blue'],['D9-8','Food','guide','rectangle','blue'],['D9-9','Lodging','guide','rectangle','blue'],
  ['I-5','Airport','guide','rectangle','green'],['M1-4','US Route','guide','shield','white'],['M1-5','State Route','guide','shield','white']
].map(([code,name,category,shape,background])=>({code,name,category,shape,background,source:category==='ttc'?'MUTCD 11th Ed. Part 6 / 2025 TMUTCD Part 6':'MUTCD 11th Ed. / 2025 TMUTCD'}));

const TEXAS_SIGNS = [
  ['CW20-1D','ROAD WORK AHEAD','TxDOT construction warning'],['CW20-4D','ONE LANE ROAD AHEAD','TxDOT construction warning'],['CW20-5TR','RIGHT LANE CLOSED','TxDOT construction warning'],['CW20-5TL','LEFT LANE CLOSED','TxDOT construction warning'],
  ['CW20-7','FLAGGER symbol','TxDOT construction warning'],['CW20-7aD','FLAGGER AHEAD','TxDOT construction warning'],['CW21-5','SHOULDER WORK','TxDOT construction warning'],['CW3-4','BE PREPARED TO STOP','TxDOT construction warning'],
  ['CW13-1P','XX MPH advisory speed plaque','TxDOT work-zone plaque'],['CW16-3P','XXX FT distance plaque','TxDOT work-zone plaque'],['G20-2','END ROAD WORK','TMUTCD / TxDOT'],['G20-2bT','END WORK ZONE','Texas-specific work-zone sign'],
  ['G20-9TP','BEGIN WORK ZONE','Texas-specific work-zone plaque'],['R20-5aTP','STATE LAW / WHEN WORKERS ARE PRESENT','Texas-specific regulatory plaque'],['G20-6T','CONTRACTOR NAME / ADDRESS','Texas-specific project sign'],
  ['G20-10T','WORK AREA / CONTRACTOR','Texas-specific project sign'],['R11-2','ROAD CLOSED','TMUTCD / TxDOT'],['R11-2bT','RAMP CLOSED','Texas-specific ramp closure sign'],['CW20RP-3D','RAMP CLOSED AHEAD','Texas-specific construction warning'],
  ['CW25-1T','USE NEXT RAMP','Texas-specific work-zone sign'],['R5-1','DO NOT ENTER','TMUTCD / TxDOT'],['R4-1','DO NOT PASS','TMUTCD / TxDOT'],['R2-1','SPEED LIMIT','TMUTCD / TxDOT']
].map(([code,name,source])=>({code,name,category:'texas',shape:(code.startsWith('CW')?'diamond':'rectangle'),background:(code.startsWith('CW')?'orange':'white'),source:'2025 TMUTCD / TxDOT SHSD / '+source}));

const TXDOT_STANDARDS = [
  {code:'BC(1)-21 … BC(12)-21',name:'Barricade and Construction standard sheets',group:'BC',detail:'General requirements, signs, channelizing devices, barricades, supports, work-zone hardware and related details.'},
  {code:'TCP(1-1)',name:'Traffic Control Plan – conventional roadway operations',group:'TCP'},
  {code:'TCP(1-3)',name:'Traffic Control Plan – conventional roadway operations',group:'TCP'},
  {code:'TCP(1-4)',name:'Traffic Control Plan – conventional roadway operations',group:'TCP'},
  {code:'TCP(2-1)-18',name:'Conventional Road – Shoulder Work',group:'TCP'},
  {code:'TCP(2-4)-18',name:'Lane Closures on Multilane Conventional Roads',group:'TCP'},
  {code:'TCP(2-5)-18',name:'Long-Term Lane Closures – Multilane Conventional Roads',group:'TCP'},
  {code:'TCP(3-1)',name:'Mobile Operations – Undivided Highways',group:'TCP'},
  {code:'TCP(3-2)',name:'Mobile Operations – Divided Highways',group:'TCP'},
  {code:'TCP(3-3)',name:'Mobile Operations – Raised Pavement Marker Installation',group:'TCP'},
  {code:'TCP(6-1)',name:'Freeway Lane Closure',group:'TCP'},
  {code:'TCP(6-2)',name:'Work Area Near Ramp',group:'TCP'},
  {code:'TCP(6-3)',name:'Freeway Traffic Control Plan',group:'TCP'},
  {code:'TCP(6-4)',name:'Freeway Traffic Control Plan',group:'TCP'},
  {code:'TCP(6-5)',name:'Freeway Traffic Control Plan',group:'TCP'},
  {code:'TCP(6-6)',name:'Freeway Traffic Control Plan',group:'TCP'},
  {code:'TCP(6-7)',name:'Freeway Closure',group:'TCP'},
  {code:'TCP(6-8)',name:'Freeway Daytime-Only Closure Sequence',group:'TCP'},
  {code:'WZ Standards',name:'Current TxDOT Work Zone standard sheets',group:'WZ',detail:'Use the current TxDOT Traffic Standards index for project-specific WZ sheets.'}
];

const TRAFFIC_DEVICES = [
  {code:'CONE',name:'Traffic Cone',kind:'cone'},
  {code:'DRUM',name:'Channelizing Drum',kind:'drum'},
  {code:'VP',name:'Vertical Panel',kind:'verticalPanel'},
  {code:'TYPE-III',name:'Type III Barricade',kind:'barricade'},
  {code:'PCTB',name:'Portable Concrete Traffic Barrier',kind:'barrier'},
  {code:'ARROW-BOARD',name:'Trailer-Mounted Flashing Arrow Board',kind:'arrowBoard'},
  {code:'PCMS',name:'Portable Changeable Message Sign',kind:'pcms'},
  {code:'TMA',name:'Truck-Mounted Attenuator',kind:'tma'},
  {code:'FLAGGER',name:'Flagger',kind:'flagger'},
  {code:'WORK-VEHICLE',name:'Work Vehicle',kind:'workVehicle'},
  {code:'TRAFFIC-FLOW',name:'Traffic Flow Arrow',kind:'trafficFlow'},
  {code:'WORK-ZONE',name:'Work Space / Work Zone',kind:'workZone'},
  {code:'BUFFER',name:'Longitudinal / Lateral Buffer',kind:'buffer'}
];

const HATCH_LIBRARY = [
  {id:'ansi31',name:'ANSI31 — 45° Parallel',family:'ANSI Drafting'},
  {id:'ansi32',name:'ANSI32 — 45° Double-Line',family:'ANSI Drafting'},
  {id:'ansi33',name:'ANSI33 — Offset Parallel',family:'ANSI Drafting'},
  {id:'ansi34',name:'ANSI34 — Crossed Parallel',family:'ANSI Drafting'},
  {id:'ansi35',name:'ANSI35 — Mixed Parallel',family:'ANSI Drafting'},
  {id:'ansi36',name:'ANSI36 — Dashed Parallel',family:'ANSI Drafting'},
  {id:'ansi37',name:'ANSI37 — Cross Hatch',family:'ANSI Drafting'},
  {id:'ansi38',name:'ANSI38 — Triple-Line',family:'ANSI Drafting'},
  {id:'diag45',name:'Diagonal 45°',family:'Drafting'},
  {id:'diag135',name:'Diagonal 135°',family:'Drafting'},
  {id:'cross45',name:'Crosshatch 45°/135°',family:'Drafting'},
  {id:'horizontal',name:'Horizontal Lines',family:'Drafting'},
  {id:'vertical',name:'Vertical Lines',family:'Drafting'},
  {id:'grid',name:'Square Grid',family:'Drafting'},
  {id:'dots',name:'Dot Field',family:'Drafting'},
  {id:'earth',name:'EARTH — Earth / Soil',family:'Civil Material'},
  {id:'sand',name:'AR-SAND — Sand / Fine Aggregate',family:'Civil Material'},
  {id:'gravel',name:'GRAVEL — Aggregate',family:'Civil Material'},
  {id:'concrete',name:'AR-CONC — Concrete',family:'Civil Material'},
  {id:'riprap',name:'Riprap / Rock',family:'Civil Material'},
  {id:'asphalt',name:'Asphalt / Dense Stipple',family:'Civil Material'},
  {id:'demo',name:'Demolition / Removal',family:'Construction Phase'},
  {id:'proposed',name:'Proposed Work',family:'Construction Phase'},
  {id:'existing',name:'Existing Feature',family:'Construction Phase'}
];
