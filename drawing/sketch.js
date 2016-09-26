var myCanvas;
var btn_eraser,btn_pen,btn_next;
var tempImg;
var strokeColor;
var mode;
var erasing = false;

// window.addEventListener('load',init);

// function init(){
// 	btn_next = window.document.getElementById("btn_next");
// 	btn_next.addEventListener('click',
// 		function());
// }

function setup() {
	// var myCanvas = createCanvas(window.innerWidth*2/3, window.innerHeight*2/3);
	myCanvas = createCanvas(750,500);
    myCanvas.parent("maincanvas");
    strokeColor=0;
    background(200);
	btn_eraser = select('#btn_eraser');
  	btn_pen = select('#btn_pen');
  	btn_next = select('#btn_next');
  	// btn_next.mousePressed(nextCanvas);
  	btn_eraser.mousePressed(eraserMode);
  	btn_pen.mousePressed(penMode);
  	mode = 1;
}

function draw() {
	// btn_next.mousePressed(nextCanvas);
	if(strokeColor==200 && mouseIsPressed){
		push();
		noStroke();
		fill(200);
		ellipse(mouseX,mouseY,10,10);
		pop();
	}
	stroke(0);

	
	strokeWeight(3);
	if(mode==1){
		line(width/3,height,width/3,height-10);
		line(width*2/3,height,width*2/3,height-10);
	}	
	if(mode==2){
		line(width/3,height,width/3,height-10);
		line(width*2/3,height,width*2/3,height-10);
		line(width/3,0,width/3,10);
		line(width*2/3,0,width*2/3,10);
	}
	if(mode==3){
		line(width/3,0,width/3,10);
		line(width*2/3,0,width*2/3,10);
	}


	
}

function eraserMode(){
	push();
	console.log("erase!");
	strokeWeight(3);
	strokeColor=200;
	pop();
	erasing = true;
}

function penMode(){
	strokeColor=0;
	console.log("draw!");
	erasing = false;
}

function nextCanvas(){
	console.log("next!");
	// save(myCanvas,"head.jpg");
	tempImg = createGraphics(800,500);
	push();
	fill(200);
	noStroke();
	rect(0,0,800,500);
	pop();
	mode++;
}

function mouseDragged(){
	strokeWeight(3);
	if(erasing){
		strokeWeight(50);
	}
	stroke(strokeColor);
	line(mouseX,mouseY,pmouseX,pmouseY);
	console.log("1");
	// return false;
}

// function windowResized() {
// 	resizeCanvas(window.innerWidth*2/3, window.innerHeight*2/3);
// }