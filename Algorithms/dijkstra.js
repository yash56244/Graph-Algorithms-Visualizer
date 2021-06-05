/* 
This file contains Dijkstra's Shortest Path algorithm.
This file runs in a separate thread from the main thread.
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

    const n = nodes.length;
    let dist = new Array(n).fill(Infinity);
    let parent = new Array(n).fill(-1);
    let visited = new Array(n).fill(false);

    dist[startId] = 0;

    if (display) {
        updateNode(startId, "orange");
        sleep(sleepTime);
    }

    // Start Dijkstra //
    for (let i = 0; i < n; i++) {
        let v = -1;
        for (let j = 0; j < n; j++) {
            if (!visited[j] && (v == -1 || dist[j] < dist[v])) {
                v = j;
            }
        }
        if (display) {
            updateNode(v, "orange");
            sleep(sleepTime);
        }
        if (dist[v] == Infinity) break;
        visited[v] = true;
        for (let i = 0; i < adj[v].length; i++) {
            let weight = adj[v][i];
            if (weight != Infinity) {
                if (display) {
                    updateLineByStartEnd(v, i, "orange");
                    sleep(sleepTime);
                }
                if (dist[v] + weight < dist[i]) {
                    dist[i] = dist[v] + weight;
                    parent[i] = v;
                }
                if (display) {
                    updateLineByStartEnd(v, i, "white");
                    sleep(sleepTime);
                }
            }
        }
        if (display) {
            updateNode(v, "#397EC9");
            sleep(sleepTime);
        }
    }
    if (display) {
        updateNode(startId, "#397EC9");
        sleep(sleepTime);
    }
    let edges = [];
    for (let v = endId; v != startId; v = parent[v]) {
        edges.push([parent[v], v]);
    }
    edges.reverse();
    for (edge of edges) {
        updateLineByStartEnd(edge[0], edge[1], "green");
        sleep(sleepTime);
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
