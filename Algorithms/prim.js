/*
This file contains Prim's Minimum Spanning Tree algorithm.
This file runs in a separate thread from the main thread.
*/

this.onmessage = (e) => {
    // -- Initialize Variables -- //
    const startId = e.data[0];
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
    let parent = new Array(n); // Array to store constructed MST
    let key = new Array(n).fill(Infinity); // Key values used to pick minimum weight edge in cut
    let mstSet = new Array(n).fill(false); // To represent set of vertices included in MST
    // Always include first 1st vertex in MST.
    // Make key 0 so that this vertex is picked as first vertex.
    key[0] = 0;
    parent[0] = -1; // First node is always root of MST
    let edgesInMst = [];
    let cost = 0;

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
            if (
                (from == startIndex && to == endIndex) ||
                (from == endIndex && to == startIndex)
            ) {
                updateLine(i, color);
            }
        }
    };

    const prim = () => {
        // A utility const to find the vertex with
        // minimum key value, from the set of vertices
        // not yet included in MST
        const minKey = (key, mstSet) => {
            // Initialize min value
            let min = Infinity,
                min_index;

            for (let v = 0; v < n; v++)
                if (mstSet[v] == false && key[v] < min)
                    (min = key[v]), (min_index = v);

            return min_index;
        };

        // The MST will have V vertices
        for (let count = 0; count < n - 1; count++) {
            // Pick the minimum key vertex from the
            // set of vertices not yet included in MST
            let u = minKey(key, mstSet);

            if (display) {
                updateNode(u, "orange");
                sleep(sleepTime);
            }

            // Add the picked vertex to the MST Set
            mstSet[u] = true;

            // Update key value and parent index of
            // the adjacent vertices of the picked vertex.
            // Consider only those vertices which are not
            // yet included in MST
            for (let v = 0; v < n; v++) {
                // adj[u][v] is non zero only for adjacent vertices of m
                // mstSet[v] is false for vertices not yet included in MST
                // Update the key only if adj[u][v] is smaller than key[v]
                if (adj[u][v] && mstSet[v] == false && adj[u][v] < key[v]) {
                    updateLineByStartEnd(v, u, "orange");
                    sleep(sleepTime);
                    parent[v] = u;
                    key[v] = adj[u][v];
                    updateLineByStartEnd(v, u, "white");
                    sleep(sleepTime);
                }
            }
            if (display) {
                updateNode(u, "#397EC9");
                sleep(sleepTime);
            }
        }

        for (let i = 1; i < n; i++) {
            edgesInMst.push([parent[i], i]);
            cost += adj[parent[i]][i];
        }
    };

    prim();

    for (edge of edgesInMst) {
        updateNode(edge[0], "green");
        sleep(sleepTime);
        updateNode(edge[1], "green");
        sleep(sleepTime);
        updateLineByStartEnd(edge[0], edge[1], "red");
        sleep(sleepTime);
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
