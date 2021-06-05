let nodes = [];
let edges = [];
let numberOfNodes = 0;
let adj = []; // Adjacency matrix for storing graph.
let startId = null;
let endId = null;
let midP; // Initialize the midpoint variable
let algorithmOptions = []; // Stores which algorithm option is selected
let speedOptions = []; // Stores which speed option is selected
let sleepTime = 0; // Number of ms for algorithm to wait before next iteration
let edgeDrawActive = false; // Checks active state of button
let addNodeActive = true;
let startActive = false;
let endActive = false;
let addEdgeActive = false;
let directedActive = false;
let undirectedActive = true;
let weightedActive = false;
let unweightedActive = true;

const nodeRadius = 35;
const weightRadius = 19;
const weightForm = document.getElementById("weight-form"); // Gets the form containg the input field
const weightInput = document.getElementById("weight-input"); // Gets the input field
const canvas = document.querySelector(".canvas");
const ctx = canvas.getContext("2d");

const addNodeButton = document.getElementById("add-node-but");
addNodeButton.classList.add("button-active-background-color");

const startButton = document.getElementById("set-start-node");
startButton.disabled = true;
let startPermanentlyDisable = false; // Bool tracks whether start button is permanently disabled for specified algorithm

const endButton = document.getElementById("set-end-node");
endButton.disabled = true; // Button is disabled at start
let endPermanentlyDisable = false; // Bool tracks whether end button is permanently disabled for specified algorithm

const addEdgeButton = document.getElementById("add-edge-but");
addEdgeButton.disabled = true; // Button is disabled at start

const directedButton = document.getElementById("dir-but");

const undirectedButton = document.getElementById("undir-but");
undirectedButton.classList.add("button-active-background-color"); // undirectedActive is set to true as default

const weighted_button = document.getElementById("weighted-but");

let flowActive = false; // Checks whether a flow graph is required

const unWeightedButton = document.getElementById("unweighted-but");
unWeightedButton.classList.add("button-active-background-color");

const startAlgorithmButton = document.getElementById("start-but");

const maxn = 133; // For simplicity the program will only handle 133 nodes. 133 is the max number of nodes that can fit in canvas.
const defaultWeight = 1000;

for (let row = 0; row < maxn; row++) {
    adj[row] = []; // Creates an empty row in adjacency matrix
    for (let col = 0; col < maxn; col++) {
        adj[row][col] = Infinity; // Infinity means there is no edge linking the two nodes
    }
}

// -- Functions -- //
const distance = (x1, x2, y1, y2) => {
    // Calculates distance between mouse click and node center
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)); // Pythagoras Theorem
};

const midPoint = (x1, x2, y1, y2) => {
    // Calculates the midpoint
    return [(x1 + x2) / 2, (y1 + y2) / 2];
};

const render = () => {
    // Draws the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clears the canvas

    for (edge of edges) {
        edge.initialize(); // Initializes the line
        edge.draw(); // Draws the line
    }

    for (node of nodes) {
        // Redraws remaining nodes
        node.draw();
    }
};

// -- Classes -- //
class Node {
    constructor(x, y, id) {
        this.x = x; // Stores the x-coordinate of node in pixels
        this.y = y; // Stores the y-coordinate of node in pixels
        this.id = id; // Tracks the id of the node
        this.color = "#397EC9"; // Defines the color of the node
    }

    draw() {
        // Draws the node
        ctx.beginPath(); // Starts a new starting point
        ctx.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI); // Draws a circle
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draws id on node.
        ctx.font = "16px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(this.id), this.x, this.y);
    }
}

class Edge {
    constructor(x1, y1, startNodeId) {
        this.startx = x1; // Stores the starting x-position
        this.starty = y1; // Stores the starting y-position
        this.endx = null; // Stores the ending x-position
        this.endy = null; // Stores the ending y-position
        this.startNodeId = startNodeId; // Stores the id of the starting node
        this.endNodeId = null; // Stores the id of the ending node
        this.weight = defaultWeight;
        this.flow = 0; // Sets the default flow input
        this.capacityt = defaultWeight; // Sets the default flow output
        this.drawweight = false; // Boolean specifies if the weight should be drawn
        this.color = "white";
        this.isOffset = false; // Tracks whether the line is offsetted
        this.weightRadius = weightRadius; // Defines the radius of the circle enclosing the weight text
        this.fontSize = 13;
    }

    initialize() {
        ctx.beginPath(); // Initializes the line
        ctx.moveTo(this.startx, this.starty); // Starts the line at the selected node
    }

    draw() {
        ctx.lineTo(this.endx, this.endy); // Draws line at end node
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.stroke(); // Renders the line

        if (directedActive) {
            // If the line is a directed line
            this.drawPointer();
        }

        if (this.drawweight) {
            if (directedActive) {
                midP = midPoint(
                    this.endx + ((this.startx - this.endx) * 3) / 4,
                    this.endx,
                    this.endy + ((this.starty - this.endy) * 3) / 4,
                    this.endy
                );
            } else if (undirectedActive) {
                midP = midPoint(this.startx, this.endx, this.starty, this.endy);
            }

            // Draw the circle //
            ctx.beginPath(); // Start the circle
            ctx.arc(midP[0], midP[1], this.weightRadius, 0, 2 * Math.PI);
            ctx.fillStyle = this.color;
            ctx.fill();

            // Draw the number //
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (flowActive) {
                // If graph is a flow graph
                ctx.fillText(`${this.flow}/${this.capacity}`, midP[0], midP[1]);
            } else {
                ctx.fillText(String(this.weight), midP[0], midP[1]);
            }
        }
    }

    drawPointer() {
        let pointerWidth = 30;
        // Find vector with same slope as edge //
        const edgeVector = [this.startx - this.endx, this.starty - this.endy]; // This vector is oriented reverse of actual direction

        // Scale vector to desired width. This is to offset the start position //
        const edgeVectorLength = distance(edgeVector[0], 0, edgeVector[1], 0);
        const edgeVectorScaled = [
            (edgeVector[0] * nodeRadius) / edgeVectorLength,
            (edgeVector[1] * nodeRadius) / edgeVectorLength,
        ];

        // Find start position of pointer //
        const pointerx = this.endx + edgeVectorScaled[0];
        const pointery = this.endy + edgeVectorScaled[1];

        // Rotate vector by pi/6 radians //
        const x = edgeVector[0];
        const y = edgeVector[1];
        const sin30 = Math.sin(Math.PI / 6);
        const cos30 = Math.cos(Math.PI / 6);
        const vector1 = [x * cos30 + y * sin30, -x * sin30 + y * cos30];

        // Scale vector to desired length //
        const vector1Length = distance(vector1[0], 0, vector1[1], 0);
        const vector1Scaled = [
            (vector1[0] * pointerWidth) / vector1Length,
            (vector1[1] * pointerWidth) / vector1Length,
        ];

        // Find point 1 //
        const p1 = [pointerx + vector1Scaled[0], pointery + vector1Scaled[1]];

        // Find vector perpendicular to edge //
        const sin90 = Math.sin(Math.PI / 2);
        const cos90 = Math.cos(Math.PI / 2);
        const vectorPerpendicular = [
            -x * cos90 - y * sin90,
            x * sin90 - y * cos90,
        ];

        // Scale vector to desired length //
        const vectorPerpendicularLength = distance(
            vectorPerpendicular[0],
            0,
            vectorPerpendicular[1],
            0
        );
        const vectorPerpendicularScaled = [
            (vectorPerpendicular[0] * pointerWidth) / vectorPerpendicularLength,
            (vectorPerpendicular[1] * pointerWidth) / vectorPerpendicularLength,
        ];

        // Find point 2 //
        const p2 = [
            p1[0] + vectorPerpendicularScaled[0],
            p1[1] + vectorPerpendicularScaled[1],
        ];

        // Draw the pointer //
        ctx.beginPath();
        ctx.moveTo(pointerx, pointery);
        ctx.lineTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    offsetLine(dist) {
        // Offsets the line
        const offsetDistance = dist;
        const edgeVector = [this.endx - this.startx, this.endy - this.starty];
        const x = edgeVector[0];
        const y = edgeVector[1];
        const edgeVectorLength = distance(
            this.startx,
            this.endx,
            this.starty,
            this.endy
        );
        const sin90 = Math.sin(Math.PI / 2);
        const cos90 = Math.cos(Math.PI / 2);
        const edgeVectorPerpendicular = [
            -x * cos90 - y * sin90,
            x * sin90 - y * cos90,
        ];
        const edgeVectorPerpendicularUnit = [
            edgeVectorPerpendicular[0] / edgeVectorLength,
            edgeVectorPerpendicular[1] / edgeVectorLength,
        ];
        this.startx += offsetDistance * edgeVectorPerpendicularUnit[0];
        this.endx += offsetDistance * edgeVectorPerpendicularUnit[0];
        this.starty += offsetDistance * edgeVectorPerpendicularUnit[1];
        this.endy += offsetDistance * edgeVectorPerpendicularUnit[1];
    }
}

const animate = () => {
    // Animated the canvas
    render(); // Renders the canvas
    requestAnimationFrame(animate);
};

animate();

window.addEventListener("load", () => {
    // -- Attributes -- //
    const algorithmButton = document.getElementById("algo-but");

    const algorithmList = document.getElementById("algo-ul");
    algorithmList.classList.add("toggleDisplayNone"); // Display cannot be set to none in css since id attribute override class attributes

    const algorithmButtonsList = document
        .getElementById("algo-ul")
        .getElementsByTagName("button"); // Gets a collection of the buttons under the algorithms dropdown
    algorithmButtonsList[0].classList.add("button-active-background-color"); // Sets the depth first search option to true

    algorithmOptions[0] = true; // Sets Depth First Search bool to be true
    for (let i = 1; i < algorithmButtonsList.length; i++) {
        // Sets all other algorithm options to false
        algorithmOptions[i] = false;
    }

    const resetButton = document.getElementById("reset-but");
    const clearButton = document.getElementById("clear-but");

    const speedButton = document.getElementById("speed-but");
    const speedList = document.getElementById("speed-ul");
    speedList.classList.add("toggleDisplayNone"); // Display cannot be set to none in css since id attribute override class attributes

    const speedButtonsList = document
        .getElementById("speed-ul")
        .getElementsByTagName("button"); // Gets a collection of the buttons under the speed dropdown
    speedButtonsList[0].classList.add("button-active-background-color"); // Sets the slow option to true

    speedOptions[0] = true; // Sets the slow boolean to be true
    sleepTime = 450; // Sets the sleep time of the algorithm
    for (let i = 1; i < speedButtonsList.length; i++) {
        speedOptions[i] = false;
    }

    // -- Code Starts Here -- //
    // -- Algorithm Dropdown -- //
    algorithmButton.addEventListener("click", () => {
        algorithmButton.classList.toggle("button-active-background-color");
        algorithmList.classList.toggle("toggleDisplayFlex");
    });

    // -- Dropdown options -- //
    // Common Event Commands //
    for (let i = 0; i < algorithmButtonsList.length; i++) {
        algorithmButtonsList[i].addEventListener("click", () => {
            if (algorithmOptions[i]) return; // Returns if the option is already active
            for (let j = 0; j < algorithmButtonsList.length; j++) {
                // Loops through each algorithm button
                algorithmOptions[j] = false; // Sets all buttons to false
                algorithmButtonsList[j].classList.remove(
                    "button-active-background-color"
                ); // Sets all button background to deactive state
            }
            algorithmOptions[i] = true; // Sets button user clicked on to true
            algorithmButtonsList[i].classList.toggle(
                "button-active-background-color"
            ); // Sets button background to active
            clearButton.click(); // Simulates a click on the clear button.
        });
    }

    // Depth First Search //
    algorithmButtonsList[0].addEventListener("click", () => {
        // enable/disble options //
        startButton.disabled = false;
        startPermanentlyDisable = false;
        endButton.disabled = true;
        endPermanentlyDisable = true;
        directedButton.disabled = false;
        undirectedButton.disabled = false;
        weighted_button.disabled = true;
        unWeightedButton.disabled = false;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Breadth First Search //
    algorithmButtonsList[1].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = false;
        startPermanentlyDisable = false;
        endButton.disabled = true;
        endPermanentlyDisable = true;
        directedButton.disabled = false;
        undirectedButton.disabled = false;
        weighted_button.disabled = true;
        unWeightedButton.disabled = false;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Dijkstra's Shortest Path //
    algorithmButtonsList[2].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = false;
        startPermanentlyDisable = false;
        endButton.disabled = false;
        endPermanentlyDisable = false;
        directedButton.disabled = false;
        undirectedButton.disabled = false;
        weighted_button.disabled = false;
        unWeightedButton.disabled = true;
        flowActive = false;

        // Other //
        weightInput.min = 0;
    });

    // Bellman-Ford //
    algorithmButtonsList[3].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = false;
        startPermanentlyDisable = false;
        endButton.disabled = false;
        endPermanentlyDisable = false;
        directedButton.disabled = false;
        undirectedButton.disabled = true;
        weighted_button.disabled = false;
        unWeightedButton.disabled = true;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Floyd-Warshall //
    algorithmButtonsList[4].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = false;
        startPermanentlyDisable = false;
        endButton.disabled = false;
        endPermanentlyDisable = false;
        directedButton.disabled = false;
        undirectedButton.disabled = true;
        weighted_button.disabled = false;
        unWeightedButton.disabled = true;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Bridge and Articulation Points //
    algorithmButtonsList[5].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = true;
        startPermanentlyDisable = true;
        endButton.disabled = true;
        endPermanentlyDisable = true;
        directedButton.disabled = true;
        undirectedButton.disabled = false;
        weighted_button.disabled = true;
        unWeightedButton.disabled = false;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Kosaraju //
    algorithmButtonsList[6].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = true;
        startPermanentlyDisable = true;
        endButton.disabled = true;
        endPermanentlyDisable = true;
        directedButton.disabled = false;
        undirectedButton.disabled = true;
        weighted_button.disabled = true;
        unWeightedButton.disabled = false;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Prim's //
    algorithmButtonsList[7].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = true;
        startPermanentlyDisable = true;
        endButton.disabled = true;
        endPermanentlyDisable = true;
        directedButton.disabled = true;
        undirectedButton.disabled = false;
        weighted_button.disabled = false;
        unWeightedButton.disabled = true;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // Edmonds-Karp //
    algorithmButtonsList[8].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = false;
        startPermanentlyDisable = false;
        endButton.disabled = false;
        endPermanentlyDisable = false;
        directedButton.disabled = false;
        undirectedButton.disabled = true;
        weighted_button.disabled = false;
        unWeightedButton.disabled = true;
        flowActive = true;

        // Other //
        weightInput.min = 0;
    });

    // Kruskal //
    algorithmButtonsList[9].addEventListener("click", () => {
        // enable/disable options //
        startButton.disabled = true;
        startPermanentlyDisable = true;
        endButton.disabled = true;
        endPermanentlyDisable = true;
        directedButton.disabled = true;
        undirectedButton.disabled = false;
        weighted_button.disabled = false;
        unWeightedButton.disabled = true;
        flowActive = false;

        // Other //
        weightInput.min = -defaultWeight;
    });

    // -- Add Node Button -- //
    addNodeButton.addEventListener("click", () => {
        // Toggle active state of button
        addNodeButton.classList.toggle("button-active-background-color");
        addNodeActive = addNodeActive ? false : true; // Switches the active state

        // Remove active background from remaining buttons
        addEdgeButton.classList.remove("button-active-background-color");
        startButton.classList.remove("button-active-background-color");
        endButton.classList.remove("button-active-background-color");

        // Set remaining bools to false
        addEdgeActive = false;
        startActive = false;
        endActive = false;
    });

    // -- Set Start Button -- //
    startButton.addEventListener("click", () => {
        startButton.classList.toggle("button-active-background-color");
        startActive = startActive ? false : true;

        addNodeButton.classList.remove("button-active-background-color");
        addEdgeButton.classList.remove("button-active-background-color");
        startButton.classList.remove("button-warning-background-color");

        addNodeActive = false;
        addEdgeActive = false;

        endButton.classList.remove("button-active-background-color");
        endActive = false;
    });

    // -- Set End Button -- //
    endButton.addEventListener("click", () => {
        endButton.classList.toggle("button-active-background-color");
        endActive = endActive ? false : true;

        addNodeButton.classList.remove("button-active-background-color");
        addEdgeButton.classList.remove("button-active-background-color");
        endButton.classList.remove("button-warning-background-color");

        addNodeActive = false;
        addEdgeActive = false;

        startButton.classList.remove("button-active-background-color");
        startActive = false;
    });

    // -- Add Edge Button -- //
    addEdgeButton.addEventListener("click", () => {
        // Toggle active state of button
        addEdgeButton.classList.toggle("button-active-background-color");
        addEdgeActive = addEdgeActive ? false : true;

        // Remove active background from remaining buttons
        addNodeButton.classList.remove("button-active-background-color");
        startButton.classList.remove("button-active-background-color");
        endButton.classList.remove("button-active-background-color");

        // Set remaining bools to false
        addNodeActive = false;
        startActive = false;
        endActive = false;
    });

    // -- Directed Button -- //
    directedButton.addEventListener("click", () => {
        if (directedActive) return; // Prevents user from disabling when already on
        directedButton.classList.toggle("button-active-background-color");
        undirectedButton.classList.remove("button-active-background-color");

        directedActive = directedActive ? false : true; // Switches the directedActive boolean
        undirectedActive = directedActive ? false : true; // Sets undirectedActive boolean opposite of directedActive boolean

        render();
    });

    // -- Undirected Button -- //
    undirectedButton.addEventListener("click", () => {
        if (undirectedActive) return; // Prevents user from disabling when already on
        undirectedButton.classList.toggle("button-active-background-color");
        directedButton.classList.remove("button-active-background-color");

        undirectedActive = undirectedActive ? false : true; // Switches the undirectedActive boolean
        directedActive = undirectedActive ? false : true; // Sets directedActive boolean opposite of undirectedActive boolean

        render();
    });

    // -- Weighted Button -- //
    weighted_button.addEventListener("click", () => {
        if (weightedActive) return; // Prevents user from disabling when already on
        weighted_button.classList.toggle("button-active-background-color");
        unWeightedButton.classList.remove("button-active-background-color");

        weightedActive = weightedActive ? false : true;
        unweightedActive = weightedActive ? false : true;

        for (x of edges) {
            x.drawweight = true; // Enables displaying the weight of the node
        }

        render();
    });

    // -- Unweighted Button -- //
    unWeightedButton.addEventListener("click", () => {
        if (unweightedActive) return; // Prevents user from disabling when already on
        unWeightedButton.classList.toggle("button-active-background-color");
        weighted_button.classList.remove("button-active-background-color");

        unweightedActive = unweightedActive ? false : true;
        weightedActive = unweightedActive ? false : true;

        for (x of edges) {
            x.drawweight = false; // Disables displaying the weight of the node
        }

        render();
    });

    // -- Reset Button -- //
    resetButton.addEventListener("click", () => {
        for (node of nodes) {
            node.color = "#397EC9"; // Resets the node color
        }
        for (edge of edges) {
            edge.color = "white"; // Resets the line color
            edge.flow = 0; // Resets the flow value
        }
    });

    // -- Clear Button -- //
    clearButton.addEventListener("click", () => {
        nodes = []; // Clears the nodes
        edges = []; // Clears the edges
        numberOfNodes = 0; // Resets cumulative nodes
        startId = null;
        endId = null;
        for (let row = 0; row < maxn; row++) {
            // Resets the adjacency matrix
            adj[row].fill(Infinity);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clears the canvas
        for (let i = 0; i < algorithmOptions.length; i++) {
            if (algorithmOptions[i]) {
                algorithmButtonsList[i].click();
                break;
            }
        }
    });

    // -- Speed Button -- //
    speedButton.addEventListener("click", () => {
        speedButton.classList.toggle("button-active-background-color");
        speedList.classList.toggle("toggleDisplayFlex");
    });

    // Common Code //
    for (let i = 0; i < speedButtonsList.length; i++) {
        speedButtonsList[i].addEventListener("click", () => {
            if (speedOptions[i]) return; // Returns if the option is already active
            for (let j = 0; j < speedButtonsList.length; j++) {
                speedOptions[j] = false;
                speedButtonsList[j].classList.remove(
                    "button-active-background-color"
                );
            }
            speedOptions[i] = true;
            speedButtonsList[i].classList.toggle(
                "button-active-background-color"
            );
        });
    }

    // Code specific to button //
    // Slow //
    speedButtonsList[0].addEventListener("click", () => {
        sleepTime = 450;
    });

    // Medium //
    speedButtonsList[1].addEventListener("click", () => {
        sleepTime = 300;
    });

    // Fast //
    speedButtonsList[2].addEventListener("click", () => {
        sleepTime = 50;
    });

    speedButtonsList[3].addEventListener("click", () => {
        sleepTime = null;
    });

    // -- Start Button -- //
    startAlgorithmButton.addEventListener("click", () => {
        const dict = [
            "../algorithms/depthFirstSearch.js",
            "../algorithms/breadthFirstSearch.js",
            "../algorithms/dijkstra.js",
            "../algorithms/bellmanFord.js",
            "../algorithms/floydWarshall.js",
            "../algorithms/bridgeArticulationPoints.js",
            "../algorithms/kosaraju.js",
            "../algorithms/prim.js",
            "../algorithms/edmondsKarp.js",
            "../algorithms/kruskal.js",
        ];
        // Handle algorithms
        for (let i = 0; i < algorithmButtonsList.length; i++) {
            if (algorithmOptions[i]) {
                let worker = new Worker(dict[i]);
                worker.onmessage = (event) => {
                    // Listens for messsage from web worker
                    switch (event.data) {
                        case "terminate":
                            worker.terminate(); // Ends the web worker
                            return;
                        case "missingStart":
                            startButton.classList.add(
                                "button-warning-background-color"
                            );
                            return;
                        case "missingEnd":
                            endButton.classList.add(
                                "button-warning-background-color"
                            );
                    }
                    if (event.data[0] != null) {
                        // Node Data. Checks if a node index is provided
                        nodes[event.data[0]].color = event.data[1]; // Update the node
                    } else if (event.data[3] != null) {
                        // Line Data. Checks if a color was provided
                        edges[event.data[2]].color = event.data[3]; // Update the line
                    } else if (event.data[4] != null) {
                        // Flow-Capacity Data. Checks if a flow value was provided
                        edges[event.data[2]].flow += event.data[4]; // Update the flow
                    }
                };
                worker.onerror = (event) => {
                    console.log(
                        `ERROR: Line ${event.lineno} in ${event.filename}: ${event.message}`
                    );
                };
                worker.postMessage([
                    startId,
                    endId,
                    nodes,
                    edges,
                    adj,
                    sleepTime,
                    directedActive,
                    undirectedActive,
                ]); // Sends information to web worker
            }
        }
    });
});

window.addEventListener("click", () => {
    // Handles button disabling/activation
    // Add Node Button //
    if (nodes.length > 100) {
        addNodeButton.disabled = true;
    } else {
        addNodeButton.disabled = false;
    }

    // Set Start Button //
    if (nodes.length == 0) {
        startButton.disabled = true;
    } else {
        if (!startPermanentlyDisable) {
            startButton.disabled = false;
        }
    }

    // Set End Button //
    if (nodes.length == 0 || algorithmOptions[0]) {
        endButton.disabled = true;
    } else {
        if (!endPermanentlyDisable) {
            endButton.disabled = false;
        }
    }

    // Add Edge Button //
    if (nodes.length < 2) {
        addEdgeButton.disabled = true;
    } else {
        addEdgeButton.disabled = false;
    }

    // Dir Button //
    if (undirectedButton.disabled) {
        // If undir button is disabled
        // Enable dir button //
        directedActive = true;
        undirectedActive = false;

        directedButton.classList.add("button-active-background-color");
        undirectedButton.classList.remove("button-active-background-color");
    }

    if (undirectedActive && edges.length > 0) {
        // If undir button is selected and a line has been drawn
        directedButton.disabled = true; // Disable dir button
    }

    // Undir button //
    if (directedButton.disabled) {
        // If dir button is disabled
        // Enable undir button
        directedActive = false;
        undirectedActive = true;

        directedButton.classList.remove("button-active-background-color");
        undirectedButton.classList.add("button-active-background-color");
    }

    if (directedActive && edges.length > 0) {
        undirectedButton.disabled = true;
    }

    // Weighted Button //
    if (unWeightedButton.disabled) {
        // If unweighted button is disabled
        // Enable weighted button
        weightedActive = true;
        unweightedActive = false;

        weighted_button.classList.add("button-active-background-color");
        unWeightedButton.classList.remove("button-active-background-color");
    }

    if (unweightedActive && edges.length > 0) {
        weighted_button.disabled = true;
    }

    // Unweighted Button //
    if (weighted_button.disabled) {
        // If weighted button is disabled
        // Enable unweighted button
        weightedActive = false;
        unweightedActive = true;

        weighted_button.classList.remove("button-active-background-color");
        unWeightedButton.classList.add("button-active-background-color");
    }

    if (weightedActive && edges.length > 0) {
        unWeightedButton.disabled = true;
    }

    // Start Node //
    for (node of nodes) {
        if (node.id == startId) {
            node.color = node.id == endId ? "yellow" : "green";
            break;
        }
    }

    // End Node //
    for (node of nodes) {
        if (node.id == endId) {
            node.color = node.id == startId ? "yellow" : "red";
            break;
        }
    }
});

window.addEventListener("load", () => {
    let tempLine; // Creates a temporary line object

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // -- Event Listeners -- //
    canvas.addEventListener("click", (e) => {
        // -- Add node -- //
        if (addNodeActive) {
            // -- Add Node -- //
            if (e.offsetX < nodeRadius || e.offsetX > canvas.width - nodeRadius)
                return; // Ensures node is not overflowing out of page
            if (
                e.offsetY < nodeRadius ||
                e.offsetY > canvas.height - nodeRadius
            )
                return; // Ensures node is not overflowing out of page
            for (node of nodes) {
                if (distance(node.x, e.offsetX, node.y, e.offsetY) < 80) return; // Prevents nodes from overlapping
            }
            nodes.push(new Node(e.offsetX, e.offsetY, numberOfNodes)); // Adds node to node list
            numberOfNodes++; // Defined as nodes added + nodes removed

            // -- Add edge -- //
        } else if (addEdgeActive) {
            if (!edgeDrawActive) {
                // If player has not selected a starting node
                for (node of nodes) {
                    // Checks each node
                    if (
                        distance(node.x, e.offsetX, node.y, e.offsetY) <=
                        nodeRadius
                    ) {
                        // Checks if user clicked on a node
                        tempLine = new Edge(node.x, node.y, node.id); // Creates a new line object
                        tempLine.initialize(); // Initializes the line
                        edgeDrawActive = true; // Sets draw state to true
                        break;
                    }
                }
                return; // Breaks out of event. Player must click a second time to select an end nodes
            }
            if (edgeDrawActive) {
                // If player has selected a starting node
                for (node of nodes) {
                    let weightDraw = true;
                    if (
                        distance(node.x, e.offsetX, node.y, e.offsetY) <=
                            nodeRadius &&
                        node.id != tempLine.startNodeId
                    ) {
                        tempLine.endx = node.x;
                        tempLine.endy = node.y;
                        tempLine.draw(node.x, node.y); // Draws the line
                        tempLine.endNodeId = node.id; // Sets the end node id

                        if (
                            adj[tempLine.startNodeId][tempLine.endNodeId] ==
                            Infinity
                        ) {
                            // Checks if line does not exist
                            edges.push(tempLine); // Adds line to line list if line does not exist
                            adj[tempLine.startNodeId][
                                tempLine.endNodeId
                            ] = defaultWeight; // Sets element in adjacency matrix to defaultWeight if no input is provided
                            if (undirectedActive) {
                                // If line is unweighted
                                let tempLineReverse = new Edge(
                                    tempLine.endx,
                                    tempLine.endy,
                                    tempLine.endNodeId
                                ); // Create another line going in reverse
                                tempLineReverse.endx = tempLine.startx; // Sets end x property
                                tempLineReverse.endy = tempLine.starty; // Sets end y property
                                tempLineReverse.endNodeId =
                                    tempLine.startNodeId; // Sets end node
                                edges.push(tempLineReverse); // Add temporary line
                                adj[tempLine.endNodeId][
                                    tempLine.startNodeId
                                ] = defaultWeight; // Update the adjacency matrix
                            }
                        } else {
                            weightDraw = false; // Prevent weight input from showing if line already exists
                        }

                        if (directedActive) {
                            // Check if edge is a directed edge
                            if (
                                adj[tempLine.endNodeId][tempLine.startNodeId] !=
                                Infinity
                            ) {
                                // Check if a line exists going the opposite direction
                                for (let li = 0; li < edges.length; li++) {
                                    // Loop through line list
                                    if (
                                        edges[li].startNodeId ==
                                            tempLine.endNodeId &&
                                        edges[li].endNodeId ==
                                            tempLine.startNodeId &&
                                        !edges[li].isOffset
                                    ) {
                                        // If line goes opposite of recently drawn line
                                        edges[li].offsetLine(weightRadius); // Offset line
                                        edges[li].isOffset = true; // Line is offsetted
                                        tempLine.offsetLine(weightRadius);
                                        tempLine.isOffset = true;
                                        break;
                                    }
                                }
                            }
                        }
                        edgeDrawActive = false; // Drawing is complete. Revert back to non-active draw state

                        // Get weight if applicable //
                        if (weightedActive && weightDraw) {
                            weightForm.style.display = "block"; // Show the weight input
                            const lastEdge = tempLine;
                            if (directedActive) {
                                midP = midPoint(
                                    lastEdge.endx +
                                        ((lastEdge.startx - lastEdge.endx) *
                                            3) /
                                            4,
                                    lastEdge.endx,
                                    lastEdge.endy +
                                        ((lastEdge.starty - lastEdge.endy) *
                                            3) /
                                            4,
                                    lastEdge.endy
                                ); // Find the midpoint of the edge
                            } else if (undirectedActive) {
                                midP = midPoint(
                                    lastEdge.startx,
                                    lastEdge.endx,
                                    lastEdge.starty,
                                    lastEdge.endy
                                );
                            }

                            weightForm.style.left = `${
                                midP[0] - weightRadius
                            }px`; // Position the input
                            weightForm.style.top = `${
                                midP[1] - weightRadius
                            }px`; // Position the input
                        }

                        break;
                    }
                }
            }

            // -- Set Start Node -- //
        } else if (startActive) {
            for (node of nodes) {
                if (
                    distance(node.x, e.offsetX, node.y, e.offsetY) <= nodeRadius
                ) {
                    // Checks if user clicked on node
                    for (node2 of nodes) {
                        // Searches through the nodes
                        if (node2.id == startId) {
                            // Find the previous starting node
                            node2.color =
                                node2.id == endId ? "green" : "#397EC9";
                        }
                    }
                    startId = node.id; // Sets start node id
                    node.color = node.id == endId ? "yellow" : "green"; // If the node is also an end node set to yellow otherwise set to cyan
                    startButton.classList.remove(
                        "button-warning-background-color"
                    );
                    return; // Breaks out of canvas click event
                }
            }

            // -- Set End Node -- //
        } else if (endActive) {
            for (node of nodes) {
                if (
                    distance(node.x, e.offsetX, node.y, e.offsetY) <= nodeRadius
                ) {
                    // Checks if user clicked on node
                    for (node2 of nodes) {
                        // Searches through the nodes
                        if (node2.id == endId) {
                            // Find the previous ending node
                            node2.color =
                                node2.id == startId ? "red" : "#397EC9"; // If the previous ending node is also a starting node set the color to cyan otherwise reset to blue
                        }
                    }
                    endId = node.id; // Sets start node id
                    node.color = node.id == startId ? "yellow" : "green"; // If the node is also a start node set to yellow otherwise set to cyan
                    endButton.classList.remove(
                        "button-warning-background-color"
                    );
                    return;
                }
            }
        }
    });

    weightForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevents the form's default submission action. Basically doesn't break the program.
        if (undirectedActive) {
            // If edge is undirected
            if (flowActive) {
                edges[edges.length - 1].capacity = weightInput.value; // Sets the flow output
            } else {
                edges[edges.length - 1].weight = weightInput.value; // Update the value of the edge
            }
            edges[edges.length - 1].drawweight = true; // Show the value

            // Note: Updates 2 lines since creating an unweighted edge creates two lines going both directions
            if (flowActive) {
                edges[edges.length - 2].capacity = weightInput.value; // Sets the flow output
            } else {
                edges[edges.length - 2].weight = weightInput.value; // Updates the value of the edge
            }
            edges[edges.length - 2].drawweight = true; // Show the value
        } else {
            // If edge is not undirected
            if (flowActive) {
                edges[edges.length - 1].capacity = weightInput.value; // Sets the flow output
            } else {
                edges[edges.length - 1].weight = weightInput.value; // Sets the weight of the edge to user input
            }

            edges[edges.length - 1].drawweight = true; // Specifies line to display the edge weight
        }

        weightInput.value = "1000"; // Resets the value
        weightForm.style.display = "none"; // Hides the input field

        adj[edges[edges.length - 1].startNodeId][
            edges[edges.length - 1].endNodeId
        ] = edges[edges.length - 1].weight; // Updates the adjacency matrix
        if (undirectedActive) {
            // If line is an undirected line
            adj[edges[edges.length - 1].endNodeId][
                edges[edges.length - 1].startNodeId
            ] = edges[edges.length - 1].weight; // Updates the adjacency matrix
        }
    });
});
