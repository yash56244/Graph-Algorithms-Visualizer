/*
This file contains Kruskal's Minimum Spanning Tree algorithm.
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

    const n = nodes.length; // Store the number of nodes in the graph
    let rank = [];
    let parent = [];
    let mstEdges = [];

    const make_set = (v) => {
        //To create a new set (operation make_set(v)), we simply create a tree with root in the vertex v, meaning that it is its own ancestor.
        parent[v] = v;
        rank[v] = 0;
    };

    const find_set = (v) => {
        // find root and make root as parent of i (path
        // compression)
        if (v == parent[v]) {
            return v;
        }
        return (parent[v] = find_set(parent[v]));
    };

    const union_sets = (a, b) => {
        a = find_set(a);
        b = find_set(b);
        if (a != b) {
            // Attach smaller rank tree under root of high rank tree
            if (rank[a] < rank[b]) {
                [a, b] = [b, a];
            }
            parent[b] = a;
            if (rank[a] == rank[b]) {
                // If ranks are same, then make one as root and
                // increment its rank by one
                rank[a]++;
            }
        }
    };

    for (let i = 0; i < n; i++) {
        make_set(i);
    }

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
    const kruskal = () => {
        let line_li_temp = [...edges];
        line_li_temp.sort((a, b) =>
            parseInt(a.weight) > parseInt(b.weight) ? 1 : -1
        );
        line_li_temp = line_li_temp.filter((v, i) => {
            return i % 2 == 0;
        });
        let cost = 0;
        for (li of line_li_temp) {
            if (display) {
                updateNode(li.startNodeId, "orange");
                sleep(sleepTime);
                updateNode(li.endNodeId, "orange");
                sleep(sleepTime);
                updateLineByStartEnd(li.startNodeId, li.endNodeId, "orange");
                sleep(sleepTime);
            }
            if (find_set(li.startNodeId) != find_set(li.endNodeId)) {
                mstEdges.push([li.startNodeId, li.endNodeId]);
                cost += parseInt(li.weight);
                union_sets(li.startNodeId, li.endNodeId);
            }
            if (display) {
                updateNode(li.startNodeId, "#397EC9");
                sleep(sleepTime);
                updateNode(li.endNodeId, "#397EC9");
                sleep(sleepTime);
                updateLineByStartEnd(li.startNodeId, li.endNodeId, "white");
                sleep(sleepTime);
            }
        }
    };

    kruskal();
    for (edge of mstEdges) {
        updateLineByStartEnd(edge[0], edge[1], "green");
        sleep(sleepTime);
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
