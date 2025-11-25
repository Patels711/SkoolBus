// skoolbus-server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectToMongo, getDb, closeDb } = require('./db');
const { findUserAndVerify, createUser, updateBusLocation, updateStudentAttendance, getStudentAttendance, getAllStudents } = require('./users');

const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());
app.use(cors()); 


app.get('/', (req, res) => {
  res.send('SkoolBus API is running successfully!');
});


app.post('/api/login', async (req, res) => {
  const { username, password, uniqueId, accountType } = req.body;

  if (!username || !password || !accountType || !uniqueId) {
    return res.status(400).json({ success: false, message: "Missing credentials or account type." });
  }

  try {
    const user = await findUserAndVerify({ username, password, uniqueId, accountType });

    if (user) {
      return res.json({
        success: true,
        message: `Welcome aboard, ${user.username}! Your ID is ${user.uniqueId}. Please remember this ID for future logins.`,
        user: { username: user.username, role: accountType, id: user._id, uniqueId: user.uniqueId }
      });
    } else {
      return res.status(401).json({ success: false, message: "Invalid username/password/ID." });
    }
  } catch (error) {
    console.error("Server error during login:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});


app.post('/api/signup', async (req, res) => {
  const { username, password, email, accountType } = req.body;

  if (!username || !password || !email || !accountType) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const newUser = await createUser({ username, password, email, accountType });
    return res.json({
      success: true,
      message: `Account created successfully! Your ID is ${newUser.uniqueId}. Please remember this ID for login.`,
      user: { username: newUser.username, role: accountType, id: newUser._id, uniqueId: newUser.uniqueId }
    });
  } catch (error) {
    console.error("Server error during signup:", error);
    if (error.message.includes("Username already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get('/api/markers/:driverId', async (req, res) => {
  const { driverId } = req.params;
  try {
    const db = getDb();
    const driverData = await db.collection('driverMarkers').findOne({ driverId });
    res.json(driverData || { markers: [] });
  } catch (err) {
    console.error("Error fetching markers:", err);
    res.status(500).json({ error: 'Failed to fetch markers' });
  }
});


app.get('/api/markers/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const db = getDb();
    const driverData = await db.collection('driverMarkers').findOne({
      'markers.studentId': studentId
    });
    if (driverData) {
      res.json({ markers: driverData.markers, busInfo: driverData.busInfo });
    } else {
      res.json({ markers: [], busInfo: {} });
    }
  } catch (err) {
    console.error("Error fetching student markers:", err);
    res.status(500).json({ error: 'Failed to fetch student markers' });
  }
});

app.post('/api/markers/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { latitude, longitude, name, studentId } = req.body;

  if (latitude == null || longitude == null || !name || !studentId) {
    return res.status(400).json({ error: 'Missing marker data' });
  }

  try {
    const db = getDb();
    await db.collection('driverMarkers').updateOne(
      { driverId },
      { $push: { markers: { latitude, longitude, name, studentId } } },
      { upsert: true } 
    );
    res.json({ success: true, message: 'Marker saved!' });
  } catch (err) {
    console.error("Error saving marker:", err);
    res.status(500).json({ error: 'Failed to save marker' });
  }
});


app.post('/api/markers', async (req, res) => {
  const { driverId, busInfo, markers } = req.body;

  if (!driverId || !markers) {
    return res.status(400).json({ success: false, message: "Missing data." });
  }

  try {
    const db = getDb();
    await db.collection("driverMarkers").updateOne(
      { driverId },
      { $set: { markers, busInfo } },
      { upsert: true }
    );
    res.json({ success: true, message: "Markers saved." });
  } catch (err) {
    console.error("Error updating markers:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/bus-location/:driverId', async (req, res) => {
  const { driverId } = req.params;
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: "Missing location data." });
  }

  try {
    await updateBusLocation({
      driverId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date()
    });
    res.json({ success: true, message: "Bus location updated." });
  } catch (error) {
    console.error("Server error updating bus location:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});


app.get('/api/bus-location/:driverId', async (req, res) => {
  const { driverId } = req.params;
  try {
    const db = getDb();
    const driver = await db.collection('users').findOne(
      { uniqueId: driverId, accountType: "Bus Driver" },
      { projection: { currentLocation: 1, lastLocationUpdate: 1 } }
    );
    if (!driver) {
      return res.status(404).json({ success: false, message: "Bus driver not found." });
    }
    res.json({ success: true, location: driver.currentLocation, lastUpdate: driver.lastLocationUpdate });
  } catch (error) {
    console.error("Server error fetching bus location:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post('/api/attendance/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const { attendance } = req.body;

  if (!attendance || !['present', 'absent'].includes(attendance)) {
    return res.status(400).json({ success: false, message: "Invalid attendance value. Must be 'present' or 'absent'." });
  }

  try {
    await updateStudentAttendance({ studentId, attendance });
    res.json({ success: true, message: "Attendance updated successfully." });
  } catch (error) {
    console.error("Server error updating attendance:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});


app.get('/api/attendance/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const data = await getStudentAttendance({ studentId });
    res.json(data);
  } catch (error) {
    console.error("Server error fetching attendance:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post('/api/admin/add-student', async (req, res) => {
  const { username, password, email, name } = req.body;

  if (!username || !password || !email || !name) {
    return res.status(400).json({ success: false, message: "Missing required fields: username, password, email, name." });
  }

  try {
    const newStudent = await createUser({ username, password, email, accountType: "Student" });
    const db = getDb();
    await db.collection("users").updateOne(
      { _id: newStudent._id },
      { $set: { name: name } }
    );

    res.json({
      success: true,
      message: `Student ${name} added successfully! Student ID: ${newStudent.uniqueId}`,
      student: { ...newStudent, name }
    });
  } catch (error) {
    console.error("Server error adding student:", error);
    if (error.message.includes("Username already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get('/api/admin/students', async (req, res) => {
  try {
    const students = await getAllStudents();
    res.json({ success: true, students });
  } catch (error) {
    console.error("Server error fetching students:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});


connectToMongo()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`SkoolBus Server running at http://0.0.0.0:${port}`);
    });
  })
  .catch(err => {
    console.error("Server failed to start due to DB error:", err);
    process.exit(1);
  });

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  closeDb();
  process.exit(0);
});
