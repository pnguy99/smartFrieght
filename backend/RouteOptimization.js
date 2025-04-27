// routeOptimization.js

// const fetch = require('node-fetch');

// Constants for traffic and weather penalties
const PENALTIES = {
  traffic: {
    low: 1.0, // No penalty
    moderate: 1.1, // 10% penalty
    high: 1.2, // 20% penalty
  },
  weather: {
    clear: 1.0,
    rainy: 1.1, // 10% penalty
    stormy: 1.3, // 30% penalty
  },
};

// Dijkstra's Algorithm to find the shortest path 
function dijkstra(nodes, startNode, endNode, graph) {
  const distances = {};
  const previousNodes = {};
  const unvisitedNodes = new Set();

  // Initialize distances and unvisited nodes
  nodes.forEach(node => {
    distances[node] = Infinity;
    previousNodes[node] = null;
    unvisitedNodes.add(node);
  });
  distances[startNode] = 0;

  while (unvisitedNodes.size > 0) {
    // Get the node with the smallest distance
    let closestNode = null;
    unvisitedNodes.forEach(node => {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node;
      }
    });

     // No connection between start and end nodes
    if (distances[closestNode] === Infinity) {
      break;
    }

    // Get neighbors and update distances
    const neighbors = graph[closestNode] || [];
    neighbors.forEach(neighbor => {
      const newDist = distances[closestNode] + graph[closestNode][neighbor];
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        previousNodes[neighbor] = closestNode;
      }
    });

    unvisitedNodes.delete(closestNode);
  }

  // Reconstruct the path
  const path = [];
  let currentNode = endNode;
  while (currentNode !== null) {
    path.unshift(currentNode);
    currentNode = previousNodes[currentNode];
  }

  return { distance: distances[endNode], path };
}

// Fetch route using OpenStreetMap 
async function fetchRoute(startLat, startLon, endLat, endLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.routes && data.routes[0]) {
    return {
      distance: data.routes[0].distance / 1000, // Convert meters to kilometers
      geometry: data.routes[0].geometry.coordinates,
    };
  } else {
    throw new Error('Failed to fetch route data');
  }
}

// Calculate optimized route with penalties
function calculateOptimizedRoute(distance, trafficCondition, weatherCondition) {
  const trafficPenalty = PENALTIES.traffic[trafficCondition] || 1.0;
  const weatherPenalty = PENALTIES.weather[weatherCondition] || 1.0;

  const optimizedDistance = distance * trafficPenalty * weatherPenalty;
  return optimizedDistance;
}

module.exports = {
  dijkstra,
  fetchRoute,
  calculateOptimizedRoute,
};
