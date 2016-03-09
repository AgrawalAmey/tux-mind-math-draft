"use strict";

function pacmanGame() {
/* ----- Global Variables ---------------------------------------- */
	var joystick;
	var context;
	var game;
	var canvas_walls, context_walls;
	var inky, blinky, clyde, pinky;

	var mapConfig = "data/map.json";
	var questionsData ="data/questions.json";
	
	var scale=window.innerHeight*0.75/390;
	var canvas = $("#pacmanCanvas").get(0);
	canvas.width*=scale;
	canvas.height*=scale;

	function buildWall(context,gridX,gridY,width,height) {
		width = width*2-1;
		height = height*2-1;
		context.fillRect(pacman.radius/2+gridX*2*pacman.radius,pacman.radius/2+gridY*2*pacman.radius, width*pacman.radius, height*pacman.radius);
	}

	function throttle(func, wait, options) {
	  var context, args, result;
	  var timeout = null;
	  var previous = 0;
	  if (!options) options = {};
	  var later = function() {
	    previous = options.leading === false ? 0 : Date.now();
	    timeout = null;
	    result = func.apply(context, args);
	    if (!timeout) context = args = null;
	  };
	  return function() {
	    var now = Date.now();
	    if (!previous && options.leading === false) previous = now;
	    var remaining = wait - (now - previous);
	    context = this;
	    args = arguments;
	    if (remaining <= 0 || remaining > wait) {
	      if (timeout) {
	        clearTimeout(timeout);
	        timeout = null;
	      }
	      previous = now;
	      result = func.apply(context, args);
	      if (!timeout) context = args = null;
	    } else if (!timeout && options.trailing !== false) {
	      timeout = setTimeout(later, remaining);
	    }
	    return result;
	  };
	};
	
	function between(x, min, max) {
		return x >= min && x <= max;
	}
	// stop watch to measure the time
	function Timer() {
		this.time_diff = 0;
		this.time_start = 0;
		this.time_stop = 0;
		this.start = function() {
			this.time_start = new Date().getTime();
		}
		this.stop = function() {
			this.time_stop = new Date().getTime();
			this.time_diff += this.time_stop - this.time_start;
			this.time_stop = 0;
			this.time_start = 0;
		}
		this.reset = function() {
			this.time_diff = 0;
			this.time_start = 0;
			this.time_stop = 0;
		}
		this.get_time_diff = function() {
			return this.time_diff;
		}
	}
	
	// Manages the whole game ("God Object")
	function Game() {
		this.timer = new Timer();
		this.refreshRate = 33;		// speed of the game, will increase in higher levels
		this.running = false;
		this.pause = true;
		this.score = new Score();
		this.soundfx = 0;
		this.map;
		this.pillCount;				// number of pills
		this.monsters;
		this.level = 0;
		this.refreshLevel = function(h) {
			$(h).html("Lvl: "+this.level);
		};
		this.gameOver = false;
		this.canvas = $("#pacmanCanvas").get(0);
		this.wallColor = "Blue";

		this.width = 540;
		this.height = 390;

		this.pillSize = 3;
		this.powerpillSizeMin = 4;
		this.powerpillSizeMax = 6;
		this.powerpillSizeCurrent = this.powerpillSizeMax;
		this.powerPillAnimationCounter = 0;
		this.nextPowerPillSize = function() {
			return this.powerpillSizeCurrent;
		};
		
		this.ghostMode = 0;			// 0 = Scatter, 1 = Chase
		this.ghostModeTimer = 200;	// decrements each animationLoop execution
		this.ghostSpeedNormal = (this.level > 3 ? 3 : 2);	// global default for ghost speed

		this.svgData= {
			pacman: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2563 2563" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd"><defs><style><![CDATA[.fil2 {fill:none}.fil0 {fill:#FFED59}.fil6 {fill:#3B0A6E;fill-rule:nonzero}.fil5 {fill:#8143C4;fill-rule:nonzero}.fil7 {fill:#DECF2A;fill-rule:nonzero}.fil3 {fill:#EDDD38;fill-rule:nonzero}.fil4 {fill:white;fill-rule:nonzero}.fil1 {fill:#D1C306;fill-rule:nonzero;fill-opacity:0.400000}]]></style><clipPath id="id0"><path d="M1409 1320l1154 604c-116 197-288 361-496 473-632 343-1440 138-1804-457S117 584 750 242c29-16 60-31 90-45-34-27-75-50-123-65-145-45-321-5-522 119-28 18-65 10-84-16-18-26-10-62 18-79C363 12 573-33 755 24c87 27 156 75 208 125 591-200 1267 21 1591 551l-1145 620z"/></clipPath></defs><g id="Layer_x0020_1"><g id="_1954663795152"><path class="fil0" d="M1409 1320l1154 604c-116 197-288 361-496 473-632 343-1440 138-1804-457S117 584 750 242c29-16 60-31 90-45-34-27-75-50-123-65-145-45-321-5-522 119-28 18-65 10-84-16-18-26-10-62 18-79C363 12 573-33 755 24c87 27 156 75 208 125 591-200 1267 21 1591 551l-1145 620z"/><g clip-path="url(#id0)"><path id="1" class="fil1" d="M2263 264c0 147-127 266-283 266s-283-119-283-266S1824-2 1980-2s283 119 283 266z"/><path class="fil1" d="M476 1030c0 135-117 244-260 244-144 0-260-109-260-244S72 785 216 785c143 0 260 110 260 245zM736 2261c0 136-117 246-261 246s-261-110-261-246c0-135 117-245 261-245s261 110 261 245zM736 1477c0 67-58 122-130 122s-130-55-130-122c0-68 58-123 130-123s130 55 130 123zM1697 1836c0 147-127 267-283 267s-283-120-283-267 127-266 283-266 283 119 283 266zM1970 2235c0 34-29 62-65 62s-65-28-65-62 29-61 65-61 65 27 65 61zM2831 1714c0 147-127 266-283 266s-283-119-283-266 127-267 283-267 283 120 283 267zM1451 2358c0 34-29 62-65 62s-66-28-66-62 30-61 66-61 65 27 65 61z"/></g><path class="fil2" d="M1409 1320l1154 604c-116 197-288 361-496 473-632 343-1440 138-1804-457S117 584 750 242c29-16 60-31 90-45-34-27-75-50-123-65-145-45-321-5-522 119-28 18-65 10-84-16-18-26-10-62 18-79C363 12 573-33 755 24c87 27 156 75 208 125 591-200 1267 21 1591 551l-1145 620z"/><path class="fil3" d="M1630 711c0 239-206 433-460 433S710 950 710 711s206-432 460-432 460 193 460 432z"/><path class="fil4" d="M1555 711c0 200-172 362-385 362-212 0-384-162-384-362s172-362 384-362c213 0 385 162 385 362z"/><path class="fil5" d="M1419 711c0 130-111 234-249 234-137 0-248-104-248-234 0-129 111-234 248-234 138 0 249 105 249 234z"/><path class="fil6" d="M1300 711c0 68-58 122-130 122-71 0-129-54-129-122 0-67 58-122 129-122 72 0 130 55 130 122z"/><path class="fil4" d="M1449 574c0 64-55 115-122 115-68 0-123-51-123-115s55-116 123-116c67 0 122 52 122 116z"/><path class="fil7" d="M8 257c28 82 120 126 207 100 86-26 133-113 106-194C293 81 200 37 114 63S-20 176 8 257z"/></g></g></svg>'
		};
		this.getSvgData= function(id,number){
			var data;
			switch(id){
				case 0:
					data='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2450 2563" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd"><defs><style><![CDATA[@font-face { font-family:"Geometr415 Blk BT";src:url("#FontID0") format(svg)}.fil6 {fill:#FEFEFE}.fil4 {fill:#422D90;fill-rule:nonzero}.fil3 {fill:#604BAB;fill-rule:nonzero}.fil1 {fill:#D6427B;fill-rule:nonzero}.fil0 {fill:#FF4F93;fill-rule:nonzero}.fil2 {fill:white;fill-rule:nonzero}.fil5 {fill:#085256;fill-rule:nonzero;fill-opacity:0.400000}.fnt0 {font-weight:normal;font-size:724.319px;font-family:"Geometr415 Blk BT"}]]></style></defs><g id="Layer_x0020_1"><g id="_1954663778864"><path class="fil0" d="M1929 2169V1100c0-389-315-704-704-704s-704 315-704 704v1069c-48 0-88 40-88 88v218c0 49 40 88 88 88 49 0 88-39 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 49 40 88 88 88 49 0 88-39 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 49 39 88 88 88s88-39 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 49 39 88 88 88 48 0 88-39 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 49 39 88 88 88 48 0 88-39 88-88v-218c0-48-40-88-88-88z"/><path class="fil0" d="M1222 426h-1c-22-1-38-19-38-41 1-7 9-183 146-283 99-73 238-86 413-38 21 6 33 27 27 48s-27 33-48 27c-150-41-267-32-346 26-107 78-113 222-113 223-1 21-19 38-40 38zM630 1058s-20 29-188 29c-117 0-296-170-342-79-38 76 83 286 191 200 120-95 296-71 339-57v-93zM1820 1058s20 29 188 29c117 0 296-170 342-79 38 76-83 286-191 200-120-95-296-71-339-57v-93z"/><path class="fil1" d="M1693 1066c0 258-210 467-468 467s-468-209-468-467 210-468 468-468 468 210 468 468z"/><path class="fil2" d="M1616 1066c0 216-175 391-391 391s-391-175-391-391 175-391 391-391 391 175 391 391z"/><path class="fil3" d="M1478 1066c0 139-113 253-253 253s-253-114-253-253c0-140 113-253 253-253s253 113 253 253z"/><path class="fil4" d="M1357 1066c0 73-59 132-132 132s-132-59-132-132 59-132 132-132 132 59 132 132z"/><path class="fil2" d="M1509 917c0 69-56 125-125 125s-125-56-125-125 56-124 125-124 125 55 125 124z"/><path class="fil1" d="M1838 106c0 59-48 106-107 106-58 0-106-47-106-106 0-58 48-106 106-106 59 0 107 48 107 106zM1400 364c0 29-24 53-53 53h-244c-29 0-53-24-53-53 0-30 24-54 53-54h244c29 0 53 24 53 54zM1929 1217c-108 0-195 87-195 195 0 107 87 194 195 194v-389zM521 1951c69 0 125-55 125-124s-56-124-125-124v248zM776 1436c0 40-32 73-72 73-41 0-73-33-73-73s32-73 73-73c40 0 72 33 72 73zM563 862c151-11 271-137 271-292 0-17-2-35-5-52-121 83-216 203-266 344zM1889 1853c0 32-26 58-58 58-33 0-59-26-59-58s26-59 59-59c32 0 58 27 58 59zM1816 718c-52-81-121-150-201-204-17 24-27 53-27 84 0 81 65 146 146 146 30 0 59-9 82-26z"/><path class="fil5" d="M1168 1652c0 22-14 40-32 40-17 0-31-18-31-40 0-23 14-41 31-41 18 0 32 18 32 41zM1345 1652c0 22-14 40-31 40-18 0-32-18-32-40 0-23 14-41 32-41 17 0 31 18 31 41z"/><path class="fil1" d="M223 1078c30 49 37 99 16 112-22 14-64-15-94-64-30-48-37-99-16-112s63 15 94 64zM2227 1078c-30 49-37 99-16 112 22 14 64-15 94-64 30-48 37-99 16-112s-63 15-94 64z"/><g><text x="1800" y="1282"  text-anchor="middle" class="fil6 fnt0" transform="matrix(1 0 0 1 -619.12 854.295)">'+number+'</text></g></g></g></svg>';
					break;
				case 1:
					data='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2450 2563" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd"><defs><style><![CDATA[@font-face { font-family:"Geometr415 Blk BT";src:url("#FontID0") format(svg)}.fil7 {fill:#FEFEFE}.fil1 {fill:#16C1CF;fill-rule:nonzero}.fil0 {fill:#1AE2EF;fill-rule:nonzero}.fil4 {fill:#4F0523;fill-rule:nonzero}.fil3 {fill:#D40C5E;fill-rule:nonzero}.fil2 {fill:white;fill-rule:nonzero}.fil6 {fill:#085256;fill-rule:nonzero;fill-opacity:0.400000}.fil5 {fill:#16BFCC;fill-rule:nonzero;fill-opacity:0.400000}.fnt0 {font-weight:normal;font-size:724.039px;font-family:"Geometr415 Blk BT"}]]></style></defs><g id="Layer_x0020_1"><g id="_1954665153200"><path class="fil0" d="M1928 2169V1100c0-389-315-704-703-704s-703 315-703 704v1069c-49 0-88 39-88 88v218c0 48 39 88 88 88 48 0 88-40 88-88v-83c0-49 39-88 88-88 48 0 87 39 87 88v83c0 48 40 88 88 88 49 0 88-40 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 48 39 88 88 88s88-40 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 48 39 88 88 88 48 0 88-40 88-88v-83c0-49 39-88 87-88 49 0 88 39 88 88v83c0 48 40 88 88 88 49 0 88-40 88-88v-218c0-49-39-88-88-88z"/><path class="fil1" d="M1692 1066c0 258-209 467-467 467s-467-209-467-467 209-467 467-467 467 209 467 467z"/><path class="fil2" d="M1616 1066c0 216-175 391-391 391s-391-175-391-391 175-391 391-391 391 175 391 391z"/><path class="fil3" d="M1478 1066c0 140-113 253-253 253s-253-113-253-253 113-253 253-253 253 113 253 253z"/><path class="fil4" d="M1357 1066c0 73-59 132-132 132s-132-59-132-132 59-132 132-132 132 59 132 132z"/><path class="fil2" d="M1509 918c0 68-56 124-125 124s-125-56-125-124c0-69 56-125 125-125s125 56 125 125z"/><path class="fil0" d="M1222 426h-1c-22-1-38-19-38-40 1-8 9-183 146-284 99-73 238-86 413-38 21 6 33 28 27 48-6 21-27 34-48 28-150-42-267-33-346 25-107 79-113 222-113 224-1 21-19 37-40 37z"/><path class="fil1" d="M1837 107c0 58-47 106-106 106-58 0-106-48-106-106 0-59 48-107 106-107 59 0 106 48 106 107zM1400 364c0 29-24 53-53 53h-244c-29 0-53-24-53-53s24-53 53-53h244c29 0 53 24 53 53z"/><path class="fil5" d="M1928 1217c-107 0-194 87-194 195 0 107 87 194 194 194v-389zM522 1951c68 0 124-56 124-124 0-69-56-125-124-125v249zM777 1436c0 40-33 73-73 73s-73-33-73-73 33-73 73-73 73 33 73 73zM563 862c152-11 271-137 271-291 0-18-1-36-5-53-121 83-215 203-266 344zM1889 1853c0 32-26 58-59 58-32 0-58-26-58-58 0-33 26-59 58-59 33 0 59 26 59 59zM1816 719c-52-81-121-151-201-205-17 24-27 53-27 85 0 80 65 145 146 145 30 0 59-9 82-25z"/><path class="fil6" d="M1168 1652c0 22-14 40-32 40-17 0-31-18-31-40 0-23 14-41 31-41 18 0 32 18 32 41zM1345 1652c0 22-14 40-31 40-18 0-32-18-32-40 0-23 14-41 32-41 17 0 31 18 31 41z"/><path class="fil0" d="M630 1058s-20 29-188 29c-117 0-295-170-341-79-39 76 83 286 191 200 119-95 295-71 338-57v-93z"/><path class="fil6" d="M223 1078c30 49 38 99 16 112-21 14-63-15-94-64-30-48-37-99-16-112 22-13 64 15 94 64z"/><path class="fil0" d="M1820 1058s20 29 188 29c117 0 295-170 341-79 39 76-83 286-191 200-119-95-295-71-338-57v-93z"/><path class="fil6" d="M2227 1078c-30 49-38 99-16 112 21 14 63-15 94-64 30-48 37-99 16-112-22-13-64 15-94 64z"/><text x="1200" y="2136"  text-anchor="middle" class="fil7 fnt0">'+number+'</text></g></g></svg>';
					break;
				case 2:
					data='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2450 2563" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd"><defs><style><![CDATA[@font-face { font-family:"Geometr415 Blk BT";src:url("#FontID0") format(svg)}.fil7 {fill:#FEFEFE}.fil1 {fill:#00487D;fill-rule:nonzero}.fil0 {fill:#0079CC;fill-rule:nonzero}.fil5 {fill:#078AE3;fill-rule:nonzero}.fil4 {fill:#3B0A6E;fill-rule:nonzero}.fil3 {fill:#896CA8;fill-rule:nonzero}.fil2 {fill:white;fill-rule:nonzero}.fil6 {fill:#085256;fill-rule:nonzero;fill-opacity:0.400000}.fnt0 {font-weight:normal;font-size:724.291px;font-family:"Geometr415 Blk BT"}]]></style></defs><g id="Layer_x0020_1"><g id="_1954549022448"><path class="fil0" d="M1929 2169V1100c0-389-315-704-704-704s-704 315-704 704v1069c-48 0-88 40-88 88v218c0 49 40 88 88 88 49 0 88-39 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 49 40 88 88 88 49 0 88-39 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 49 39 88 88 88s88-39 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 49 39 88 88 88 48 0 88-39 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 49 39 88 88 88 48 0 88-39 88-88v-218c0-48-40-88-88-88z"/><path class="fil0" d="M1222 426h-1c-22-1-38-19-38-41 1-7 9-183 146-283 99-73 238-86 413-38 21 6 33 27 27 48s-27 33-48 27c-150-41-267-32-346 26-107 78-113 222-113 223-1 21-19 38-40 38zM630 1058s-20 29-188 29c-117 0-296-170-342-79-38 76 83 286 191 200 120-95 296-71 339-57v-93zM1820 1058s20 29 188 29c117 0 296-170 342-79 38 76-83 286-191 200-120-95-296-71-339-57v-93z"/><path class="fil1" d="M1693 1066c0 258-210 467-468 467s-468-209-468-467 210-468 468-468 468 210 468 468zM1838 106c0 59-48 106-107 106-58 0-106-47-106-106 0-58 48-106 106-106 59 0 107 48 107 106zM1400 364c0 29-24 53-53 53h-244c-29 0-53-24-53-53 0-30 24-54 53-54h244c29 0 53 24 53 54zM223 1078c30 49 37 99 16 112-22 14-64-15-94-64-30-48-38-99-16-112 21-13 63 15 94 64zM2227 1078c-30 49-37 99-16 112 22 14 64-15 94-64 30-48 37-99 16-112s-63 15-94 64z"/><path class="fil2" d="M1616 1066c0 216-175 391-391 391s-391-175-391-391 175-391 391-391 391 175 391 391z"/><path class="fil3" d="M1478 1066c0 139-113 253-253 253s-253-114-253-253c0-140 113-253 253-253s253 113 253 253z"/><path class="fil4" d="M1357 1066c0 73-59 132-132 132s-132-59-132-132 59-132 132-132 132 59 132 132z"/><path class="fil2" d="M1509 917c0 69-56 125-125 125s-125-56-125-125 56-124 125-124 125 55 125 124z"/><path class="fil5" d="M1929 1217c-108 0-195 87-195 195 0 107 87 194 195 194v-389zM521 1951c69 0 125-55 125-124s-56-124-125-124v248zM776 1436c0 40-32 73-72 73-41 0-73-33-73-73s32-73 73-73c40 0 72 33 72 73zM563 862c151-11 271-137 271-291 0-18-2-36-5-53-121 83-216 203-266 344zM1889 1853c0 32-26 58-58 58-33 0-59-26-59-58s26-59 59-59c32 0 58 27 58 59zM1816 718c-52-81-121-150-201-204-17 24-27 53-27 84 0 81 65 146 146 146 30 0 59-9 82-26z"/><path class="fil6" d="M1168 1652c0 22-14 40-32 40-17 0-31-18-31-40 0-23 14-41 31-41 18 0 32 18 32 41zM1345 1652c0 22-14 40-31 40-18 0-32-18-32-40 0-23 14-41 32-41 17 0 31 18 31 41z"/><g><text x="1800" y="1282" class="fil7 fnt0" transform="matrix(1 0 0 1 -619.155 854.314)" text-anchor="middle">'+number+'</text></g></g></g></svg>';
					break;
				case 3:
					data='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2450 2563" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd"><defs><style><![CDATA[@font-face { font-family:"Geometr415 Blk BT";src:url("#FontID0") format(svg)}.fil7 {fill:#FEFEFE}.fil1 {fill:#266254;fill-rule:nonzero}.fil5 {fill:#39B193;fill-rule:nonzero}.fil0 {fill:#49C1A3;fill-rule:nonzero}.fil4 {fill:#591349;fill-rule:nonzero}.fil3 {fill:#BC2A9A;fill-rule:nonzero}.fil2 {fill:white;fill-rule:nonzero}.fil6 {fill:#085256;fill-rule:nonzero;fill-opacity:0.400000}.fnt0 {font-weight:normal;font-size:724.327px;font-family:"Geometr415 Blk BT"}]]></style></defs><g id="Layer_x0020_1"><g id="_1954549021808"><path class="fil0" d="M1929 2169V1100c0-389-315-704-704-704s-704 315-704 704v1069c-48 0-88 40-88 88v218c0 49 40 88 88 88 49 0 88-39 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 49 40 88 88 88 49 0 88-39 88-88v-83c0-49 40-88 88-88 49 0 88 39 88 88v83c0 49 39 88 88 88s88-39 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 49 39 88 88 88 48 0 88-39 88-88v-83c0-49 39-88 88-88 48 0 88 39 88 88v83c0 49 39 88 88 88 48 0 88-39 88-88v-218c0-48-40-88-88-88z"/><path class="fil0" d="M1222 426h-1c-22-1-39-19-38-41 1-7 9-183 146-283 99-73 238-86 413-38 21 6 33 27 27 48s-27 33-48 27c-150-41-267-32-346 26-107 78-113 222-113 223-1 21-19 38-40 38zM630 1058s-20 29-188 29c-117 0-296-170-342-79-38 76 83 286 191 200 120-95 296-71 339-57v-93zM1820 1058s20 29 188 29c117 0 296-170 342-79 38 76-83 286-191 200-120-95-296-71-339-57v-93z"/><path class="fil1" d="M1693 1066c0 258-210 467-468 467s-468-209-468-467 210-468 468-468 468 210 468 468zM1838 106c0 59-48 106-107 106-58 0-106-47-106-106 0-58 48-106 106-106 59 0 107 48 107 106zM1400 364c0 29-24 53-53 53h-244c-29 0-53-24-53-53 0-30 24-54 53-54h244c29 0 53 24 53 54zM223 1078c30 49 37 99 16 112-22 14-64-15-94-64-30-48-38-99-16-112 21-13 63 15 94 64zM2227 1078c-30 49-37 99-16 112 22 14 64-15 94-64 30-48 37-99 16-112s-63 15-94 64z"/><path class="fil2" d="M1616 1066c0 216-175 391-391 391s-391-175-391-391 175-391 391-391 391 175 391 391z"/><path class="fil3" d="M1478 1066c0 139-113 253-253 253s-253-114-253-253c0-140 113-253 253-253s253 113 253 253z"/><path class="fil4" d="M1357 1066c0 73-59 132-132 132s-132-59-132-132 59-132 132-132 132 59 132 132z"/><path class="fil2" d="M1509 917c0 69-56 125-125 125s-125-56-125-125 56-124 125-124 125 55 125 124z"/><path class="fil5" d="M1929 1217c-108 0-195 87-195 195 0 107 87 194 195 194v-389zM521 1951c69 0 125-55 125-124s-56-124-125-124v248zM776 1436c0 40-32 73-72 73-41 0-73-33-73-73s32-73 73-73c40 0 72 33 72 73zM563 862c151-11 271-137 271-291 0-18-2-36-5-53-121 83-216 203-266 344zM1889 1853c0 32-26 58-58 58-33 0-59-26-59-58s26-59 59-59c32 0 58 27 58 59zM1816 718c-52-81-121-150-201-204-17 24-27 53-27 84 0 81 65 146 146 146 30 0 59-9 82-26z"/><path class="fil6" d="M1168 1652c0 22-14 40-32 40-17 0-31-18-31-40 0-23 14-41 31-41 18 0 32 18 32 41zM1345 1652c0 22-14 40-31 40-18 0-32-18-32-40 0-23 14-41 32-41 17 0 31 18 31 41z"/><text x="1800" y="1282" class="fil7 fnt0" transform="matrix(1 0 0 1 -619.146 854.327)" text-anchor="middle">'+number+'</text></g></g></svg>';
					break;
			}
            return data;
		}
		this.populateSvgData=function(){
			game.svgData['pinky']=game.getSvgData(0,game.question.que[game.level][0].answer);
			game.svgData['blinky']=game.getSvgData(1,game.question.que[game.level][1].answer);
			game.svgData['inky']=game.getSvgData(2,game.question.que[game.level][2].answer);
			game.svgData['clyde']=game.getSvgData(3,game.question.que[game.level][3].answer);
		}
		this.getSvgUrl=function(name){
			var DOMURL = window.URL || window.webkitURL || window;
			var svg = new Blob([game.svgData[name]], {type: 'image/svg+xml;charset=utf-8'});
			var url = DOMURL.createObjectURL(svg);
			return url;
		}
		
		/* Game Functions */
		this.checkGhostMode = function() {
			// always decrement ghostMode timer
			this.ghostModeTimer--;
			if (this.ghostModeTimer === 0 && game.level > 0) {
				this.ghostMode ^= 1;
				this.ghostModeTimer = 200 + this.ghostMode * 450;

				game.buildWalls();

				inky.reverseDirection();
				pinky.reverseDirection();
				clyde.reverseDirection();
				blinky.reverseDirection();
			}
		};
		
		this.getMapContent = function (x, y) {
			var maxX = 17;
			var maxY = 12;
			if (x < 0) x = maxX + x;
			if (x > maxX) x = x-maxX;
			if (y < 0) y = maxY + y;
			if (y > maxY) y = y-maxY;
			return this.map.posY[y].posX[x].type;
		};

		this.setMapContent = function (x,y,val) {
			var maxX = 17;
			var maxY = 12;
			if (x < 0) x = maxX + x;
			if (x > maxX) x = x-maxX;
			if (y < 0) y = maxY + y;
			if (y > maxY) y = y-maxY;
			this.map.posY[y].posX[x].type=val;
		};
		
		this.toggleSound = function() { 
			this.soundfx === 0 ? this.soundfx = 1 : this.soundfx = 0; 
			Sound.play();
			$('#mute').toggle();
		};

		this.reset = function() {
		};

		this.newGame = function(option) {
			var r=1;
			if(!option){
				r = confirm("Are you sure you want to restart?");
			}
            if (r) {
                this.init(0);
                this.pauseResume();
            }
		};

		this.nextLevel = function() {
			this.level++;
			game.showMessage("Level "+game.level, this.getLevelTitle() + "<br/>(Click to continue!)");
			game.refreshLevel(".level");
			this.init(1);
		};

		this.drawHearts = function (count) {
			var html = "";
			for (var i = 0; i<count; i++) {
				html += " <img src='img/heart.png'>";
				}
			$(".lives").html("Lives: "+html);	
		};

		this.setQuestion=function(){
			var index;
			do{
				index= Math.floor(Math.random() * 4);
			}while(game.currentQuestion && game.question.que[this.level][index].solved==true);
			game.currentQuestion=game.question.que[this.level][index];
			document.getElementById('question').innerHTML= game.currentQuestion.equation;
		}
		this.throttledSetQuestion = throttle(this.setQuestion,500,{trailing: false});
		
		this.clearQuestion=function(){
			document.getElementById('question').innerHTML= 'Eat a powerpill';
		}

		this.showContent = function (id) {
			$('.content').hide();
			$('#'+id).show();
		};

		this.getLevelTitle = function() {
			switch(this.level) {
				case 1:
					return '"The chase begins"';
                    // activate chase / scatter switching
				case 2:
					return '"Inky\s awakening"';
                    // Inky starts leaving the ghost house
				case 3:
					return '"Clyde\s awakening"';
                    // Clyde starts leaving the ghost house
				case 4:
					return '"need for speed"';
                    // All the ghosts get faster from now on
                case 5:
                    return '"hunting season 1"';
                    // TODO: No scatter mood this time
                case 6:
                    return '"the big calm"';
                    // TODO: Only scatter mood this time
                case 7:
                    return '"hunting season 2"';
                    // TODO: No scatter mood and all ghosts leave instantly
                case 8:
                    return '"ghosts on speed"';
                    // TODO: Ghosts get even faster for this level
				default:
					return '"nothing new"';
			}
		}

		this.showMessage = function(title, text) {
			this.timer.stop();
			this.pause = true;
			$('#canvas-overlay-container').fadeIn(200);
			$('#canvas-overlay-content #title').text(title);
			$('#canvas-overlay-content #text').html(text);
		};

		this.closeMessage = function() {
			$('#canvas-overlay-container').fadeOut(200);
		};

		this.pauseResume = function () {
			if (!this.running) {
				// start timer
				this.timer.start();
				this.pause = false;
				this.running = true;
				this.closeMessage();
				animationLoop();
			}
			else if (this.pause) {
				// stop timer
				this.timer.stop();
				this.pause = false;
				this.closeMessage();
				}
			else {
				this.showMessage("Pause","Click to Resume");
				}
			};

		this.init = function (state) {
			// reset timer if restart
			if( state === 0 ) {
                this.timer.reset();
			}
			//Clear GhostMode		
			game.ghostMode = 0;			// 0 = Scatter, 1 = Chase
			game.ghostModeTimer = 200;	// decrements each animationLoop execution
			game.buildWalls();
			// get Level Map
			$.ajax({
				url: mapConfig,
				async: false,
				 beforeSend: function(xhr){
					if (xhr.overrideMimeType) xhr.overrideMimeType("application/json"); 
				},
				dataType: "json",
				success: function (data) {
					game.map =  data;
				}
			});
			$.ajax({
				url: questionsData,
				async: false,
				 beforeSend: function(xhr){
					if (xhr.overrideMimeType) xhr.overrideMimeType("application/json"); 
				},
				dataType: "json",
				success: function (data) {
					game.question =  data;
				}
			});
		
			var temp = 0;
			$.each(this.map.posY, function(i, item) {
			   $.each(this.posX, function() { 
				   if (this.type == "pill") {
					temp++;
					}
				});
			});
			
			this.pillCount = temp;

			if (state === 0) {
				this.score.set(0);
				this.score.refresh(".score");
				pacman.lives = 3;
				game.level = 0;
				this.refreshLevel(".level");
				game.gameOver = false;
				this.clearQuestion();
			}

			game.populateSvgData();
			
			// initalize Ghosts, avoid memory flooding
			if (pinky === null || pinky === undefined) {
				pinky = new Ghost("pinky",7,5,2,2);
				inky = new Ghost("inky",8,5,13,11);
				blinky = new Ghost("blinky",9,5,13,0);
				clyde = new Ghost("clyde",10,5,2,11);
			}
			else {
				pinky.reset();
				inky.reset();
				blinky.reset();
				clyde.reset();
			}
			blinky.start();	// blinky is the first to leave ghostHouse
			inky.start();
			pinky.start();
			clyde.start();

			pacman.reset();

			pinky.dead=false;
			inky.dead=false;
			blinky.dead=false;
			clyde.dead=false;
			
			game.drawHearts(pacman.lives);	
		};

		this.allGhostDead=function(){
			if(	pinky.dead &&
				inky.dead &&
				blinky.dead &&
				clyde.dead){
				return true;
			}
		}

		this.check = function() {
		if (game.allGhostDead() && game.running) {
				this.nextLevel();
			}
		};

		this.win = function () {};
		this.gameover = function () {};

		this.toPixelPos = function (gridPos) {
			return gridPos*30;
		};

		this.toGridPos = function (pixelPos) {
			return ((pixelPos % 30)/30);
		};

		/* ------------ Start Pre-Build Walls  ------------ */
		this.buildWalls = function() {
			if (this.ghostMode === 0) game.wallColor = "Blue";
			else game.wallColor = "Red";
			canvas_walls = document.createElement('canvas');
			canvas_walls.width = game.canvas.width;
			canvas_walls.height = game.canvas.height;
			context_walls = canvas_walls.getContext("2d");

			context_walls.fillStyle = game.wallColor;
			context_walls.strokeStyle = game.wallColor;
			
			//horizontal outer
			buildWall(context_walls,0,0,18,1);
			buildWall(context_walls,0,12,18,1);
			
			// vertical outer
			buildWall(context_walls,0,0,1,6);
			buildWall(context_walls,0,7,1,6);
			buildWall(context_walls,17,0,1,6);
			buildWall(context_walls,17,7,1,6);
			
			// ghost base
			buildWall(context_walls,7,4,1,1);
			buildWall(context_walls,6,5,1,2);
			buildWall(context_walls,10,4,1,1);
			buildWall(context_walls,11,5,1,2);
			buildWall(context_walls,6,6,6,1);
			
			// ghost base door
			context_walls.fillRect(8*2*pacman.radius,pacman.radius/2+4*2*pacman.radius+5, 4*pacman.radius, 1);
			
			// single blocks
			buildWall(context_walls,4,0,1,2);
			buildWall(context_walls,13,0,1,2);
			
			buildWall(context_walls,2,2,1,2);
			buildWall(context_walls,6,2,2,1);
			buildWall(context_walls,15,2,1,2);
			buildWall(context_walls,10,2,2,1);
			
			buildWall(context_walls,2,3,2,1);
			buildWall(context_walls,14,3,2,1);
			buildWall(context_walls,5,3,1,1);
			buildWall(context_walls,12,3,1,1);
			buildWall(context_walls,3,3,1,3);
			buildWall(context_walls,14,3,1,3);
			
			buildWall(context_walls,3,4,1,1);
			buildWall(context_walls,14,4,1,1);
			
			buildWall(context_walls,0,5,2,1);
			buildWall(context_walls,3,5,2,1);
			buildWall(context_walls,16,5,2,1);
			buildWall(context_walls,13,5,2,1);
			
			buildWall(context_walls,0,7,2,2);
			buildWall(context_walls,16,7,2,2);
			buildWall(context_walls,3,7,2,2);
			buildWall(context_walls,13,7,2,2);
			
			buildWall(context_walls,4,8,2,2);
			buildWall(context_walls,12,8,2,2);
			buildWall(context_walls,5,8,3,1);
			buildWall(context_walls,10,8,3,1);
			
			buildWall(context_walls,2,10,1,1);
			buildWall(context_walls,15,10,1,1);
			buildWall(context_walls,7,10,4,1);
			buildWall(context_walls,4,11,2,2);
			buildWall(context_walls,12,11,2,2);
			/* ------------ End Pre-Build Walls  ------------ */
		};

	}

	game = new Game();

	function Score() {
		this.score = 0;
		this.set = function(i) {
			this.score = i;
		};
		this.add = function(i) {
			this.score += i;
		};
		this.refresh = function(h) {
			$(h).html("Score: "+this.score);
		};
		
	}
	
	// used to play sounds during the game
	var Sound = {};
	Sound.play = function (sound) {
		if (game.soundfx == 1) {
			var audio = document.getElementById(sound);
		}
	};
	
	// Direction object in Constructor notation
	function Direction(name,angle1,angle2,dirX,dirY) {
		this.name = name;
		this.angle1 = angle1;
		this.angle2 = angle2;
		this.dirX = dirX;
		this.dirY = dirY;
		this.equals = function(dir) {
			return  JSON.stringify(this) ==  JSON.stringify(dir);
		};
	}
	
	// Direction Objects
	var up = new Direction("up",1.75,1.25,0,-1);		// UP
	var left = new Direction("left",1.25,0.75,-1,0);	// LEFT
	var down = new Direction("down",0.75,0.25,0,1);		// DOWN
	var right = new Direction("right",0.25,1.75,1,0);	// 

	// DirectionWatcher
	function directionWatcher() {
		this.dir = null;
		this.set = function(dir) {
			this.dir = dir;
		};
		this.get = function() {
			return this.dir;
		};
	}
	
	// Ghost object in Constructor notation
	function Ghost(name, gridPosX, gridPosY, gridBaseX, gridBaseY) {
		this.name = name;
		this.posX = gridPosX * 30;
		this.posY = gridPosY * 30;
		this.startPosX = gridPosX * 30;
		this.startPosY = gridPosY * 30;
		this.gridBaseX = gridBaseX;
		this.gridBaseY = gridBaseY;
		this.speed = game.ghostSpeedNormal;
		this.image = new Image();
		this.image.src = game.getSvgUrl(name);
		this.ghostHouse = true;
        this.dead = false;
		this.direction = right;
		this.radius = pacman.radius;
		this.setNumber= function(){
			switch (this.name) {
				case "pinky":
					this.number= game.question.que[game.level][0].answer;
					break;
				case "blinky":
					this.number= game.question.que[game.level][1].answer;
					break;
				case "inky":
					this.number= game.question.que[game.level][2].answer;
					break;
				case "clyde":
					this.number= game.question.que[game.level][3].answer;
					break;
			}		
		}
		this.setNumber();
		this.draw = function (context) {					
			if (!this.dead) {
				context.drawImage(this.image, this.posX, this.posY, 2*this.radius, 2*this.radius);
			}
		}
		this.getCenterX = function () {
			return this.posX+this.radius;
		}
		this.getCenterY = function () {
			return this.posY+this.radius;
		}
		this.reset = function() {
			this.image.src = game.getSvgUrl(name);
			this.posX = this.startPosX;
			this.posY = this.startPosY;
			this.ghostHouse = true;
			this.setNumber();
		}
		
		this.die = function() {
            if (!this.dead) {
                game.score.add(100);
                this.dead = true;
                this.changeSpeed(game.ghostSpeedNormal);
            }
		}
		this.changeSpeed = function(s) {
			// adjust gridPosition to new speed
			this.posX = Math.round(this.posX / s) * s;
			this.posY = Math.round(this.posY / s) * s;
			this.speed = s;
		}
		this.move = function() {
		
			this.checkDirectionChange();
			this.checkCollision();
		
			// leave Ghost House
			if (this.ghostHouse == true) {
				if ((this.getGridPosY() == 5) && this.inGrid()) {
					if ((this.getGridPosX() == 7)) this.setDirection(right);
					if ((this.getGridPosX() == 8) || this.getGridPosX() == 9) this.setDirection(up);
					if ((this.getGridPosX() == 10)) this.setDirection(left);
				}
				if ((this.getGridPosY() == 4) && ((this.getGridPosX() == 8) || (this.getGridPosX() == 9)) && this.inGrid()) { 
					this.ghostHouse = false;
				}
			}
			
			if (!this.stop) {
			// Move
				this.posX += this.speed * this.dirX;
				this.posY += this.speed * this.dirY;
				
				// Check if out of canvas
				if (this.posX >= game.width-this.radius) this.posX = this.speed-this.radius;
				if (this.posX <= 0-this.radius) this.posX = game.width-this.speede-this.radius;
				if (this.posY >= game.height-this.radius) this.posY = this.speed-this.radius;
				if (this.posY <= 0-this.radius) this.posY = game.height-this.speed-this.radius;
			}
		}
			
		this.checkCollision = function() { 
			/* Check Back to Home */
			if (this.dead && (this.getGridPosX() == this.startPosX /30) && (this.getGridPosY() == this.startPosY / 30)) this.reset(); 
			else{
				/* Check Ghost / Pacman Collision*/
				if ((between(pacman.getCenterX(), this.getCenterX()-10, this.getCenterX()+10)) 
					&& (between(pacman.getCenterY(), this.getCenterY()-10, this.getCenterY()+10)))
				{
					if (!this.dead) {
						if(game.currentQuestion){
							if(this.number!=game.currentQuestion.answer){
								pacman.die();	
							}else{
								this.die();
								game.currentQuestion.solved=true;
								game.clearQuestion();
								game.check();	
							}
						}else{
							pacman.die();	
						}
					}
				}
			}
		}
		
		/* Pathfinding */
		this.getNextDirection = function() {
			// get next field
			var pX = this.getGridPosX();
			var pY= this.getGridPosY();
			game.getMapContent(pX,pY);
			var u, d, r, l; 			// option up, down, right, left
			
			// get target
			if (game.ghostMode == 0) {			// Scatter Mode
				var tX = this.gridBaseX;
				var tY = this.gridBaseY;
			} else if (game.ghostMode == 1) {			// Chase Mode

				switch (this.name) {
				
				// target: 4 ahead and 4 left of pacman
				case "pinky":
					var pdir = pacman.direction;
					var pdirX = pdir.dirX == 0 ? - pdir.dirY : pdir.dirX;
					var pdirY = pdir.dirY == 0 ? - pdir.dirX : pdir.dirY;
					
					var tX = (pacman.getGridPosX() + pdirX*4) % (game.width / pacman.radius +1);
					var tY = (pacman.getGridPosY() + pdirY*4) % (game.height / pacman.radius +1);
					break;
				
				// target: pacman
				case "blinky":
					var tX = pacman.getGridPosX();
					var tY = pacman.getGridPosY();
					break;
				
				// target: 
				case "inky":
					var tX = pacman.getGridPosX() + 2*pacman.direction.dirX;
					var tY = pacman.getGridPosY() + 2*pacman.direction.dirY;
					var vX = tX - blinky.getGridPosX();
					var vY = tY - blinky.getGridPosY();
					tX = Math.abs(blinky.getGridPosX() + vX*2);
					tY = Math.abs(blinky.getGridPosY() + vY*2);
					break;
				
				// target: pacman, until pacman is closer than 5 grid fields, then back to scatter
				case "clyde":
					var tX = pacman.getGridPosX();
					var tY = pacman.getGridPosY();
					var dist = Math.sqrt(Math.pow((pX-tX),2) + Math.pow((pY - tY),2));
					
					if (dist < 5) {
						tX = this.gridBaseX;
						tY = this.gridBaseY;
					}
					break;
				
				}
			}	
			
			
			var oppDir = this.getOppositeDirection();	// ghosts are not allowed to change direction 180°
			
			var dirs = [{},{},{},{}];		
			dirs[0].field = game.getMapContent(pX,pY-1);
			dirs[0].dir = up;
			dirs[0].distance = Math.sqrt(Math.pow((pX-tX),2) + Math.pow((pY -1 - tY),2));
			
			dirs[1].field = game.getMapContent(pX,pY+1);
			dirs[1].dir = down;
			dirs[1].distance = Math.sqrt(Math.pow((pX-tX),2) + Math.pow((pY+1 - tY),2));
			
			dirs[2].field = game.getMapContent(pX+1,pY);
			dirs[2].dir = right;
			dirs[2].distance = Math.sqrt(Math.pow((pX+1-tX),2) + Math.pow((pY - tY),2));
			
			dirs[3].field = game.getMapContent(pX-1,pY);
			dirs[3].dir = left;
			dirs[3].distance = Math.sqrt(Math.pow((pX-1-tX),2) + Math.pow((pY - tY),2));
			
			// Sort possible directions by distance
			function compare(a,b) {
			  if (a.distance < b.distance)
				 return -1;
			  if (a.distance > b.distance)
				return 1;
			  return 0;
			}
			var dirs2 = dirs.sort(compare);
			
			var r = this.dir;
			var j;

			for (var i = dirs2.length-1; i >= 0; i--) {
				if ((dirs2[i].field != "wall") && (dirs2[i].field != "door") && !(dirs2[i].dir.equals(this.getOppositeDirection()))) {
					r = dirs2[i].dir;
					}
			}		
			this.directionWatcher.set(r);
			return r;
		}
		this.setRandomDirection = function() {
			 var dir = Math.floor((Math.random()*10)+1)%5;
				
			 switch(dir) {
				case 1:	
					if (this.getOppositeDirection().equals(up)) this.setDirection(down);
					else this.setDirection(up);
					break;
				case 2:	
					if (this.getOppositeDirection().equals(down)) this.setDirection(up);
					else this.setDirection(down);
					break;
				case 3: 
					if (this.getOppositeDirection().equals(right)) this.setDirection(left);				
					else this.setDirection(right);
					break;
				case 4:		
					if (this.getOppositeDirection().equals(left)) this.setDirection(right);				
					else this.setDirection(left);
					break;
			 }
		}
		this.reverseDirection = function() {
			this.directionWatcher.set(this.getOppositeDirection());
		}
		
	}
	
	Ghost.prototype = new Figure();
	
	// Super Class for Pacman & Ghosts
	function Figure() {
		this.posX;
		this.posY;
		this.speed;
		this.dirX = right.dirX;
		this.dirY = right.dirY;
		this.direction;
		this.stop = true;
		this.directionWatcher = new directionWatcher();
		this.getNextDirection = function() {};
		this.checkDirectionChange = function() {
			if (this.inGrid() && (this.directionWatcher.get() == null)) this.getNextDirection();
			if ((this.directionWatcher.get() != null) && this.inGrid()) {
				this.setDirection(this.directionWatcher.get());
				this.directionWatcher.set(null);
			}
		}
		this.inGrid = function() {
			if((this.posX % (2*this.radius) === 0) && (this.posY % (2*this.radius) === 0)) return true;
			return false;
		}
		this.getOppositeDirection = function() {
			if (this.direction.equals(up)) return down;
			else if (this.direction.equals(down)) return up;
			else if (this.direction.equals(right)) return left;
			else if (this.direction.equals(left)) return right;
		}
		this.move = function() {
			if (!this.stop) {
				this.posX += this.speed * this.dirX;
				this.posY += this.speed * this.dirY;
				// Check if out of canvas
				if (this.posX >= game.width-this.radius) this.posX = this.speed-this.radius;
				if (this.posX <= 0-this.radius) this.posX = game.width-this.speed-this.radius;
				if (this.posY >= game.height-this.radius) this.posY = this.speed-this.radius;
				if (this.posY <= 0-this.radius) this.posY = game.height-this.speed-this.radius;
				}
			}
		this.stop = function() { this.stop = true;}
		this.start = function() { this.stop = false;}
		
		this.getGridPosX = function() {
			return (this.posX - (this.posX % 30))/30;
		}
		this.getGridPosY = function() {
			return (this.posY - (this.posY % 30))/30;
		}
		this.setDirection = function(dir) {			
			this.dirX = dir.dirX;
			this.dirY = dir.dirY;
			this.angle1 = dir.angle1;
			this.angle2 = dir.angle2;
			this.direction = dir;
		}
		this.setPosition = function(x, y) {
			this.posX = x;
			this.posY = y;
		}
	}
	
	function pacman() {
		this.radius = 15;
		this.posX = 0;
		this.posY = 6*2*this.radius;
		this.speed = 5;
		this.angle1 = 0.25;
		this.angle2 = 1.75;
		this.mouth = 1; /* Switches between 1 and -1, depending on mouth closing / opening */
		this.dirX = right.dirX;
		this.dirY = right.dirY;
		this.lives = 3;
		this.stuckX = 0;
		this.stuckY = 0;
		this.frozen = false;		// used to play die Animation
		this.image = new Image();
		this.image.src = game.getSvgUrl('pacman');
		this.freeze = function () {
			this.frozen = true;
		}
		this.unfreeze = function() {
			this.frozen = false;
		}
		this.getCenterX = function () {
			return this.posX+this.radius;
		}
		this.getCenterY = function () {
			return this.posY+this.radius;
		}
		this.directionWatcher = new directionWatcher();
		
		this.direction = right;
		
		this.checkCollisions = function () {
			
			if ((this.stuckX == 0) && (this.stuckY == 0) && this.frozen == false) {
				// Get the Grid Position of Pac
				var gridX = this.getGridPosX();
				var gridY = this.getGridPosY();
				var gridAheadX = gridX;
				var gridAheadY = gridY;
				
				var field = game.getMapContent(gridX, gridY);

				// get the field 1 ahead to check wall collisions
				if ((this.dirX == 1) && (gridAheadX < 17)) gridAheadX += 1;
				if ((this.dirY == 1) && (gridAheadY < 12)) gridAheadY += 1;
				var fieldAhead = game.getMapContent(gridAheadX, gridAheadY);

				/*	Check Pill Collision			*/
				if ((field === "pill") || (field === "powerpill")) {
					if (
						((this.dirX == 1) && (between(this.posX, game.toPixelPos(gridX)+this.radius-5, game.toPixelPos(gridX+1))))
						|| ((this.dirX == -1) && (between(this.posX, game.toPixelPos(gridX), game.toPixelPos(gridX)+5)))
						|| ((this.dirY == 1) && (between(this.posY, game.toPixelPos(gridY)+this.radius-5, game.toPixelPos(gridY+1))))
						|| ((this.dirY == -1) && (between(this.posY, game.toPixelPos(gridY), game.toPixelPos(gridY)+5)))
						|| (fieldAhead === "wall")
						)
						{	var s;
							if (field === "powerpill") {
								Sound.play("powerpill");
								s = 50;
								game.throttledSetQuestion();
							}else {
								Sound.play("waka");
								s = 10;
								game.pillCount--;
								game.setMapContent(gridX, gridY,"null");
							}
							game.score.add(s);
						}
				}
				
				/*	Check Wall Collision			*/
				if ((fieldAhead === "wall") || (fieldAhead === "door")) {
					this.stuckX = this.dirX;
					this.stuckY = this.dirY;
					pacman.stop();
					// get out of the wall
					if ((this.stuckX == 1) && ((this.posX % 2*this.radius) != 0)) this.posX -= 5;
					if ((this.stuckY == 1) && ((this.posY % 2*this.radius) != 0)) this.posY -= 5;
					if (this.stuckX == -1) this.posX += 5;
					if (this.stuckY == -1) this.posY += 5;
				}
				
			}
		}
		this.checkDirectionChange = function() {
			if (this.directionWatcher.get() != null) {
				if ((this.stuckX == 1) && this.directionWatcher.get() == right) this.directionWatcher.set(null);
				else {
					// reset stuck events
					this.stuckX = 0;
					this.stuckY = 0;

					// only allow direction changes inside the grid
					if ((this.inGrid())) {
						// check if possible to change direction without getting stuck
						var x = this.getGridPosX()+this.directionWatcher.get().dirX;
						var y = this.getGridPosY()+this.directionWatcher.get().dirY;
						if (x <= -1) x = game.width/(this.radius*2)-1;
						if (x >= game.width/(this.radius*2)) x = 0;
						if (y <= -1) x = game.height/(this.radius*2)-1;
						if (y >= game.height/(this.radius*2)) y = 0;
						var nextTile = game.map.posY[y].posX[x].type;
						if (nextTile != "wall") {
							this.setDirection(this.directionWatcher.get());
							this.directionWatcher.set(null);
						}
					}
				}
			}
		}
		this.setDirection = function(dir) {
			if (!this.frozen) {
				this.dirX = dir.dirX;
				this.dirY = dir.dirY;
				this.angle1 = dir.angle1;
				this.angle2 = dir.angle2;
				this.direction = dir;
			}
		}
		this.move = function() {
		
			if (!this.frozen) {
				this.posX += this.speed * this.dirX;
				this.posY += this.speed * this.dirY;
				
				// Check if out of canvas
				if (this.posX >= game.width-this.radius) this.posX = 5-this.radius;
				if (this.posX <= 0-this.radius) this.posX = game.width-5-this.radius;
				if (this.posY >= game.height-this.radius) this.posY = 5-this.radius;
				if (this.posY <= 0-this.radius) this.posY = game.height-5-this.radius;
			}
			else this.dieAnimation();
		}
		
		this.eat = function () {
		
			if (!this.frozen) {
				if (this.dirX == this.dirY == 0) {
				
					this.angle1 -= this.mouth*0.07;
					this.angle2 += this.mouth*0.07;
					
					var limitMax1 = this.direction.angle1;
					var limitMax2 = this.direction.angle2;
					var limitMin1 = this.direction.angle1 - 0.21;
					var limitMin2 = this.direction.angle2 + 0.21;
						
					if (this.angle1 < limitMin1 || this.angle2 > limitMin2){
						this.mouth = -1;
					}
					if (this.angle1 >= limitMax1 || this.angle2 <= limitMax2){
						this.mouth = 1;
					}
				}
			}
		}
		this.stop = function() {
			this.dirX = 0;
			this.dirY = 0;
		}
		this.reset = function() {
			this.unfreeze();
			this.posX = 0;
			this.posY = 6*2*this.radius;
			this.setDirection(right);
			this.stop();
			this.stuckX = 0;
			this.stuckY = 0;
		}
		this.dieAnimation = function() {
			this.angle1 += 0.05;
			this.angle2 -= 0.05;
			if (this.angle1 >= this.direction.angle1+0.7 || this.angle2 <= this.direction.angle2-0.7) {
				this.dieFinal();
			}
		}
		this.die = function() {
			Sound.play("die");
			this.freeze();
			this.dieAnimation();
		}
		this.dieFinal = function() {
			this.reset();
			pinky.reset();
			inky.reset();
			blinky.reset();
			clyde.reset();
    		this.lives--;
	    	if (this.lives <= 0) {
				var input = "</br></br><span class='button' id='dieFinal'>New Game</span>";
				game.showMessage("Game over","Total Score: "+game.score.score+input);
				game.gameOver = true;
			}
			game.drawHearts(this.lives);
		}
		this.getGridPosX = function() {
			return (this.posX - (this.posX % 30))/30;
		}
		this.getGridPosY = function() {
			return (this.posY - (this.posY % 30))/30;
		}
	}
	pacman.prototype = new Figure();
	var pacman = new pacman();
	game.buildWalls();

	// Action starts here:
	
	function hideAdressbar() {
		$("html").scrollTop(1);
		$("body").scrollTop(1);
	}
	
	$(document).ready(function() {	
	
		$.ajaxSetup({ mimeType: "application/json" });
		
		$.ajaxSetup({beforeSend: function(xhr){
			if (xhr.overrideMimeType){
				xhr.overrideMimeType("application/json");
				}
			}
		});
		
		// Hide address bar
		hideAdressbar();

		/* -------------------- EVENT LISTENERS -------------------------- */

		// --------------- Controls
		
		// Keyboard
		window.addEventListener('keydown',doKeyDown,true);
		
		$('#canvas-container').click(function() {
			if (!(game.gameOver == true))	game.pauseResume();
		});

		// Hammerjs Touch Events
		/*Hammer('#canvas-container').on("tap", function(event) {
			if (!(game.gameOver == true))	game.pauseResume();
		});*/
		Hammer('.container').on("swiperight", function(event) {
			if ($('#game-content').is(":visible")) {
				event.gesture.preventDefault();
				pacman.directionWatcher.set(right);
			}
		});
		Hammer('.container').on("swipeleft", function(event) {
			if ($('#game-content').is(":visible")) {
				event.gesture.preventDefault();
				pacman.directionWatcher.set(left);
			}
		});
		Hammer('.container').on("swipeup", function(event) {
			if ($('#game-content').is(":visible")) {
				event.gesture.preventDefault();
				pacman.directionWatcher.set(up);
			}
		});
		Hammer('.container').on("swipedown", function(event) {
			if ($('#game-content').is(":visible")) {
				event.gesture.preventDefault();
				pacman.directionWatcher.set(down);
			}
		});
		
		// Menu
		$(document).on('click','.button#newGame',function(event) {
			game.newGame(0);
		});
		$(document).on('click','.button#dieFinal',function(event) {
			game.newGame(1);
		});
		$(document).on('click','.button#instructions',function(event) {
		    game.showContent('instructions-content');
		});
		// back button
		$(document).on('click','.button#back',function(event) {
			game.showContent('game-content');
		});
		// toggleSound
		$(document).on('click','.controlSound',function(event) {
			game.toggleSound();
		});

		context = canvas.getContext("2d");
        
        game.init(0);
		
		renderContent();
	});
		
	function renderContent(){
		// Refresh Score
		game.score.refresh(".score");
					
		// Pills
		context.beginPath();
		context.fillStyle = "White";
		context.strokeStyle = "White";
		context.scale(scale,scale);
		
		var dotPosY;
		$.each(game.map.posY, function(i, item) {
			dotPosY = this.row;
		   $.each(this.posX, function() { 
			   if (this.type == "pill") {
				context.arc(game.toPixelPos(this.col-1)+pacman.radius,game.toPixelPos(dotPosY-1)+pacman.radius,game.pillSize,0*Math.PI,2*Math.PI);
				context.moveTo(game.toPixelPos(this.col-1), game.toPixelPos(dotPosY-1));
			   }
			   else if (this.type == "powerpill") {
				context.arc(game.toPixelPos(this.col-1)+pacman.radius,game.toPixelPos(dotPosY-1)+pacman.radius,game.powerpillSizeCurrent,0*Math.PI,2*Math.PI);
				context.moveTo(game.toPixelPos(this.col-1), game.toPixelPos(dotPosY-1));
			   }
		   }); 
		});
		context.fill();
		
		// Walls
		context.drawImage(canvas_walls, 0, 0);
		
		if (game.running == true) {
			// Ghosts
			pinky.draw(context);
			blinky.draw(context);
			inky.draw(context);
			clyde.draw(context);
			
			// Pac Man
			context.beginPath();
			context.fillStyle = "Yellow";
			context.strokeStyle = "Yellow";
			context.arc(pacman.posX+pacman.radius,pacman.posY+pacman.radius,pacman.radius,pacman.angle1*Math.PI,pacman.angle2*Math.PI);
			context.lineTo(pacman.posX+pacman.radius, pacman.posY+pacman.radius);
			context.stroke();
			context.fill();
		}
	}
	
	function animationLoop(){
		canvas.width = canvas.width;
		renderContent();
		
		if (game.dieAnimation == 1) pacman.dieAnimation();
		if (game.pause != true){
			// Make changes before next loop
			pacman.move();
			pacman.eat();
			pacman.checkDirectionChange();
			pacman.checkCollisions();		// has to be the LAST method called on pacman			
			blinky.move();			
			inky.move();			
			pinky.move();			
			clyde.move();			
			game.checkGhostMode();		
		}					
		//requestAnimationFrame(animationLoop);		
		setTimeout(animationLoop, game.refreshRate);	
	}

	function doKeyDown(evt){
		switch (evt.keyCode){
			case 38:	// UP Arrow Key pressed
				evt.preventDefault();
			case 87:	// W pressed
				pacman.directionWatcher.set(up);
				break;
			case 40:	// DOWN Arrow Key pressed
				evt.preventDefault();
			case 83:	// S pressed 
				pacman.directionWatcher.set(down);
				break;
			case 37:	// LEFT Arrow Key pressed
				evt.preventDefault();
			case 65:	// A pressed
				pacman.directionWatcher.set(left);
				break;
			case 39:	// RIGHT Arrow Key pressed
				evt.preventDefault();
			case 68:	// D pressed
				pacman.directionWatcher.set(right);
				break;
			case 77:	// M pressed
				game.toggleSound();
				break;
			case 8:		// Backspace pressed -> show Game Content
			case 32:	// SPACE pressed -> pause Game
                evt.preventDefault();
				if (!(game.gameOver == true) 
					&& $('#game-content').is(':visible')
					)	game.pauseResume();
				break;
			}
		}
}

pacmanGame();

