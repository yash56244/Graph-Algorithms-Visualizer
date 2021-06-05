/* 
This file contains the Depth First Search algorithm.
This file runs in a separate thread from the main thread.
*/
this.onmessage = (e) => {
    // -- Initialize Variables -- //
    const startId = e.data[0];
    if (startId == null) {
        // If no start node is specified
        this.postMessage("missingStart"); // Tells main thread start node is missing
        return; // Ends web worker
    }
    const endId = e.data[1];
    const nodes = e.data[2];
    const edges = e.data[3];
    const adj = e.data[4];
    for (let row = 0; row < adj.length; row++) {
        for (let col = 0; col < adj[row].length; col++) {
            if (adj[row][col] != Infinity) {
                adj[row][col] = parseInt(adj[row][col]); // This is done because the non-infinity values of the adjacency matrix are strings so they need to be converted back to numbers
            }
        }
    }
    let sleepTime;
    if (e.data[5] == null) {
        sleepTime = 50;
    } else {
        sleepTime = e.data[5];
    }

    const directedActive = e.data[6];
    const undirectedActive = e.data[7];

    let visited = []; // Array tracks which nodes have been visited

    // -- Functions -- //
    const sleep = (milliseconds) => {
        // Pauses the program
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    };

    const updateNode = (color, nodeId) => {
        // Sends data for main thread to update
        for (let n = 0; n < nodes.length; n++) {
            if (nodes[n].id == nodeId) {
                this.postMessage([n, color, null, null, null, null]);
                break;
            }
        }
        sleep(sleepTime);
    };

    const depthFirstSearch = (nodeId) => {
        visited.push(nodeId); // Tracks nodes that have been visited
        updateNode("orange", nodeId); // Sets node color indicating exploring
        for (let i = 0; i < adj[nodeId].length; i++) {
            if (adj[nodeId][i] != Infinity && !visited.includes(i)) {
                depthFirstSearch(i);
            }
        }
        updateNode("grey", nodeId); // Sets node color indicating dead end
    };

    depthFirstSearch(startId);
    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
