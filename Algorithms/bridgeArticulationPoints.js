/*
This file contains the algorithm to find bridges and articulation points.
This file runs in a separate thread from the main thread.
 */
this.onmessage = (e) => {
    // -- Initialize variables -- //
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
    let bridges = [];
    let articulationPoints = [];

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

    const bridge = () => {
        // Initialize parent and visited arrays
        let visited = new Array(n).fill(false);
        let tin = new Array(n).fill(-1);
        let low = new Array(n).fill(-1);
        let timer = 0;
        const dfs = (v, p) => {
            if (display) updateNode(v, "orange");
            sleep(sleepTime);
            visited[v] = true; // Mark the current node as visited
            tin[v] = low[v] = timer++; // Initialize discovery time and low value
            for (let i = 0; i < adj[v].length; i++) {
                if (adj[v][i] != Infinity) {
                    if (i == p) continue;
                    if (visited[i]) low[v] = Math.min(low[v], tin[i]);
                    // Update low value of u for parent function calls.
                    else {
                        dfs(i, v); // If i is not visited yet, then recur for it
                        low[v] = Math.min(low[v], low[i]); // Check if the subtree rooted with v has a connection to one of the ancestors of u
                        // If the lowest vertex reachable from subtree
                        // under i is below v in DFS tree, then v-i
                        // is a bridge
                        if (low[i] > tin[v]) {
                            bridges.push([v, i]);
                        }
                    }
                }
            }
            if (display) updateNode(v, "grey");
            sleep(sleepTime);
        };
        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(i, -1);
            }
        }
    };

    const articulationPoint = () => {
        let visited = new Array(n).fill(false);
        let tin = new Array(n).fill(-1);
        let low = new Array(n).fill(-1);
        let timer = 0;
        const dfs = (v, p) => {
            if (display) updateNode(v, "orange");
            sleep(sleepTime);
            visited[v] = true;
            tin[v] = low[v] = timer++; // Initialize discovery time and low value
            let children = 0; // Count of children in DFS Tree
            for (let i = 0; i < adj[v].length; i++) {
                if (adj[v][i] != Infinity) {
                    if (i == p) continue;
                    if (visited[i]) low[v] = Math.min(low[v], tin[i]);
                    // Update low value of u for parent function calls.
                    else {
                        // If i is not visited yet, then make it a child of v
                        // in DFS tree and recur for it
                        dfs(i, v);
                        // Check if the subtree rooted with v has a connection to
                        // one of the ancestors of u
                        low[v] = Math.min(low[v], low[i]);
                        // v is an articulation point in following cases
                        // (1) If v is not root and low value of one of its child is more
                        // than discovery value of v.
                        if (low[i] >= tin[v] && p != -1)
                            articulationPoints.push(v);
                        children++;
                    }
                }
            }
            // (2) v is root of DFS tree and has two or more chilren.
            if (p == -1 && children > 1) articulationPoints.push(v);
            if (display) updateNode(v, "grey");
            sleep(sleepTime);
        };
        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs(i, -1);
            }
        }
    };

    bridge();
    for (bdg of bridges) {
        updateLineByStartEnd(bdg[0], bdg[1], "red");
        sleep(sleepTime);
    }

    for (let i = 0; i < n; i++) {
        updateNode(i, "#397EC9");
    }

    articulationPoint();
    for (let i = 0; i < n; i++) {
        if (!articulationPoints.includes(i)) updateNode(i, "#397EC9");
    }
    for (ap of articulationPoints) {
        updateNode(ap, "red");
        sleep(sleepTime);
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
