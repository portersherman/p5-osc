// consts
const maxLifetime = 1000;
const maxChainLength = 50;
const alignTime = 100;
const spawnProb = 0.00625;
const dispLength = 1000;

// p5
var arrow;
var maxSize;
var remainderX, remainderY, sizeX, sizeY;
var angles, touched, touchedAt, ripple, poles, holes;
var spawns;
var relAnglesPoles, relAnglesHoles;
var startX, startY;
var controllerX, controllerY;
var start;
var nodeSize, globalColor;
var mode;
var arrowSize;
var manip;
var oscs, filter;
var intOsc, trigOsc, crossOsc, spawnOsc;
var intEnv, trigEnv, crossEnv, spawnEnv;

function preload() {
	arrow = "↣";
}

function setup() {
  	createCanvas(windowWidth, windowHeight);
	noCursor();
  	startX = 0;
	startY = 0;
	angles = [];
	touched = [];
	touchedAt = [];
	ripple = [];
	poles = [];
	holes = [];
	oscs = {};
	mode = "prod";
	processURL(new URL(window.location.href));
	start = (mode == "dev");
	// nodeSize = (arrowSize == "lg") ? 100 : 75;
	// maxSize = (arrowSize == "lg") ? 150 : 100;
	nodeSize = windowHeight / 12.25
	maxSize = (windowHeight / 12) * 2; 
	spawns = new Chain("spawn", maxChainLength);

	relAnglesPoles = { 	"up": (1/2)*PI,
					"down": (3/2)*PI,
					"left": 0,
					"right": PI };

	relAnglesHoles = { 	"down": (1/2)*PI,
					"up": (3/2)*PI,
					"right": 0,
					"left": PI }

	setupMesh();

	var backVol = 0.4;

	filter = new p5.LowPass();
	filter.freq(350);
	for (var i = 0; i < sizeY; i++) {

		oscs[i] = {};

		var newEnv = new p5.Env();
		newEnv.setADSR(5, 1, backVol, 5);
		newEnv.setRange(backVol, 0);

		oscs[i]["env"] = newEnv;

		var newOsc = new p5.Oscillator();
		newOsc.setType("sawtooth");
		newOsc.freq(midiToFreq((i / sizeY * 12) + 36));
		newOsc.amp(newEnv);
		newOsc.disconnect();
 		newOsc.connect(filter);
		newOsc.start();

		oscs[i]["osc"] = newOsc;
		oscs[i]["playing"] = false;

	}

	var foreVol = 0.5;

	intEnv = new p5.Env();
	intEnv.setADSR(0.125, 0.25, foreVol, 0.125);
	intEnv.setRange(foreVol, 0);
	intOsc = new p5.Oscillator(midiToFreq(67), "sawtooth");
	intOsc.amp(intEnv);
	intOsc.disconnect();
 	intOsc.connect(filter);
 	intOsc.start();

 	spawnEnv = new p5.Env();
	spawnEnv.setADSR(0.125, 0.25, foreVol, 0.125);
	spawnEnv.setRange(foreVol, 0);
	spawnOsc = new p5.Oscillator(midiToFreq(69), "sawtooth");
	spawnOsc.amp(spawnEnv);
	spawnOsc.disconnect();
 	spawnOsc.connect(filter);
 	spawnOsc.start();

 	trigEnv = new p5.Env();
	trigEnv.setADSR(0.125, 0.25, foreVol, 0.125);
	trigEnv.setRange(foreVol, 0);
	trigOsc = new p5.Oscillator(midiToFreq(64), "sawtooth");
	trigOsc.amp(trigEnv);
	trigOsc.disconnect();
 	trigOsc.connect(filter);
 	trigOsc.start();

 	crossEnv = new p5.Env();
	crossEnv.setADSR(0.125, 0.25, foreVol, 0.125);
	crossEnv.setRange(foreVol, 0);
	crossOsc = new p5.Oscillator(midiToFreq(62), "sawtooth");
	crossOsc.amp(crossEnv);
	crossOsc.disconnect();
 	crossOsc.connect(filter);
 	crossOsc.start();

 	filter.disconnect();

 	reverb = new p5.Reverb();
	reverb.process(filter, 8, 37.5);

	controllerX = -1;
	controllerY = -1;
	manip = false;
}

function draw() {
	setColor();
	drawBackground(globalColor);
	if (start) {
		if (mouseIsPressed) {
	  		manipMesh();
		}
		disp();
		spawn();
		drawMesh();
		drawSpawns();
	} else {
		drawWelcome();
	}
	drawCursor();
}

function processURL(url) {
	mode = (url.searchParams.get("mode")) ? url.searchParams.get("mode") : "prod";
	// arrowSize = (url.searchParams.get("size")) ? url.searchParams.get("size") : "lg";
}

function setupMesh(oldAngles, oldTouched, oldTouchedAt, oldRipple, oldPoles, oldHoles) {
	remainderX = windowWidth % nodeSize;
  	remainderY = windowHeight % nodeSize;
  	sizeX = Math.floor(windowWidth / nodeSize);
  	sizeY = Math.floor(windowHeight / nodeSize);
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		if (oldAngles) {
	  			if (oldAngles[sizeX*j + i]) {
	  				angles[sizeX*j + i] = oldAngles[sizeX*j + i];
	  			} else {
	  				angles[sizeX*j + i] = Math.random() * (2*PI);
	  			}
	  		} else {
  				angles[sizeX*j + i] = Math.random() * (2*PI);
  			}

  			if (oldTouched) {
	  			touched[sizeX*j + i] = oldTouched[sizeX*j + i];
	  		} else {
				touched[sizeX*j + i] = false;
	  		}

	  		if (oldTouchedAt) {
	  			touchedAt[sizeX*j + i] = oldTouchedAt[sizeX*j + i];
	  		} else {
	  			touchedAt[sizeX*j + i] = -1;
	  		}

	  		if (oldRipple) {
	  			ripple[sizeX*j + i] = oldRipple[sizeX*j + i];
	  		} else {
				ripple[sizeX*j + i] = false;
	  		}

	  		if (oldPoles) {
	  			poles[sizeX*j + i] = oldPoles[sizeX*j + i];
	  		} else {
				poles[sizeX*j + i] = (Math.random() < 0.01);
	  		}

	  		if (oldHoles) {
	  			holes[sizeX*j + i] = oldHoles[sizeX*j + i];
	  		} else {
				holes[sizeX*j + i] = (Math.random() < 0.01);
	  		}
	  	}
	}
}

function drawBackground(color) {
	var r, g, b;
	r = color.levels[0];
	g = color.levels[1];
	b = color.levels[2];
	if (mode == "dev") {
		background(color);
		return;
	}
	if (frameCount < dispLength/3) {
		background(	r + ((255 - r)*(1 - (frameCount)/(dispLength/3))), 
					g + ((255 - g)*(1 - (frameCount)/(dispLength/3))),
					b + ((255 - b)*(1 - (frameCount)/(dispLength/3))));
	} else if (frameCount < 2*dispLength/3) {
		background(r, g, b);
	} else if (frameCount < dispLength) {
		background(	r + ((255 - r)*((frameCount - 2*dispLength/3)/(dispLength/3))), 
					g + ((255 - g)*((frameCount - 2*dispLength/3)/(dispLength/3))),
					b + ((255 - b)*((frameCount - 2*dispLength/3)/(dispLength/3))));
	} else if (frameCount < dispLength*2) {
		background(	r + ((255 - r)*(1 - (frameCount-dispLength)/(dispLength))), 
					g + ((255 - g)*(1 - (frameCount-dispLength)/(dispLength))),
					b + ((255 - b)*(1 - (frameCount-dispLength)/(dispLength))));
	} else {
		background(color);
	}
}

function drawWelcome() {
	var titleFactor = (.25) * (frameCount) + 200;
	var subTitleFactor = 200;
	if (frameCount < dispLength/3) {
		fill(255, 255*(frameCount)/(dispLength/3));
	} else if (frameCount < 2*dispLength/3) {
		fill(255);
	} else if (frameCount < dispLength) {
		fill(255, 255*(1 - (frameCount-2*dispLength/3)/(dispLength/3)));
	} else {
		start = true;
		return;
	}
	writeCentered("ADRIFT", windowHeight/2 - 15, titleFactor, 50);
	writeCentered("BY PORTER SHERMAN", windowHeight/2 + 35, subTitleFactor, 25);
}

function writeCentered(string, y, factor, size) {
	var length = string.length;
	textAlign(CENTER);
	textSize(size);
	if (factor == 0) {
		text(string, windowWidth/2, y);
		return;
	}
	for (var i = 0; i < length; i++) {
		text(string.charAt(i), windowWidth/2+((i+1/2-length/2)/(length/2)*factor), y);
	}
}

function drawMesh() {
	var fade = (frameCount < dispLength*2);
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		push();
			translate((i+0.5)*nodeSize + remainderX/2, (j+0.5)*nodeSize + remainderY/2);	
			if (holes[sizeX*j+i]) {
				if (fade) {
					stroke(127 + ((128)*(1 - (frameCount-dispLength)/(dispLength))));
				} else {
					stroke(127);
				}
				strokeWeight(3);
				noFill();
				ellipseMode(CENTER);
				ellipse(0, 0, nodeSize/2, nodeSize/2);
			} else if (poles[sizeX*j+i]) {
				noStroke();
				if (fade) {
					fill(127 + ((128)*(1 - (frameCount-dispLength)/(dispLength))));
				} else {
					fill(127);
				}
				ellipseMode(CENTER);
				ellipse(0, 0, nodeSize/2, nodeSize/2);
			} else {
				rotate(angles[sizeX*j + i]);
				imageMode(CENTER);	
				if (touched[sizeX*j+i]) {
					fill(0);
					noStroke();
					textAlign(CENTER);
					textSize(nodeSize);
					text(arrow, 0, nodeSize/4);
				} else {
					if (ripple[sizeX*j+i]) {
						if (fade) {
							fill(127 + ((128)*(1 - (frameCount-dispLength)/(dispLength))));
						} else {
							fill(127);
						}
						noStroke();
						textAlign(CENTER);
						textSize(nodeSize);
						text(arrow, 0, nodeSize/4);
					} else {
						fill(255);
						noStroke();
						textAlign(CENTER);
						textSize(nodeSize);
						text(arrow, 0, nodeSize/4);
					}
				}
			}
	  		pop();
	  	}
  	}
}

function manipMesh() {
	var imgX, imgY;
	imgX = Math.floor((startX - remainderX/2) / nodeSize);
  	imgY = Math.floor((startY - remainderY/2) / nodeSize);
  	if ((imgX >= 0) && (imgY >= 0) && (imgX < sizeX) && (imgY < sizeY) && (manip)) {
  		var delta = (mouseY - startY)/windowHeight;
  		if ((touched[sizeX*imgY + imgX] == false) && (!holes[sizeX*imgY + imgX]) && (!poles[sizeX*imgY + imgX])) {
			oscs[imgY]["osc"].pan((imgX / sizeX - 0.5) * 2);
			if (!oscs[imgY]["playing"]) {
				oscs[imgY]["env"].triggerAttack();
    			oscs[imgY]["playing"] = true;
			}
    	}
    	angles[sizeX*imgY + imgX] += 0.1*delta;
    	angles[sizeX*imgY + imgX] = angles[sizeX*imgY + imgX] % (2*PI);
    	// console.log(angles[sizeX*imgY + imgX]);
    	touched[sizeX*imgY + imgX] = true;
    	touchedAt[sizeX*imgY + imgX] = millis();
    }
}

function drawCursor() {
	noStroke();
	fill(255, 255, 255);
	ellipse(mouseX, mouseY, nodeSize/4, nodeSize/4);
}

function spawn() {
	if (Math.random() < spawnProb) {
		spawnEnv.play();
		spawns.add(Math.random()*(windowWidth - 100) + 50, Math.random()*(windowHeight - 100) + 50, Math.random()*maxSize*0.85 + maxSize*0.15, maxLifetime, globalColor);
	}
}

function drawSpawns() {
	spawns.draw(true, remainderX, remainderY);
}

function precise(x) {
  	return Number.parseFloat(x).toPrecision(4);
}

function clamp255(val) {
	return (val > 255) ? 255 : (val < 0) ? 0 : val;
}

function mousePressed() {
	manip = (!spawns.isIntersected());
	spawns.trig();
	startX = mouseX;
	startY = mouseY;
	return false;
}

function mouseMoved() {
	controllerX = -1;
	controllerY = -1;
	return false;
}

function doubleClicked() {
  	var fs = fullscreen();
   	fullscreen(!fs);
}

function windowResized() {
  	resizeCanvas(windowWidth, windowHeight);
  	setupMesh(angles, touched, touchedAt, ripple, poles, holes);
}

function setColor() {
	globalColor = setGlobalColor(frameCount);
}

function getAngleFromPixel(x, y) {
	indX = Math.floor((x - remainderX/2) / nodeSize);
	indY = Math.floor((y - remainderY/2) / nodeSize);
	// console.log(x + " " + y);
	return angles[sizeX*indY + indX];
}

function getHolesFromPixel(x, y) {
	indX = Math.floor((x - remainderX/2) / nodeSize);
	indY = Math.floor((y - remainderY/2) / nodeSize);
	// console.log(x + " " + y);
	return holes[sizeX*indY + indX];
}

function disp() {
	for (var i = 0; i < sizeX; i++) {
	  	for (var j = 0; j < sizeY; j++) {
	  		var totalDelta = 0;

	  		// up
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+sizeY-1)%sizeY) + i, "up");

	  		// down
	  		totalDelta += propDelta(sizeX*j + i, sizeX*((j+1)%sizeY) + i, "down");

	  		// left
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+sizeX-1)%sizeX), "left");

	  		// right
	  		totalDelta += propDelta(sizeX*j + i, sizeX*j + ((i+1)%sizeX), "right");

  			ripple[sizeX*j+i] = (totalDelta > 0.25);

	  		if ((Math.abs(totalDelta) < 0.3) && (touched[sizeX*j+i] == true)) {
	  			if (millis() - touchedAt[sizeX*j+i] > 5000) {
	  				touched[sizeX*j+i] = false;
	  				if (oscs[j]["playing"]) {
	  					oscs[j]["env"].triggerRelease();
	  					oscs[j]["playing"] = false;
	  				}
	  			}
	  		}
	  	}
	}
}

function propDelta(cur, neighbor, rel) {
	var delta;
	if (poles[neighbor]) {
		delta = relAnglesPoles[rel] - angles[cur];
		angles[cur] += delta;
		return 0;
	} else if (holes[neighbor]) {
		delta = relAnglesHoles[rel] - angles[cur];
		angles[cur] += delta;
		return 0;
	} else {
		delta = angles[neighbor] - angles[cur];
	}
	if (!touched[cur]) {
		if (!touched[neighbor]) {
			angles[cur] += delta / (10 * alignTime);
		} else {
			angles[cur] += delta / alignTime;
		}
	} else {
		angles[cur] += delta / (100 * alignTime);
	}
	return Math.abs(delta);
}