INSERT INTO users (username, password, email) VALUES ('testuser1', 'password123', 'testuser1@example.com');
INSERT INTO users (username, password, email) VALUES ('testuser2', 'password456', 'testuser2@example.com');

INSERT INTO properties (name, location, owner_id) VALUES ('Property One', 'Location One', 1);
INSERT INTO properties (name, location, owner_id) VALUES ('Property Two', 'Location Two', 1);

INSERT INTO floors (number, property_id) VALUES (1, 1);
INSERT INTO floors (number, property_id) VALUES (2, 1);
INSERT INTO floors (number, property_id) VALUES (1, 2);

INSERT INTO units (name, floor_id) VALUES ('Unit 1A', 1);
INSERT INTO units (name, floor_id) VALUES ('Unit 1B', 1);
INSERT INTO units (name, floor_id) VALUES ('Unit 2A', 2);