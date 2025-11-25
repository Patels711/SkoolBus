const { getDb } = require("./db");

async function findUserAndVerify({ username, password, uniqueId, accountType }) {
  const db = getDb(); 
  try {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({
      username,
      password,
      uniqueId,
      accountType
    });

    if (!user) return null;
    return user;
  } catch (err) {
    console.error("[DB ERROR] findUserAndVerify failed:", err);
    throw new Error("Database query failed.");
  }
}

async function createUser({ username, password, email, accountType }) {
  const db = getDb();
  try {
    const usersCollection = db.collection("users");


    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      throw new Error("Username already exists. Please choose a different username.");
    }


    const prefix = accountType === 'Student' ? 'S' : accountType === 'Bus Driver' ? 'D' : 'A';
    const count = await usersCollection.countDocuments({ accountType });
    const uniqueId = `${prefix}${String(count + 1).padStart(3, '0')}`;

    const newUser = {
      username,
      password,
      email,
      accountType,
      uniqueId,
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  } catch (err) {
    console.error("[DB ERROR] createUser failed:", err);
    throw err; }
}

async function updateBusLocation({ driverId, latitude, longitude, timestamp }) {
  const db = getDb();
  try {
    const usersCollection = db.collection("users");
    const result = await usersCollection.updateOne(
      { uniqueId: driverId, accountType: "Bus Driver" },
      {
        $set: {
          currentLocation: { latitude, longitude, timestamp },
          lastLocationUpdate: new Date()
        }
      }
    );
    if (result.matchedCount === 0) {
      throw new Error("Bus driver not found");
    }
    return { success: true };
  } catch (err) {
    console.error("[DB ERROR] updateBusLocation failed:", err);
    throw err;
  }
}

async function updateStudentAttendance({ studentId, attendance }) {
  const db = getDb();
  try {
    const usersCollection = db.collection("users");
    const result = await usersCollection.updateOne(
      { uniqueId: studentId, accountType: "Student" },
      {
        $set: {
          attendance: attendance,
          lastAttendanceUpdate: new Date()
        }
      }
    );
    if (result.matchedCount === 0) {
      throw new Error("Student not found");
    }
    return { success: true };
  } catch (err) {
    console.error("[DB ERROR] updateStudentAttendance failed:", err);
    throw err;
  }
}

async function getStudentAttendance({ studentId }) {
  const db = getDb();
  try {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne(
      { uniqueId: studentId, accountType: "Student" },
      { projection: { attendance: 1, lastAttendanceUpdate: 1 } }
    );
    if (!user) {
      throw new Error("Student not found");
    }
    return { success: true, attendance: user.attendance || 'present', lastUpdate: user.lastAttendanceUpdate };
  } catch (err) {
    console.error("[DB ERROR] getStudentAttendance failed:", err);
    throw err;
  }
}

async function getAllStudents() {
  const db = getDb();
  try {
    const usersCollection = db.collection("users");
    const students = await usersCollection.find({ accountType: "Student" }).toArray();


    const studentsWithAttendance = await Promise.all(
      students.map(async (student) => {
        try {
          const attendanceData = await getStudentAttendance({ studentId: student.uniqueId });
          return {
            ...student,
            attendance: attendanceData.attendance,
            lastAttendanceUpdate: attendanceData.lastUpdate
          };
        } catch (error) {
          console.error(`Error fetching attendance for ${student.uniqueId}:`, error);
          return {
            ...student,
            attendance: 'unknown'
          };
        }
      })
    );

    return studentsWithAttendance;
  } catch (err) {
    console.error("[DB ERROR] getAllStudents failed:", err);
    throw new Error("Database query failed.");
  }
}

module.exports = { findUserAndVerify, createUser, updateBusLocation, updateStudentAttendance, getStudentAttendance, getAllStudents };
