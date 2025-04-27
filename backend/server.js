const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const routeOpt = require('./RouteOptimization');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite database using the correct path
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});


// Root endpoint
app.get('/', (req, res) => {
  res.send('SmartFreight Backend is Running!');
});

// Endpoint to get shipment tracking data 
app.get('/api/containers/:id/tracking', (req, res) => {
  const containerId = req.params.id;
  const query = `
    SELECT Timestamp,
           Latitude AS CurrentLatitude,
           Longitude AS CurrentLongitude,
           Temperature,
           GForce 
    FROM SensorReading 
    WHERE ContainerID = ? 
    ORDER BY Timestamp DESC 
    LIMIT 1;
  `;
  db.get(query, [containerId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      if (row) {
        // Convert the coordinates to numbers
        row.CurrentLatitude = parseFloat(row.CurrentLatitude);
        row.CurrentLongitude = parseFloat(row.CurrentLongitude);
        
        // Simulate current status and estimated delivery time
        const currentStatus = "In Transit";
        const estimatedDelivery = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
        
        res.json({
          ...row,
          currentStatus,
          estimatedDelivery
        });
      } else {
        res.status(404).json({ error: 'No tracking data found for container ' + containerId });
      }
    }
  });
});


// API to get recent sensor readings for a container 
app.get('/api/containers/:id/sensors', (req, res) => {
  const containerId = req.params.id;
  const query = `
    SELECT Timestamp, Latitude, Longitude, Temperature, GForce 
    FROM SensorReading 
    WHERE ContainerID = ? 
    ORDER BY Timestamp DESC 
    LIMIT 10;
  `;
  db.all(query, [containerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API to get all incidents for a specific container (incident management & notifications)
app.get('/api/incidents/container/:id', (req, res) => {
  const containerId = req.params.id;
  const query = `
    SELECT IncidentType, Severity, Description, Timestamp 
    FROM Incident 
    WHERE ContainerID = ? 
    ORDER BY Timestamp DESC;
  `;
  db.all(query, [containerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// API to retrieve route optimization history for a container
app.get('/api/routes/optimize/:id', (req, res) => {
  const containerId = req.params.id;
  const query = `
    SELECT Timestamp, OptimizedRoute, TrafficConditions, WeatherConditions
    FROM RouteOptimization
    WHERE ContainerID = ?
    ORDER BY Timestamp DESC;
  `;
  db.all(query, [containerId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// simulated route (you already have the data in `containers`)
app.get('/api/routes/simulated/:id', (req, res) => {
  const r = containers.find(c => c.containerId == req.params.id);
  if (!r) return res.status(404).json({ error: 'No simulated route' });
  res.json({ geometry: r.route });
});

// optimized route (from the cache you’re filling above)
app.get('/api/routes/optimized/:id', (req, res) => {
  const geo = optimizedRoutes[req.params.id];
  if (!geo) return res.status(404).json({ error: 'No optimized route yet' });
  res.json({ geometry: geo });
});


// API to recalculate route optimization when issues arise (simulate dynamic route optimization)
app.post('/api/routes/optimize/:id', (req, res) => {
  const containerId = req.params.id;
  // we simulate a recalculation with static data.
  const timestamp = new Date().toISOString();
  const optimizedRoute = "Route A -> Route B -> Route C";
  const trafficConditions = "Moderate";
  const weatherConditions = "Clear";

  const query = `
    INSERT INTO RouteOptimization (ContainerID, Timestamp, OptimizedRoute, TrafficConditions, WeatherConditions)
    VALUES (?, ?, ?, ?, ?);
  `;
  db.run(query, [containerId, timestamp, optimizedRoute, trafficConditions, weatherConditions], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        message: 'Route optimization recalculated',
        routeId: this.lastID,
        containerId,
        timestamp,
        optimizedRoute,
        trafficConditions,
        weatherConditions
      });
    }
  });
});

// API to check the status of the latest backup (pre-existing endpoint)
app.get('/api/backups/latest', (req, res) => {
  const query = `
    SELECT BackupDate, Status, Duration, DataSize 
    FROM BackupLog 
    ORDER BY BackupDate DESC 
    LIMIT 1;
  `;
  db.get(query, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(row);
    }
  });
});


// =======================
// Shipment Route Simulator
// =======================

// Generate a semi-random route
function generateRoute(startLat, startLng, endLat, endLng, steps = 15) {
  const route = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = startLat + t * (endLat - startLat) + (Math.random() - 0.5) * 0.02;
    const lng = startLng + t * (endLng - startLng) + (Math.random() - 0.5) * 0.02;
    route.push({ lat, lng });
  }
  return route;
}

// Map of simulated shipments and their routes
// Define simulated containers and their routes
const containers = [
  { containerId: 1, route: generateRoute(40.7125, -74.0060, 34.0522, -118.2437) }, // NY → LA
  { containerId: 2, route: generateRoute(41.8781, -87.6298, 29.7604, -95.3698) },   // Chicago → Houston
  { containerId: 3, route: generateRoute(47.6062, -122.3321, 25.7617, -80.1918) }  // Seattle → Miami

];

const routeStepMap = new Map(); // Keeps track of current step per container

function simulateContainerPing(container) {
  const { containerId, route } = container;
  const stepIndex = routeStepMap.get(containerId) || 0;
  const step = route[stepIndex];
  if (!step) return;

  const timestamp = new Date().toISOString();
  const temperature = 20 + Math.random() * 10;
  const gForce = 0.01 + Math.random() * 0.05;

  db.run(`
    INSERT INTO SensorReading (ContainerID, Timestamp, Latitude, Longitude, Temperature, GForce)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [containerId, timestamp, step.lat, step.lng, temperature, gForce], (err) => {
    if (err) {
      console.error(`Error inserting SensorReading for Container ${containerId}:`, err.message);
    } else {
      console.log(`[SIM] Container ${containerId} @ (${step.lat.toFixed(4)}, ${step.lng.toFixed(4)})`);
    }
  });

  routeStepMap.set(containerId, (stepIndex + 1) % route.length);
}

function simulateAllContainers() {
  containers.forEach(simulateContainerPing);
}

// Run every 30 seconds
setInterval(simulateAllContainers, 5 * 1000);
simulateAllContainers(); // Run first immediately


// 1) in-memory store
const optimizedRoutes = {};

// 2) function to fetch & cache optimized geometry
async function cacheOptimizedRoutes() {
  containers.forEach(async ({ containerId, route }) => {
    // derive start/end from your simulated route
    const start = route[0];
    const end   = route[route.length - 1];

    try {
      const { geometry } = await routeOpt.fetchRoute(
        start.lat, start.lng,
        end.lat,   end.lng
      );
      optimizedRoutes[containerId] = geometry;
    } catch (e) {
      console.error(`Failed to fetch optimized for ${containerId}:`, e);
    }
  });
}

// run once at startup, then every 10 seconds
setInterval(cacheOptimizedRoutes, 10 * 1000);
cacheOptimizedRoutes();


// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
