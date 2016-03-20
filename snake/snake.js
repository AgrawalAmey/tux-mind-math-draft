function snake(){
	//scaling canvas and the overlay
	var canvas = $("#snakeCanvas")[0];
	var scale=window.innerHeight*0.75/450;
	var ctx = canvas.getContext("2d");
	canvas.width*=scale;
	canvas.height*=scale;
	canvas.style.height=canvas.height+'px';
	canvas.style.width=canvas.width+'px';
	var overlay = $("#canvas-overlay-container").get(0);
	overlay.style.width=canvas.width+'px';
	overlay.style.left= (document.getElementById("canvas-container").offsetWidth-canvas.width)/2+'px';
	
	var side = canvas.width;
	var cw = side/20;

	var questionsData ="data/questions.json";

	var game;
	var food=new Array();
	var snake;

	function Game(){
		this.direction;
		this.score;
		this.running = false;
		this.pause = true;
		this.score=new Score();
		this.refreshRate=60;
		this.newGame = function(option) {
			var r=1;
			if(!option){
				r = confirm("Are you sure you want to restart?");
			}
            if (r) {
                this.init();
                this.pauseResume();
            }
		};
		this.pauseResume = function () {
			if (!this.running) {
				this.pause = false;
				this.running = true;
				this.closeMessage();
				animationLoop();
			}else if (this.pause) {
				this.pause = false;
				this.closeMessage();
			}else {
				this.showMessage("Pause","Click to Resume");
			}
		};
		this.showMessage = function(title, text) {
			this.pause = true;
			$('#canvas-overlay-container').fadeIn(200);
			$('#canvas-overlay-content #title').text(title);
			$('#canvas-overlay-content #text').html(text);
		};
		this.closeMessage = function() {
			$('#canvas-overlay-container').fadeOut(200);
		};
		this.setQuestion=function(){
			do{
				this.questionNumber= Math.floor(Math.random() * 4);
			}while(game.currentQuestion && game.question.que[this.level][this.questionNumber].solved==true);
			game.currentQuestion=game.question.que[this.level][this.questionNumber];
			document.getElementById('question').innerHTML= game.currentQuestion.equation;
		};
		this.setFood=function(){
			this.setQuestion();
			if(this.foodNumber==0){
				food[0]=new Food(this.questionNumber);
				food[1]=new Food((this.questionNumber+1)%3);
				this.foodNumber+=2;
			}else{
				if(food[0].eaten){
					food[0]=new Food(this.questionNumber);
				}else{
					food[1]=new Food(this.questionNumber);
				}
				this.foodNumber++;
			}
		}
		this.showContent = function (id) {
			$('.content').hide();
			$('#'+id).show();
		};
		this.init=function(){
			this.direction = "right"; //default game.directionection
			this.level=0;
			this.foodNumber=0;
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
			console.log(game.question);
			snake=new Snake();
			this.setFood();
			this.score.set(0);
		};
		this.check=function(){
			if(this.foodNumber==4){
				this.level++;
				this.foodNumber=0;
			}
		}
	}
	
	function Score() {
		this.score = 0;
		this.set = function(i) {
			this.score = i;
		};
		this.add = function(i) {
			this.score += i;
		};
		this.refresh = function(h) {
			$('.score').html("Score: "+this.score);
		};
	}

	function Snake(){
		this.length = 5;
		this.snakeArray = [];
		for(var i = this.length-1; i>=0; i--){
			//Set values for a horizontal snake starting from the top left
			this.snakeArray.push({x: i, y:0});
		};
		this.checkCollision =function(x,y,array){
			//This function will check if the provided x/y coordinates exist
			//in an array of cells or not
			for(var i = 0; i < array.length; i++){
				if(array[i].x == x && array[i].y == y)
					return true;
			}
			return false;
		};
		this.move=function(){
			var i;
			var tail;
			var nx = this.snakeArray[0].x;
			var ny = this.snakeArray[0].y;
	
			if(game.direction == "right") nx++;
			else if(game.direction == "left") nx--;
			else if(game.direction == "up") ny--;
			else if(game.direction == "down") ny++;
			
			//Collison check
			if(nx == -1 || nx == side/cw || ny == -1 || ny == side/cw || this.checkCollision(nx, ny, this.snakeArray)){
				game.init();
				return;
			}
			//If the new head position matches with that of the food,
			//Create a new head instead of moving the tail
			for(i=0;i<2;i++){
				if(nx == food[i].x && ny == food[i].y){
					if(food[i].number==game.currentQuestion.answer){
						tail = {x: nx, y: ny};
						game.score.add(10);
						food[i].eaten=true;
						game.setFood();
						break;
					}else{
						game.init();
						return;
					}
				}
			}
			if(i==2){
					tail = this.snakeArray.pop();
					tail.x = nx; tail.y = ny;
			}		
			this.snakeArray.unshift(tail);
		};
		this.draw=function(){
			for(var i = 0; i < this.snakeArray.length; i++){
				var c = this.snakeArray[i];
				renderCell(c.x, c.y,"blue");
			}
		}
	};
	function Food(que){
		this.x;
		this.y;
		this.number;
		this.createFood=function(){
			this.x=Math.round(Math.random()*(side-cw)/cw);
			this.y= Math.round(Math.random()*(side-cw)/cw); 
			this.number=game.question.que[game.level][que].answer;
		};
		this.draw=function(){
			renderCell(this.x, this.y,"red");
			ctx.font = cw+"px"+" Geometr415 Blk BT";
			ctx.fillStyle = "white";
			ctx.fillText(this.number,cw*(this.x+0.25),cw*(this.y+0.85));
		};
		this.createFood();
	};

	function render(){
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, side, side);
		ctx.strokeStyle = "white";
		ctx.strokeRect(0, 0, side, side);
		
		snake.draw();
		food[0].draw();
		food[1].draw();

		game.score.refresh();
	}

	function renderCell(x, y,color){
		ctx.fillStyle = color;
		ctx.fillRect(x*cw, y*cw, cw, cw);
		ctx.strokeStyle = "white";
		ctx.strokeRect(x*cw, y*cw, cw, cw);
	}

	function animationLoop(){
		if (game.pause != true){
			render();
			game.check();
			snake.move();	
		}
		setTimeout(animationLoop, game.refreshRate);		
	}
	//the keyboard controls
	$(document).keydown(function(e){
		var key = e.which;
		e.preventDefault();
		//We will add another clause to prevent reverse gear
		if(key == "37" && game.direction != "right"){
			game.direction = "left";
		}else if(key == "38" && game.direction != "game.directionown"){
 			game.direction = "up";	
		}else if(key == "39" && game.direction != "left"){
			game.direction = "right";
		}else if(key == "40" && game.direction != "up"){
			game.direction = "down";
		}else if(key =="32"){
			if (!(game.gameOver == true) && $('#game-content').is(':visible')){
				game.pauseResume();
			}
		}
	});
	//Game Pause on click
	$('#canvas-container').click(function() {
		if (!(game.gameOver == true))	game.pauseResume();
	});
	$(document).on('click','.button#instructions',function(event) {
		game.showContent('instructions-content');
	});
	$(document).on('click','.button#newGame',function(event) {
		game.newGame(0);
	});
	$(document).on('click','.button#instructions',function(event) {
		   game.showContent('instructions-content');
	});
	// back button
	$(document).on('click','.button#back',function(event) {
		game.showContent('game-content');
	});
	game = new Game();
	game.init();
};

snake();