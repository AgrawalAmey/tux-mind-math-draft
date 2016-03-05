"use strict";

function pacmanGame() {
/* ----- Global Variables ---------------------------------------- */
	var canvas;
	var joystick;
	var context;
	var game;
	var canvas_walls, context_walls;
	var inky, blinky, clyde, pinky;

	var mapConfig = "data/map.json";
	var questionsData ="data/questions.json"

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
		this.canvas = $("#myCanvas").get(0);
		this.wallColor = "Blue";
		this.width = this.canvas.width;
		this.height = this.canvas.height;

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

		this.svgData= {};
		this.getSvgData= function(color,number){
			var data= '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 593 620" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd"><defs><font id="FontID0" horiz-adv-x="591" font-weight="400" fill-rule="nonzero"><font-face font-family="Bauhaus 93"/><glyph unicode="3" horiz-adv-x="568"><path d="M106.998 666.998h352.997L351.172 410.83c38.996-26.334 67.497-55.325 85.162-86.824 17.828-31.5 26.66-68.833 26.66-111.837 0-64.336-23.498-118.666-70.66-162.843-47.174-44.162-105.17-66.324-174.167-66.324-38 0-75.84 7.333-113.173 21.835v188.834c28.338-17.842 52.846-26.675 73.672-26.675 22.668 0 41.832 8.165 57.166 24.508 15.497 16.33 23.172 36.666 23.172 60.832 0 27.655-11.505 49.832-34.677 66.324-23.157 16.508-54.166 24.673-92.82 24.673l49.163 131.67h-73.672v191.995z"/></glyph><glyph unicode="0" horiz-adv-x="568"><path d="M46.002 260.34v146.497c0 85.325 21.168 152.66 63.667 202C152.17 658.33 210 683 283.332 683c73.167 0 131-24.67 173.662-74.162 42.678-49.342 64.01-116.676 64.01-202v-146.5c0-85.502-21.332-153-64.01-202.668C414.334 7.838 356.5-16.997 283.332-16.997c-73.33 0-131.163 24.835-173.663 74.667C67.17 107.34 46 174.836 46 260.34zm189.992 185.656V221.328c0-40.822 15.84-61.322 47.34-61.322 31.84 0 47.664 20.5 47.664 61.322v224.668c0 40.673-15.824 61.01-47.665 61.01-31.5 0-47.34-20.337-47.34-61.01z"/></glyph><glyph unicode="8" horiz-adv-x="568"><path d="M447.837 382.493c27.833-28.664 46.997-55.16 57.492-79.165 10.51-24.166 15.674-53.498 15.674-87.996 0-66.16-22.503-121.5-67.675-165.825-45.157-44.34-101.49-66.503-169.003-66.503-67.823 0-124.32 22.163-169.492 66.503-45.17 44.325-67.838 99.664-67.838 165.825 0 33.503 5.507 62.835 16.507 87.996 10.836 25.013 29.822 51.51 56.66 79.165-24.166 31.84-36.16 67.334-36.16 106.344 0 56.334 18.66 102.663 56.156 139.328C177.67 664.667 225.336 683 283.333 683c58.5 0 106.67-18.17 144.33-54.672C465.16 592.004 484 545.334 484 488.332c0-38.328-11.994-73.672-36.16-105.84zm-165.84 157.513c-14.666 0-27.328-5.344-38-16.165-10.66-10.672-16.004-23.335-16.004-37.674 0-16.492 5.18-30.327 15.676-41C254.163 434.33 267.67 429 284 429c14.667 0 27.33 5.508 38.002 16.67 10.66 11 16.002 24.167 16.002 39.16 0 15.497-5.343 28.664-16.165 39.337-10.837 10.495-24.167 15.84-39.843 15.84zm1.01-248.003c-22.178 0-41.342-7.838-57.18-23.335C210 253.17 202 234.333 202 212.498c0-24.004 7.66-43.836 22.995-59.66 15.512-15.84 34.84-23.84 58.01-23.84 23.16 0 42.5 8 57.998 23.84 15.334 15.824 22.994 35.656 22.994 59.66 0 21.508-8 40.168-24.003 56.007-16.166 15.66-34.988 23.498-56.988 23.498z"/></glyph><glyph unicode="5" horiz-adv-x="568"><path d="M464.997 666.998V475.002H300.834l-8.67-30.342c59.838-17.16 104.163-42.157 132.842-74.666 39.322-44.325 58.99-97.334 58.99-159.324 0-65.508-24.002-119.838-71.994-163.005-48.006-43.168-108.497-64.662-181.5-64.662-49.165 0-97.676 13.004-145.505 38.996v164c38.165-18.66 71.67-27.997 100.674-27.997 30.002 0 53.663 6.828 71.165 20.5 17.5 13.834 26.17 32.494 26.17 55.992 0 26.334-13.508 48.838-40.346 67.007-26.825 18.333-59.987 27.492-99.488 27.492-15.007 0-34.84-2.82-59.674-8.654L155.33 667h309.667z"/></glyph><glyph unicode="2" horiz-adv-x="568"><path d="M519.995 193.005V0H89.333l214.5 401.167 7.333 13.672c5.834 10.657 8.832 21.167 8.832 31.662 0 26.333-15.497 39.5-46.67 39.5-12.157 0-22.83-4.498-31.826-13.33-8.996-8.832-13.508-19.342-13.508-31.336 0-13.51 5.833-25.83 17.68-36.83L160.17 252.16c-35.834 22.014-63.162 50.174-82.34 84.345C58.664 370.662 49 408.5 49 449.663c0 64.172 22.668 119.007 67.84 164.83C162.174 660.17 216.83 683 281.003 683c64.498 0 119.333-22.667 164.326-67.838 45.17-45.156 67.674-100.17 67.674-164.994 0-37.007-8.343-71.505-24.998-103.494l-79.343-153.668h111.332z"/></glyph><glyph unicode="7" horiz-adv-x="568"><path d="M509.664 666.998L315.827 0H113.173L264.17 475.002H60v191.996h449.664z"/></glyph><glyph unicode="4" horiz-adv-x="568"><path d="M529.006 666.998V0H341.003v508.996l-82-164.994h41v-145H39.827L237.004 667h292.002z"/></glyph><glyph unicode="1" horiz-adv-x="568"><path d="M379.004 666.998V0H190.007v666.998h188.997z"/></glyph><glyph unicode="9" horiz-adv-x="568"><path d="M391.162-19.505L215.836 42.5 345.664 406.33c3.503 10.332 5.33 19.832 5.33 28.338 0 17.5-6.488 32.657-19.49 45.334-13.005 12.663-28.34 19-46.167 19-18.006 0-33.177-6.338-45.676-19.178-12.498-12.825-18.658-28.16-18.658-46.33 0-18.495 6.16-33.992 18.66-46.49 12.498-12.678 27.832-19.002 46-19.002 4.01 0 10.17.668 18.497 1.826l-78.987-191.49C155.835 208.502 106.003 243 75.66 281.832 45.17 320.503 30 368.835 30 426.67c0 71.994 24.67 132.662 74 182.168C153.325 658.328 213.83 683 285.5 683c67.66 0 126.83-24.834 177.493-74.503 50.678-49.67 76.002-107.666 76.002-173.99 0-30.847-11.83-79.002-35.656-144.51L391.16-19.504z"/></glyph><glyph unicode="6" horiz-adv-x="568"><path d="M177.67 686.504L352.998 624.5l-129.16-365.007c-3.83-10.494-5.834-19.832-5.834-27.996 0-17.5 6.502-32.657 19.49-45.498 13.004-12.663 28.338-19 46.166-19 18.005 0 33.176 6.5 45.675 19.34 12.5 12.99 18.66 28.665 18.66 46.998 0 18.17-6.324 33.83-18.823 46.492-12.677 12.84-27.833 19.164-45.84 19.164-4.334 0-10.672-.653-19.163-1.99l79.668 191.492c68.996-30 118.828-64.498 149.333-103.494 30.49-38.833 45.825-87.166 45.825-144.836 0-72.336-24.656-133.33-73.998-182.837-49.328-49.492-109.833-74.326-181.5-74.326-67.662 0-126.83 24.834-177.494 74.503C55.34 107.34 30 165.337 30 231.837c0 30.67 11.83 78.824 35.67 144.66l112 310.007z"/></glyph></font><style>@font-face{font-family:&quot;Bauhaus 93&quot;;src:url(&quot;#FontID0&quot;) format(svg)}.fil1{fill:#fff}.fil0{fill:'+color+'}.fnt0{font-weight:400;font-size:265.22px;font-family:&apos;Bauhaus 93&apos;}</style></defs><g id="Layer_x0020_1"><path id="Blinky" class="fil0" d="M17 597C4 579 0 545 1 448 1 221 23 137 102 66 156 17 207 0 303 0c66 0 88 5 140 31 115 59 141 126 148 386 4 147 3 158-17 176-27 25-57 16-112-30-24-20-47-37-52-37s-28 19-50 42c-23 23-49 41-59 41-9 0-40-18-68-41-56-47-67-50-88-25-18 22-93 77-104 77-4 0-15-11-24-23z"/><text x="52" y="368" class="fil1 fnt0">'+number+'</text></g></svg>';
            return data;
		}
		this.populateSvgData=function(){
			game.svgData['pinky']=game.getSvgData('pink',game.question.que[game.level][0].answer);
			game.svgData['blinky']=game.getSvgData('red',game.question.que[game.level][1].answer);
			game.svgData['inky']=game.getSvgData('blue',game.question.que[game.level][2].answer);
			game.svgData['clyde']=game.getSvgData('orange',game.question.que[game.level][3].answer);
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
			var maxX = game.width / 30 -1;
			var maxY = game.height / 30 -1;
			if (x < 0) x = maxX + x;
			if (x > maxX) x = x-maxX;
			if (y < 0) y = maxY + y;
			if (y > maxY) y = y-maxY;
			return this.map.posY[y].posX[x].type;
		};

		this.setMapContent = function (x,y,val) {
			this.map.posY[y].posX[x].type = val;
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
			console.log("Hello");
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
	
			if (state === 0) {
				this.score.set(0);
				this.score.refresh(".score");
				pacman.lives = 3;
				game.level = 0;
				this.refreshLevel(".level");
				game.gameOver = false;
				pinky.dead=false;
				inky.dead=false;
				blinky.dead=false;
				clyde.dead=false;
			}
			pacman.reset();
			
			game.drawHearts(pacman.lives);	
			
			this.ghostMode = 0;			// 0 = Scatter, 1 = Chase
			this.ghostModeTimer = 200;	// decrements each animationLoop execution
		};

		this.allGostDead=function(){
			if(	pinky.dead &&
				inky.dead &&
				blinky.dead &&
				clyde.dead){
				return true;
			}
		}

		this.check = function() {
		if ((this.pillCount === 0 || game.allGostDead()) && game.running) {
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
				if (this.posX <= 0-this.radius) this.posX = game.width-this.speed-this.radius;
				if (this.posY >= game.height-this.radius) this.posY = this.speed-this.radius;
				if (this.posY <= 0-this.radius) this.posY = game.height-this.speed-this.radius;
			}
		}
			
		this.checkCollision = function() {  
			/* Check Back to Home */
			if (this.dead && (this.getGridPosX() == this.startPosX /30) && (this.getGridPosY() == this.startPosY / 30)) this.reset();
			else {
				/* Check Ghost / Pacman Collision			*/
				if ((between(pacman.getCenterX(), this.getCenterX()-10, this.getCenterX()+10)) 
					&& (between(pacman.getCenterY(), this.getCenterY()-10, this.getCenterY()+10)))
				{
					if (!this.dead) {
						if(game.currentQuestion){
							if(!(this.number==game.currentQuestion.answer)){
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
			if (this.dead) {			// go Home
				// var tX = this.startPosX / 30;
				// var tY = this.startPosY / 30;
			}
			else if (game.ghostMode == 0) {			// Scatter Mode
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
			
			if (this.dead) {
				// for (var i = dirs2.length-1; i >= 0; i--) {
				// 	if ((dirs2[i].field != "wall") && !(dirs2[i].dir.equals(this.getOppositeDirection()))) {
				// 	r = dirs2[i].dir;
				// 	}
				// }
			}
			else {
				for (var i = dirs2.length-1; i >= 0; i--) {
					if ((dirs2[i].field != "wall") && (dirs2[i].field != "door") && !(dirs2[i].dir.equals(this.getOppositeDirection()))) {
						r = dirs2[i].dir;
						}
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
								game.map.posY[gridY].posX[gridX].type = "null";
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
						if (y >= game.heigth/(this.radius*2)) y = 0;
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
			pinky.reset(0);
			inky.reset(0);
			blinky.reset(0);
			clyde.reset(0);
    		this.lives--;
	    	if (this.lives <= 0) {
				var input = "</br></br><span class='button' id='dieFinal'>New Game</span>";
				game.showMessage("Game over","Total Score: "+game.score.score+input);
				game.gameOver = true;
				$('#playerName').focus();
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

		canvas = $("#myCanvas").get(0);
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
	
	function renderGrid(gridPixelSize, color){
		context.save();
		context.lineWidth = 0.5;
		context.strokeStyle = color;
		
		// horizontal grid lines
		for(var i = 0; i <= canvas.height; i = i + gridPixelSize){
			context.beginPath();
			context.moveTo(0, i);
			context.lineTo(canvas.width, i);
			context.closePath();
			context.stroke();
		}
		
		// vertical grid lines
		for(var i = 0; i <= canvas.width; i = i + gridPixelSize){
			context.beginPath();
			context.moveTo(i, 0);
			context.lineTo(i, canvas.height);
			context.closePath();
			context.stroke();
		}
		context.restore();
	}
	
	function animationLoop(){
		canvas.width = canvas.width;
		//renderGrid(pacman.radius, "red");
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
		// All dots collected?		
		game.check();				
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

