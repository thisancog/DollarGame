(function() {

	var settings = {
		nodeColor: '#555',
		nodeRadius: 40,
		edgeColor: '#AAA',
		edgeWidth: 10,
		fontSize: 10,
		bgColor: '#EEE'
	};


	var canvas = document.querySelector('canvas');
	if (!canvas) return;

	var ctx = canvas.getContext('2d'),
		startButton = document.querySelector('#start'),
		nodeCount = document.querySelector('#nodeCount'),
		edgeCount = document.querySelector('#edgeCount'),
		movesCounter = document.querySelector('.moves span'),
		nodes = [],
		nodeClicked, nodeDragged, solved, moves;

	class Node {
		constructor(value = 0, index = 0, x, y) {
			this.value = value;

			this.x = x || Math.random() * canvas.width;
			this.y = y || Math.random() * canvas.height;

			this.limitPosition();

			this.edges = [];
			this.index = index;
		}

		limitPosition() {
			this.x = limit(this.x, 2 * settings.newNodeRadius, canvas.width - 2 * settings.newNodeRadius);
			this.y = limit(this.y, 2 * settings.newNodeRadius, canvas.height - 2 * settings.newNodeRadius);
		}

		addEdge(node) {
			this.edges.push(node);
			nodes[node].edges.push(this.index);
		}

		addValue(val) {
			this.value += val;
		}

		distribute(node) {
			this.edges.forEach(node => nodes[node].addValue(1));
			this.value -= this.edges.length;
		}

		display() {
			this.edges.forEach(function(node) {
				if (node < this.index) return;

				ctx.strokeStyle = settings.edgeColor;
				ctx.lineWidth = settings.newEdgeWidth;
				ctx.beginPath();
				ctx.moveTo(this.x, this.y);
				ctx.lineTo(nodes[node].x, nodes[node].y);
				ctx.stroke();
			}, this);

			ctx.beginPath();
			ctx.arc(this.x, this.y, settings.newNodeRadius, 0, 2 * Math.PI);
			ctx.fillStyle = settings.nodeColor;
			ctx.fill();

			ctx.fillStyle = '#FFF';
			ctx.fillText(this.value, this.x, this.y);
		}
	}



	var resizeBoard = function() {
		canvas.width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 20;
		canvas.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 84;

		settings.newNodeRadius = settings.nodeRadius * 0.5 * canvas.width * canvas.height / Math.pow(10, 6);
		settings.newEdgeWidth = settings.edgeWidth * 0.5 * canvas.width * canvas.height / Math.pow(10, 6);
		settings.fontSize = settings.newNodeRadius;
	}

	var setupGame = function() {
		solved = false;
		nodeClicked = false;
		nodeDragged = false;
		moves = 0;
		movesCounter.innerText = 0;

		ctx.font = settings.fontSize + 'px Helvetica';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		var n = parseInt(nodeCount.value),
			e = parseInt(edgeCount.value),
			g = n + e + 1,
			d = Math.round(Math.random() * 0.1 * g) + g;

		// Generate values
		var values = Array(n).fill(0);

		while (values.reduce((acc, val) => acc + val) < g || values.filter(n => n < 0).length === 0) {
			var remainder = d;

			values = Array(n).fill(null).map((_, i) => {
				var size = n,
					val = - Math.round((Math.random()) * size);

				if (i > 0 && i < n - 1) {
					val = val * (Math.sign(Math.random() - 0.5));	
				} else {
					val = remainder;
				}
				
				remainder -= val;
				return val;
			});
		}

		// Add nodes
		nodes = Array(parseInt(n)).fill(null).map((_, i) => new Node(0, i));

		// Add edges
		for (var i = 0; i < n - 1; i++) {
			nodes[i].addEdge(i + 1);
		}

		for (var i = 0; i < e - n + 1; i++) {
			var a = Math.floor(Math.random() * nodes.length),
				b = a;

			while (a === b || nodes[a].edges.indexOf(b) > -1) {
				a = Math.floor(Math.random() * nodes.length);
				b = Math.floor(Math.random() * nodes.length);
			}
			nodes[a].addEdge(b);
		}

		var order = nodes.map((n, i) => i);
		order.sort((a, b) => nodes[a].edges.length - nodes[b].edges.length);
		order.forEach((n, i) => nodes[n].value = values[i]);
	
		updateBoard();
	}

	var getClickedNode = function(x, y) {
		for (var i = 0; i < nodes.length; i++) {
			var distSq =  Math.pow(x - nodes[i].x, 2) + Math.pow(y - nodes[i].y, 2);
			if (distSq <= Math.pow(settings.newNodeRadius, 2)) return i;
		};

		return false;
	}


	var checkScore = function() {
		moves++;
		movesCounter.innerText = moves;

		if (nodes.filter(node => node.value < 0).length === 0) {
			ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#000';

			ctx.font = (settings.fontSize * 3) + 'px Helvetica';
			ctx.fillText('Game solved in ' + moves + ' moves!', 0.5 * canvas.width, 0.5 * canvas.height);

			solved = true;
		}
	}

	var limit = function(x, min, max) {
		return Math.min(Math.max(x, min), max);
	}



	/************************
		Canvas actions
	 ************************/

	var canvasMouseDown = function(e) {
		nodeClicked = getClickedNode(e.offsetX, e.offsetY);
	}

	var canvasMouseMove = function(e) {
		if (nodeClicked === false) return;

		nodeDragged = true;

		nodes[nodeClicked].x = e.offsetX;
		nodes[nodeClicked].y = e.offsetY;
		nodes[nodeClicked].limitPosition();
		updateBoard();
	}

	var canvasMouseUp = function(e) {
		if (solved) return setupGame();

		if (nodeClicked === false) return;

		if (nodeDragged) {
			nodes[nodeClicked].x = e.offsetX;
			nodes[nodeClicked].y = e.offsetY;
		} else {
			nodes[nodeClicked].distribute();
			checkScore();
		}

		nodeClicked = false;
		nodeDragged = false;

		updateBoard();
	}


	/************************
		Game core logic
	 ************************/

	var updateSettings = function() {
		let n = parseInt(nodeCount.value),
			e = parseInt(edgeCount.value),
			min = n - 1,
			max = Math.min(1000, 0.5 * n * (n - 1));

		if (n > e + 1) e = min;
		if (e > max) e = max;

		edgeCount.min = min;
		edgeCount.max = max;		
		edgeCount.value = e;
	}

	var addEvents = function() {
		startButton.addEventListener('click', setupGame);
		nodeCount.addEventListener('input', updateSettings);
		edgeCount.addEventListener('input', updateSettings);

		canvas.addEventListener('mousedown', canvasMouseDown);
		canvas.addEventListener('mousemove', canvasMouseMove);
		canvas.addEventListener('mouseup', canvasMouseUp);
	}

	var updateBoard = function() {
		if (solved) return;

		ctx.fillStyle = settings.bgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		nodes.forEach(node => node.display());
	}


	var init = function() {
		console.log('v1.11');
		ctx.webkitImageSmoothingEnabled = true;

		resizeBoard();
		addEvents();
		setupGame();
	};

	init();

})();