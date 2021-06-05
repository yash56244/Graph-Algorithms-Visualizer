/* 
This file contains the Bellman-Ford algorithm.
This file runs in a separate thread from the main loop.
*/
this.onmessage = (e) => {
    // -- Initialize variables -- //
    const startId = e.data[0];
    if (startId == null) {
        // If no start node is specified
        this.postMessage("missingStart"); // Tells main thread start node is missing
        return; // Ends web worker
    }
    const endId = e.data[1];
    if (endId == null) {
        // If no start node is specified
        this.postMessage("missingEnd"); // Tells main thread start node is missing
        return; // Ends web worker
    }
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
    let display;
    if (e.data[5] == null) {
        sleepTime = 50;
        display = false; // Specifies whether algorithm process is displayed
    } else {
        sleepTime = e.data[5];
        display = true; // Specifies whether algorithm process is displayed
    }
    const directedActive = e.data[6];
    const undirectedActive = e.data[7];

    const n = nodes.length;
    let dist = new Array(n).fill(Infinity); // Stores the shortest distance from starting node
    let parent = new Array(n).fill(-1); // Tracks the index of the previous node
    let negCycle = false;

    // -- Functions -- //
    const sleep = (milliseconds) => {
        // Pauses the program
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    };

    const updateNode = (index, color) => {
        this.postMessage([index, color, null, null, null]);
    };

    const updateLine = (index, color) => {
        this.postMessage([null, null, index, color, null, null]);
    };

    const updateLineByStartEnd = (startIndex, endIndex, color) => {
        // Updates a line given a start and end index
        for (let i = 0; i < edges.length; i++) {
            let from = edges[i].startNodeId;
            let to = edges[i].endNodeId;
            if (from == startIndex && to == endIndex) {
                updateLine(i, color);
                return;
            }
        }
    };

    // -- Code Starts Here -- //
    dist[startId] = 0; // Sets the shortest distance of the start index

    // First iteration //
    for (let i = 0; i < n - 1; i++) {
        // Iterate |V| - 1 times such that |V| is the number of vertices/nodes in the graph
        for (let j = 0; j < n; j++) {
            // Iterate for each node
            if (dist[j] == Infinity) {
                // If the node has not been visited yet
                continue; // Skip
            }
            if (display) {
                updateNode(j, "orange"); // Node is currently being searched
                sleep(sleepTime);
            }

            // Find neighbors //
            for (let id = 0; id < adj[j].length; id++) {
                // For each neighbor
                if (adj[j][id] != Infinity) {
                    // If node has been visited
                    if (dist[j] + adj[j][id] < dist[id]) {
                        // If edge can be relaxed
                        dist[id] = dist[j] + adj[j][id]; // Relax edge
                        parent[id] = j; // Set the previous node of neighbor
                    }
                    // Draw line and node being explored //
                    if (display) {
                        updateNode(id, "orange");
                        updateLineByStartEnd(j, id, "orange");
                        sleep(sleepTime);

                        // Reset line and node color //
                        updateNode(id, "#397EC9");
                        updateLineByStartEnd(j, id, "white");
                        sleep(sleepTime);
                    }
                }
            }
            if (display) {
                updateNode(j, "#397EC9"); // Node is currently being searched
                sleep(sleepTime);
            }
        }
    }

    // Second iteration //
    for (let j = 0; j < n; j++) {
        // Iterate for each node
        if (dist[j] == Infinity) {
            // If the node has not been visited yet
            continue; // Skip
        }
        if (display) {
            updateNode(j, "orange"); // Node is currently being searched
            sleep(sleepTime);
        }

        // Find neighbors //
        for (let id = 0; id < adj[j].length; id++) {
            // For each neighbor
            if (adj[j][id] != Infinity) {
                if (display) {
                    updateNode(id, "orange");
                    updateLineByStartEnd(j, id, "orange");
                    sleep(sleepTime);
                }
                // Checks if node has been visited
                if (dist[j] + adj[j][id] < dist[id]) {
                    // If node can be relaxed
                    dist[id] = -Infinity; // Set to negative infinity. Indicates node is part of a negative loop
                    parent[id] = null; // Node has no shortest path
                    negCycle = true;
                    break;
                }
                // Draw line and node being explored //
                if (display) {
                    // Reset line and node color //
                    updateNode(id, "#397EC9");
                    updateLineByStartEnd(j, id, "white");
                    sleep(sleepTime);
                }
            }
        }
        if (negCycle) {
            break;
        }
        if (display) {
            updateNode(j, "#397EC9"); // Node is currently being searched
            sleep(sleepTime);
        }
    }

    let edges = [];
    if (!negCycle) {
        for (let v = endId; v != startId; v = parent[v]) {
            edges.push([parent[v], v]);
        }
        edges.reverse();
        for (edge of edges) {
            updateLineByStartEnd(edge[0], edge[1], "green");
            sleep(sleepTime);
        }
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
