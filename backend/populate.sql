BEGIN TRANSACTION;

-- 1) DeliveryState
INSERT INTO DeliveryState (StateID, StateName) VALUES
  (1, 'In Transit'),
  (2, 'Delivered'),
  (3, 'Delayed'),
  (4, 'Damaged');

-- 2) Role
INSERT INTO Role (RoleID, RoleName) VALUES
  (1, 'Admin'),
  (2, 'Manager'),
  (3, 'User');

-- 3) DeliveryCompany
INSERT INTO DeliveryCompany (DeliveryCompanyID, CompanyName) VALUES
  (1, 'Express Logistics'),
  (2, 'Fast Freight');

-- 4) SystemUser
INSERT INTO SystemUser (UserID, Email, PhoneNumber) VALUES
  (1, 'john.doe@example.com', '+1-555-1234'),
  (2, 'jane.smith@example.com', '+1-555-5678');

-- 5) Route
-- First, create a "parent" route (RouteID = 1), and then a child route referencing it.
INSERT INTO Route (RouteID, Origin, Destination, ParentRouteID) VALUES
  (1, 'New York', 'Los Angeles', NULL),
  (2, 'Los Angeles', 'San Francisco', 1),
  (3, 'Chicago', 'Houston', NULL);

-- 6) Receiver
INSERT INTO Receiver (ReceiverID, ReceiverName, Email, PhoneNumber) VALUES
  (1, 'Acme Corp', 'contact@acme.com', '+1-555-1111'),
  (2, 'Globex Inc', 'info@globex.com', '+1-555-2222');

-- 7) Shipment
-- Example: Shipment #2 references Shipment #1 as its parent (ParentShipmentID=1).
INSERT INTO Shipment (ShipmentID, CurrentLatitude, CurrentLongitude, RouteID, DepartureTime, ArrivalTime, ParentShipmentID, ReceiverID, DeliveryCompanyID)
VALUES
  (1, 40.7128, -74.0060, 1, '2025-02-20 09:00:00', '2025-02-25 18:00:00', NULL, 1, 1),
  (2, 34.0522, -118.2437, 2, '2025-02-21 10:00:00', '2025-02-23 12:00:00', 1, 2, 2);

-- 8) Container
-- Link containers to Shipments and a current DeliveryState.
INSERT INTO Container (ContainerID, Description, Latitude, Longitude, GForce, Temperature, ForcedEntry, CurrentStateID, ShipmentID)
VALUES
  (1, 'Electronics', 39.9526, -75.1652, 0.5, 22.0, 0, 1, 1),
  (2, 'Clothing', 41.8781, -87.6298, 0.3, 25.0, 0, 1, 1),
  (3, 'Fragile Items', 34.0522, -118.2437, 0.4, 20.0, 0, 1, 2);

-- 9) ContainerStateHistory
INSERT INTO ContainerStateHistory (HistoryID, ContainerID, OldStateID, NewStateID, TransitionTime, Reason)
VALUES
  (1, 1, 1, 3, '2025-02-21 11:00:00', 'Delay at checkpoint'),
  (2, 1, 3, 1, '2025-02-22 09:00:00', 'Delay resolved'),
  (3, 2, 1, 4, '2025-02-22 10:00:00', 'Container damaged in transit');

-- 10) Sensor
INSERT INTO Sensor (SensorID, SensorType, ContainerID, Calibration, InstallationDate) VALUES
  (1, 'Temperature', 1, 'Calibrated-2025-01', '2025-02-15 08:00:00'),
  (2, 'G-Force', 2, 'Calibrated-2025-01', '2025-02-16 09:00:00');

-- 11) SensorReading
-- Note the last column is ContainerID (default 1, but we can override).
INSERT INTO SensorReading (ReadingID, SensorID, Timestamp, Latitude, Longitude, GForce, Temperature, ContainerID) VALUES
  (1, 1, '2025-02-21 10:30:00', 39.9526, -75.1652, 0.5, 22.0, 1),
  (2, 1, '2025-02-21 12:30:00', 39.9527, -75.1655, 0.6, 23.0, 1),
  (3, 2, '2025-02-21 10:45:00', 39.9526, -75.1652, 0.7, NULL, 2);

-- 12) Incident
INSERT INTO Incident (IncidentID, ContainerID, IncidentType, Severity, Description, Timestamp)
VALUES
  (1, 2, 'Damage', 'High', 'Container was found dented', '2025-02-22 09:30:00'),
  (2, 3, 'Temperature Spike', 'Medium', 'Temperature exceeded threshold', '2025-02-23 13:45:00');

-- 13) Notification
INSERT INTO Notification (NotificationID, UserID, IncidentID, Message, Timestamp, Status)
VALUES
  (1, 1, 1, 'Incident reported: Container #2 was damaged', '2025-02-22 09:35:00', 'Unread'),
  (2, 2, 2, 'Incident reported: Container #3 temperature spike', '2025-02-23 13:50:00', 'Unread');

-- 14) TruckProxy
-- DeliveryID references ShipmentID.
INSERT INTO TruckProxy (TruckProxyID, DeliveryID, RouteID) VALUES
  (1, 1, 1),
  (2, 2, 2);

-- 15) Driver
-- TruckID is just a sample integer. TruckProxyID references TruckProxy.
INSERT INTO Driver (DriverID, Name, TruckID, TruckProxyID) VALUES
  (1, 'Bob the Driver', 100, 1),
  (2, 'Alice the Driver', 101, 2);

-- 16) RouteChangeHistory
INSERT INTO RouteChangeHistory (ChangeID, ShipmentID, OldRouteID, NewRouteID, ChangeReason, Timestamp)
VALUES
  (1, 2, 2, 3, 'Avoid severe weather', '2025-02-21 11:15:00');

-- 17) UserShipment
INSERT INTO UserShipment (UserID, ShipmentID) VALUES
  (1, 1),
  (2, 2);

-- 18) UserRoleMapping
INSERT INTO UserRoleMapping (UserID, RoleID) VALUES
  (1, 1),  -- User #1 is Admin
  (2, 3);  -- User #2 is standard User

-- 19) BackupLog
INSERT INTO BackupLog (BackupID, BackupDate, Status, Duration, DataSize) VALUES
  (1, '2025-02-24 02:00:00', 'Success', 30, 1.2),
  (2, '2025-02-25 02:00:00', 'Success', 29, 1.1);

-- 20) RouteOptimization
-- Auto-increment primary key (ID); we can insert NULL or just omit the ID column.
INSERT INTO RouteOptimization (ContainerID, Timestamp, OptimizedRoute, TrafficConditions, WeatherConditions)
VALUES
  (1, '2025-02-21 11:20:00', 'Optimized route data here', 'Heavy traffic in city center', 'Clear skies');
-- also changed OptRoute data manually with
-- sqlite3 database.db <<SQL
-- UPDATE RouteOptimization
--    SET OptimizedRoute = 'I-95 → I-80 → I-70 → I-15'
--  WHERE ContainerID = 1
--    AND Timestamp   = '2025-02-21 11:20:00';
-- SQL

-- manually added container 2 data
-- sqlite3 database.db <<SQL
-- INSERT INTO RouteOptimization
--   (ContainerID, Timestamp, OptimizedRoute, TrafficConditions, WeatherConditions)
-- VALUES
--   (2, '2025-04-27 17:00:00',
--    'I-45 → I-30 → I-20',
--    'Moderate traffic on I-45',
--    'Light rain');
-- SQL

-- container 3
-- sqlite3 database.db <<SQL
-- INSERT INTO RouteOptimization
--   (ContainerID, Timestamp, OptimizedRoute, TrafficConditions, WeatherConditions)
-- VALUES
--   (3, '2025-04-27 17:30:00', 'I-90 → I-94 → I-65 → I-10', 'Moderate traffic on I-90', 'Clear skies');
-- SQL
COMMIT;

