CREATE TABLE DeliveryState (
    StateID   INT PRIMARY KEY,
    StateName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Route (
    RouteID       INT PRIMARY KEY,
    Origin        VARCHAR(255),
    Destination   VARCHAR(255),
    ParentRouteID INT,
    CONSTRAINT fk_route_parent FOREIGN KEY (ParentRouteID) REFERENCES Route(RouteID)
);

CREATE TABLE DeliveryCompany (
    DeliveryCompanyID INT PRIMARY KEY,
    CompanyName       VARCHAR(255)
);

CREATE TABLE Receiver (
    ReceiverID   INT PRIMARY KEY,
    ReceiverName VARCHAR(255),
    Email        VARCHAR(255),
    PhoneNumber  VARCHAR(50)
);

CREATE TABLE Shipment (
    ShipmentID        INT PRIMARY KEY,
    CurrentLatitude   FLOAT,
    CurrentLongitude  FLOAT,
    RouteID           INT,
    DepartureTime     DATETIME,
    ArrivalTime       DATETIME,
    ParentShipmentID  INT,
    ReceiverID        INT,
    DeliveryCompanyID INT,
    CONSTRAINT fk_shipment_route FOREIGN KEY (RouteID) REFERENCES Route(RouteID),
    CONSTRAINT fk_shipment_parent FOREIGN KEY (ParentShipmentID) REFERENCES Shipment(ShipmentID),
    CONSTRAINT fk_shipment_receiver FOREIGN KEY (ReceiverID) REFERENCES Receiver(ReceiverID),
    CONSTRAINT fk_shipment_company FOREIGN KEY (DeliveryCompanyID) REFERENCES DeliveryCompany(DeliveryCompanyID)
);

CREATE TABLE Container (
    ContainerID    INT PRIMARY KEY,
    Description    VARCHAR(255),
    Latitude       FLOAT,
    Longitude      FLOAT,
    GForce        FLOAT,
    Temperature    FLOAT,
    ForcedEntry    BOOLEAN,
    CurrentStateID INT,
    ShipmentID     INT,
    CONSTRAINT fk_container_state FOREIGN KEY (CurrentStateID) REFERENCES DeliveryState(StateID),
    CONSTRAINT fk_container_shipment FOREIGN KEY (ShipmentID) REFERENCES Shipment(ShipmentID)
);

CREATE TABLE ContainerStateHistory (
    HistoryID      INT PRIMARY KEY,
    ContainerID    INT NOT NULL,
    OldStateID     INT NOT NULL,
    NewStateID     INT NOT NULL,
    TransitionTime DATETIME NOT NULL,
    Reason         VARCHAR(255),
    CONSTRAINT fk_csh_container FOREIGN KEY (ContainerID) REFERENCES Container(ContainerID),
    CONSTRAINT fk_csh_old_state FOREIGN KEY (OldStateID) REFERENCES DeliveryState(StateID),
    CONSTRAINT fk_csh_new_state FOREIGN KEY (NewStateID) REFERENCES DeliveryState(StateID)
);

CREATE TABLE Sensor (
    SensorID      INT PRIMARY KEY,
    SensorType    VARCHAR(50) NOT NULL,
    ContainerID   INT,
    Calibration   VARCHAR(100),
    InstallationDate DATETIME,
    CONSTRAINT fk_sensor_container FOREIGN KEY (ContainerID) REFERENCES Container(ContainerID)
);

CREATE TABLE SensorReading (
    ReadingID     INT PRIMARY KEY,
    SensorID      INT,
    Timestamp     DATETIME NOT NULL,
    Latitude      FLOAT,
    Longitude     FLOAT,
    GForce        FLOAT,
    Temperature   FLOAT, 
    ContainerID   INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_reading_sensor FOREIGN KEY (SensorID) REFERENCES Sensor(SensorID)
);

CREATE TABLE Incident (
    IncidentID    INT PRIMARY KEY,
    ContainerID   INT NOT NULL,
    IncidentType  VARCHAR(50) NOT NULL,
    Severity      VARCHAR(20),
    Description   VARCHAR(255),
    Timestamp     DATETIME NOT NULL,
    CONSTRAINT fk_incident_container FOREIGN KEY (ContainerID) REFERENCES Container(ContainerID)
);

CREATE TABLE Notification (
    NotificationID INT PRIMARY KEY,
    UserID         INT,
    IncidentID     INT,
    Message        VARCHAR(255),
    Timestamp      DATETIME NOT NULL,
    Status         VARCHAR(50),
    CONSTRAINT fk_notification_user FOREIGN KEY (UserID) REFERENCES SystemUser(UserID),
    CONSTRAINT fk_notification_incident FOREIGN KEY (IncidentID) REFERENCES Incident(IncidentID)
);

CREATE TABLE SystemUser (
    UserID      INT PRIMARY KEY,
    Email       VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(50)
);

CREATE TABLE UserShipment (
    UserID     INT,
    ShipmentID INT,
    PRIMARY KEY (UserID, ShipmentID),
    CONSTRAINT fk_us_user FOREIGN KEY (UserID) REFERENCES SystemUser(UserID),
    CONSTRAINT fk_us_shipment FOREIGN KEY (ShipmentID) REFERENCES Shipment(ShipmentID)
);

CREATE TABLE TruckProxy (
    TruckProxyID INT PRIMARY KEY,
    DeliveryID   INT,
    RouteID      INT,
    CONSTRAINT fk_tp_route FOREIGN KEY (RouteID) REFERENCES Route(RouteID),
    CONSTRAINT fk_tp_shipment FOREIGN KEY (DeliveryID) REFERENCES Shipment(ShipmentID)
);

CREATE TABLE Driver (
    DriverID     INT PRIMARY KEY,
    Name         VARCHAR(255),
    TruckID      INT,
    TruckProxyID INT,
    CONSTRAINT fk_driver_truckproxy FOREIGN KEY (TruckProxyID) REFERENCES TruckProxy(TruckProxyID)
);

CREATE TABLE RouteChangeHistory (
    ChangeID      INT PRIMARY KEY,
    ShipmentID    INT NOT NULL,
    OldRouteID    INT,
    NewRouteID    INT,
    ChangeReason  VARCHAR(255),
    Timestamp     DATETIME NOT NULL,
    CONSTRAINT fk_rch_shipment FOREIGN KEY (ShipmentID) REFERENCES Shipment(ShipmentID)
);

CREATE TABLE Role (
    RoleID   INT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE UserRoleMapping (
    UserID INT,
    RoleID INT,
    PRIMARY KEY (UserID, RoleID),
    CONSTRAINT fk_urm_user FOREIGN KEY (UserID) REFERENCES SystemUser(UserID),
    CONSTRAINT fk_urm_role FOREIGN KEY (RoleID) REFERENCES Role(RoleID)
);

CREATE TABLE BackupLog (
    BackupID      INT PRIMARY KEY,
    BackupDate    DATETIME NOT NULL,
    Status        VARCHAR(50),
    Duration      INT,
    DataSize      FLOAT
);

CREATE TABLE RouteOptimization (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ContainerID INTEGER NOT NULL,
    Timestamp DATETIME NOT NULL,
    OptimizedRoute TEXT,
    TrafficConditions TEXT,
    WeatherConditions TEXT
);

-- CREATE TABLE sqlite_sequence(name,seq);
