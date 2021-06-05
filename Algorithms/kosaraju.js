/*
This file contains Kosaraju's algorithm. 
This file runs in a separate thread from the main loop.
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
    if (e.data[5] == null) {
        sleepTime = 50;
    } else {
        sleepTime = e.data[5];
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
        if (index != -1)
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

    const transpose = (matrix) => {
        return matrix[0].map((col, c) => matrix.map((row, r) => matrix[r][c]));
    };

    let adjacency_matrix_rev = transpose(adj); // Create a reversed graph

    const n = nodes.length;
    let visited = new Array(n).fill(false); // Mark all the vertices as not visited (For first DFS)
    let order = [];
    let component = [];

    const kosaRaju = () => {
        const dfs1 = (v) => {
            visited[v] = true; // Mark the current node as visited
            for (let i = 0; i < adj[v].length; i++) {
                // Recur for all the vertices adjacent to this vertex
                if (adj[v][i] != Infinity && !visited[i]) {
                    dfs1(i);
                }
            }
            order.push(v); // All vertices reachable from v are processed by now, push v
        };

        const dfs2 = (v, p) => {
            visited[v] = true;
            component.push(v);
            for (let i = 0; i < adjacency_matrix_rev[v].length; i++) {
                if (adjacency_matrix_rev[v][i] != Infinity && !visited[i]) {
                    dfs2(i, v);
                }
            }
        };

        for (let i = 0; i < n; i++) {
            if (!visited[i]) {
                dfs1(i);
            }
        }
        // Mark all the vertices as not visited (For second DFS)
        for (let i = 0; i < n; i++) {
            visited[i] = false;
        }

        order.reverse();
        // Now process all vertices in order defined by Stack
        for (let i = 0; i < order.length; i++) {
            if (!visited[order[i]]) {
                dfs2(order[i], -1); // Print Strongly connected component of the popped vertex
                const color = () =>
                    "#" + Math.floor(Math.random() * 16777215).toString(16);
                const clr = color();
                for (cmp of component) {
                    for (cmp2 of component) {
                        updateNode(cmp, clr);
                        sleep(sleepTime);
                        updateNode(cmp2, clr);
                        sleep(sleepTime);
                        updateLineByStartEnd(cmp, cmp2, clr);
                        sleep(sleepTime);
                    }
                }
                component = [];
            }
        }
    };

    kosaRaju();

    this.postMessage("terminate");
};
