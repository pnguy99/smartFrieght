import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Popup, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// AnimatedMarker updates its position without re-rendering the whole map.
const AnimatedMarker = ({ position, children }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    // Only update if position is a valid array of two finite numbers.
    if (
      markerRef.current &&
      Array.isArray(position) &&
      position.length === 2 &&
      position.every((coord) => Number.isFinite(coord))
    ) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  return <Marker ref={markerRef} position={position}>{children}</Marker>;
};

// MapView renders the map container once.
// React.memo prevents unnecessary re-renders if the props haven't changed.
const MapView = React.memo(({ initialPosition, markerPosition, children }) => (
  <MapContainer
    center={initialPosition}
    zoom={13}
    style={{ height: '100%', width: '100%', border: '2px solid red' }}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <AnimatedMarker position={markerPosition}>
      {children}
    </AnimatedMarker>
  </MapContainer>
));

const ShipmentMap = ({ shipmentId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // new state for the two routes
  const [simRoute, setSimRoute] = useState([]);   // array of [lat,lng]
  const [optRoute, setOptRoute] = useState([]);   // array of [lat,lng]

  useEffect(() => {
    let intervalId;

    const fetchData = () => {
      fetch(`/api/containers/${shipmentId}/tracking`)
        .then((res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then((data) => {
          setTrackingData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    // new: fetch the simulated route geometry
    const fetchSimRoute = () => {
      fetch(`/api/routes/simulated/${shipmentId}`)
        .then(res => res.json())
        .then(({ geometry }) => {
          // geometry from server is [{ lat, lng }, … ]
          setSimRoute(geometry.map(p => [p.lat, p.lng]));
        })
        .catch(() => {
          // optional: handle missing data
          setSimRoute([]);
        });
    };

    // new: fetch the optimized route geometry
    const fetchOptRoute = () => {
      fetch(`/api/routes/optimized/${shipmentId}`)
        .then(res => res.json())
        .then(({ geometry }) => {
          // geometry from server is [[lon,lat], … ] if using OSRM
          setOptRoute(geometry.map(([lon, lat]) => [lat, lon]));
        })
        .catch(() => {
          setOptRoute([]);
        });
    };

    fetchData(); // initial fetch
    fetchSimRoute();
    fetchOptRoute();

    // Fetch new coordinates every 3 seconds.
    intervalId = setInterval(() => {
      fetchData();
      fetchSimRoute();
      fetchOptRoute();
    }, 300);

    return () => clearInterval(intervalId);
  }, [shipmentId]);

  if (loading) {
    return <p>Loading tracking data...</p>;
  }

  if (error) {
    return <p>Error fetching data: {error}</p>;
  }

  if (!trackingData) {
    return <p>No tracking data available.</p>;
  }

  const { CurrentLatitude, CurrentLongitude, currentStatus, estimatedDelivery } = trackingData;

  // Validate that the coordinates are valid numbers.
  if (
    typeof CurrentLatitude !== 'number' ||
    typeof CurrentLongitude !== 'number' ||
    !Number.isFinite(CurrentLatitude) ||
    !Number.isFinite(CurrentLongitude)
  ) {
    return <p>Invalid location data received from backend.</p>;
  }

  const markerPosition = [CurrentLatitude, CurrentLongitude];

  return (
    <MapView initialPosition={markerPosition} markerPosition={markerPosition}>
      <Popup>
        Shipment is here.
        <br />
        Status: {currentStatus}
        <br />
        Estimated Delivery: {new Date(estimatedDelivery).toLocaleString()}
      </Popup>


      {/* simulated route in blue */}
      {simRoute.length > 0 && (
        <Polyline
          positions={simRoute}
          pathOptions={{ color: 'blue', weight: 3 }}
        />
      )}

      {/* optimized route in red dashed */}
      {optRoute.length > 0 && (
        <Polyline
          positions={optRoute}
          pathOptions={{ color: 'red', dashArray: '8 4', weight: 3 }}
        />
      )}
      
    </MapView>
  );
};

export default ShipmentMap;
