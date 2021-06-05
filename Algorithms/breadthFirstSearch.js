/* 
This file contains the Breadth First Search algorithm. 
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
        // Sends data for main thread to update
        this.postMessage([index, color, null, null, null, null]);
        sleep(sleepTime);
    };

    class Queue {
        constructor() {
            this.items = [];
        }
        isEmpty() {
            return this.items.length == 0;
        }
        enqueue(element) {
            this.items.push(element);
        }
        dequeue() {
            if (this.isEmpty()) {
                return "Queue Underflow";
            }
            return this.items.shift();
        }
        front() {
            if (this.isEmpty()) {
                return "Queue is Empty";
            }
            return this.items[0];
        }
    }

    let q = new Queue();
    q.enqueue(startId); // Mark the start node as visited and enqueue it
    let vis = [];
    vis.push(startId);

    const breadthFirstSearch = () => {
        while (!q.isEmpty()) {
            const v = q.front();
            q.dequeue(); // Dequeue a vertex from queue
            updateNode(v, "grey"); // Draws root node as visited
            // Get all adjacent vertices of the dequeued
            // vertex v. If a adjacent has not been visited,
            // then mark it visited and enqueue it
            for (let i = 0; i < adj[v].length; i++) {
                if (adj[v][i] != Infinity && !vis.includes(i)) {
                    vis.push(i);
                    q.enqueue(i);
                    updateNode(i, "orange"); // Draws node as currently visiting
                }
            }
        }
    };

    breadthFirstSearch();
    this.postMessage("terminate");
};
