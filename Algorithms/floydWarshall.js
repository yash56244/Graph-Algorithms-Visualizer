/*
This file contains the Floyd-Warshall algorithm.
This file runs in a separate thread from the main loop.
*/
// Algorithm crashes if negative cycle is present
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

    let dp = []; // Tracks the best distance between any two pairs of nodes
    let next = []; // Tracks the previous node
    // Allocate memory //
    for (let i = 0; i < n; i++) {
        dp.push([]);
        next.push([]);
        for (let j = 0; j < n; j++) {
            dp[i][j] = Infinity;
            next[i][j] = null;
        }
    }
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
        this.postMessage([index, color, null, null, null, null]);
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
    for (let i = 0; i < n; i++) {
        // Start node. i = index of node, not id
        for (let j = 0; j < n; j++) {
            // End node. j = index of node, not id
            if (dp[i][j] > adj[i][j]) {
                dp[i][j] = adj[i][j]; // Sets the distance through no intermediates
                next[i][j] = j; // Sets the previous node of end node j
            }
            if (i == j) {
                // Node to itthis
                dp[i][j] = 0; // Set distance to 0
            }
        }
    }
    // Execute Floyd-Warshall //
    for (let iteration = 0; iteration < 2; iteration++) {
        for (let k = 0; k < n; k++) {
            // Intermediate node. k = index of node, not id
            if (display) updateNode(k, "orange"); // Sets node as being processed
            for (let i = 0; i < n; i++) {
                // Start node. i = index of node, not id
                if (display) updateNode(i, "orange"); // Sets node as being processed
                for (let j = 0; j < n; j++) {
                    // End node. j = index of node, not id
                    if (dp[i][j] > dp[i][k] + dp[k][j]) {
                        // If route through intermediate is shorter
                        if (iteration == 0) {
                            // First Iteration
                            dp[i][j] = dp[i][k] + dp[k][j]; // Set new route
                            next[i][j] = next[i][k]; // Sets previous node to intermediate
                        }
                        if (iteration == 1) {
                            // Second Iteration (cycle found)
                            dp[i][j] = -Infinity; // Set new route
                            next[i][j] = null; // Sets previous node to intermedite
                            negCycle = true;
                            break;
                        }
                    }
                    // Draw //
                    if (display) {
                        updateNode(j, "orange"); // Sets node as being processed
                        sleep(sleepTime);

                        // Reset colors //
                        if (k != j && i != j) updateNode(j, "#397EC9"); // Sets node as being processed
                        sleep(sleepTime);
                    }
                }
                if (display) {
                    if (k != i) updateNode(i, "#397EC9");
                    sleep(sleepTime);
                }
            }
            if (negCycle) {
                break;
            }
            if (display) {
                updateNode(k, "#397EC9");
                sleep(sleepTime);
            }
        }
    }
    if (!negCycle) {
        // Reconstruct shortest path //
        let currentIndex = startId;
        let nextIndex = next[currentIndex][endId];
        while (currentIndex != nextIndex && nextIndex != null) {
            // While a previous node exists
            updateLineByStartEnd(currentIndex, nextIndex, "#2F7B1F");
            sleep(sleepTime); // Sleep
            currentIndex = nextIndex; // Sets current node to its previous node
            nextIndex = next[currentIndex][endId]; // Sets previous node to its corresponding previous node
        }
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
