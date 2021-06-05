/* 
This file contains the Edmonds-Karps Max Flow algorithm.
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
    if (endId == null) {
        // If no start node is specified
        this.postMessage("missingEnd"); // Tells main thread start node is missing
        return; // Ends web worker
    }
    const nodes = e.data[2];
    let edges = e.data[3];
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
        includes(i) {
            return this.items.includes(i);
        }
        clear() {
            this.items = [];
        }
    }

    const n = nodes.length;

    let q = new Queue(); // This is a queue data structure. Stores the index position of nodes.
    q.enqueue(startId);

    let visited = new Array(n).fill(false); // Array tracks which nodes have been visited. The index of element corresponds to index in nodes.
    let parent = new Array(n).fill(null); // Stores the index position of previous node
    visited[startId] = true; // Sets starting node as visited
    let neighbors = []; // Stores the neighbors
    let augmentPath = []; // Stores the augmenting path
    let bottleneckValue; // Stores the bottleneck value

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

    const updateFlowAndCapacity = (index, flow) => {
        this.postMessage([null, null, index, null, flow, null]);
    };

    const getFlowandCapacity = (s, e) => {
        // Gets the flow of the edge
        for (let line of edges) {
            if (line.startNodeId == s && line.endNodeId == e) {
                return [line.flow, line.capacity];
            }
        }
    };

    const findStartEndPairs = (arr) => {
        // This const takes the augmenting nodes array and generates all start-end node pairs
        let left = 0; // Leftmost index
        let right = 1; // Rightmost index
        let pairs = []; // Stores the pairs
        while (right < arr.length) {
            pairs.push([arr[left], arr[right]]); // Add the pair
            left++;
            right++;
        }
        return pairs; // Returns the pairs.
    };

    const checkInPairsandOrientation = (s, e, pairs) => {
        // s => index position of start node
        // e => index position of end node
        // Forward edges //
        for (let pair of pairs) {
            if (pair[0] == s && pair[1] == e) return [true, true]; // Checks for a forward edge
        }
        // Backward edges
        for (let pair of pairs) {
            if (pair[0] == e && pair[1] == s) return [true, false]; // Checks for a backward edge
        }
        return [false, null]; // No edge was found matching description
        /*
            [true, true] indicates a forward edge was found
            [true, false] indicates a backward edge was found
        */
    };

    const computeBottleNeckValue = (startNodeId, endNodeId) => {
        for (let i = 0; i < edges.length; i++) {
            var s = edges[i].startNodeId;
            var e = edges[i].endNodeId;
            if (s == startNodeId && e == endNodeId) {
                // Checks for a forward edge
                return edges[i].capacity - edges[i].flow; // Return bottleneck value
                // The bottleneck value for a forward edge is capacity - flow
            }
            if (s == endNodeId && e == startNodeId) {
                // Checsk for a backward edge
                return edges[i].flow; // Return the bottleneck value
                // The bottleneck value for a backward edge is just the flow
            }
        }
    };

    const breadthFirstSearch = () => {
        while (!q.isEmpty()) {
            // While the queue is not empty
            let currentNodeIndex = q.front(); // Gets the first node in queue to check
            if (display) {
                updateNode(currentNodeIndex, "orange");
                sleep(sleepTime);
            }
            if (currentNodeIndex == endId) {
                // If the sink is found
                let path = [currentNodeIndex]; // Stores a path from source to sink. Starts by adding end node index
                let i = currentNodeIndex; // i is the current node index
                while (parent[i] != null) {
                    path.unshift(parent[i]); // Add the previous node
                    i = parent[i];
                }
                if (display) {
                    for (let i = 0; i < n; i++) {
                        updateNode(i, "#397EC9"); // Reset each node color
                    }
                    sleep(sleepTime);
                }
                return path; // Return the path from source to sink
            }
            q.dequeue(); // Dequeues first index
            neighbors = []; // Clears the neighbors array

            // -- Get neighbors -- //
            for (let id = 0; id < adj[currentNodeIndex].length; id++) {
                // Searches through the adjacency matrix
                if (!visited[id] && !q.includes(id)) {
                    // If node is not visited and not in queue
                    if (adj[currentNodeIndex][id] != Infinity) {
                        // Finds any forward edges
                        let temp = getFlowandCapacity(currentNodeIndex, id);
                        lineFlow = temp[0];
                        lineCapacity = temp[1];
                        if (lineFlow < lineCapacity) {
                            // Checks if there is available capacity left
                            neighbors.push(id); // Adds the forward edge
                            continue;
                        }
                    }
                    if (adj[id][currentNodeIndex] != Infinity) {
                        // Finds any backward edges
                        let temp = getFlowandCapacity(id, currentNodeIndex);
                        lineFlow = temp[0];
                        lineCapacity = temp[1];
                        if (lineFlow > 0) {
                            // Checks if there is flow
                            neighbors.push(id); // Adds the backward edge
                            continue;
                        }
                    }
                }
            }

            // -- Visit neighbors -- //
            for (neighbor of neighbors) {
                q.enqueue(neighbor); // Add neighbor to queue
                visited[neighbor] = true; // Set neighbor to visited
                parent[neighbor] = currentNodeIndex; // Update parent
            }
        }
        if (display) {
            for (let i = 0; i < n; i++) {
                updateNode(i, "#397EC9"); // Reset each node color
            }
        }

        return []; // Return an empty array indicating that no available path exists
    };

    // -- Code Starts Here -- //
    while (true) {
        q.clear();
        q.enqueue(startId); // Resets the queue
        visited = new Array(n).fill(false); // Resets the visited array
        visited[startId] = true;
        augmentPath = []; // Resets the augmenting path. Stores indexes
        parent = new Array(n).fill(null); // Reset the parent array
        augmentPath = breadthFirstSearch(); // Perform a depth first search
        const pairs = findStartEndPairs(augmentPath); // Pairs are indices
        bottleneckValue = Infinity; // Resets the bottleneck value

        if (!augmentPath.includes(endId)) break; // If the end node is not included in the path break

        // -- Compute bottleneck value -- //
        for (pair of pairs) {
            var computedBottleneckValue = computeBottleNeckValue(
                pair[0],
                pair[1]
            );
            bottleneckValue =
                computedBottleneckValue < bottleneckValue
                    ? computedBottleneckValue
                    : bottleneckValue; // Update the bottleneck value if applicable
        }

        // Augment edges //
        for (let lineIndex = 0; lineIndex < edges.length; lineIndex++) {
            const start = edges[lineIndex].startNodeId;
            const end = edges[lineIndex].endNodeId;
            const temp = checkInPairsandOrientation(start, end, pairs); // Gets the output
            const edgeExists = temp[0]; // Gets whether the edge exists
            const orientation = temp[1]; // Gets the orientation of the edge
            if (edgeExists) {
                if (orientation) {
                    edges[lineIndex].flow += bottleneckValue; // Update the flow
                    updateLine(lineIndex, "orange");
                    updateFlowAndCapacity(lineIndex, bottleneckValue);
                    sleep(sleepTime);
                    updateLine(lineIndex, "white");
                    sleep(sleepTime);
                } else {
                    edges[lineIndex].flow -= bottleneckValue; // Update the flow
                    updateLine(lineIndex, "orange");
                    updateFlowAndCapacity(lineIndex, bottleneckValue * -1);
                    sleep(sleepTime);
                    updateLine(lineIndex, "white");
                    sleep(sleepTime);
                }
            }
        }
    }

    this.postMessage("terminate"); // Tells main thread to terminate web worker
};
