// components/markers.js
import { Platform } from 'react-native';

const SERVER_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://0.0.0.0:3000';

/**
 * Fetch all markers for a driver
 * @param {string} driverId 
 * @returns {Promise<Array>} Array of markers
 */
export async function fetchMarkers(driverId) {
  try {
    console.log('fetchMarkers called with driverId:', driverId);
    console.log('SERVER_URL:', SERVER_URL);
    const url = `${SERVER_URL}/api/markers/${driverId}`;
    console.log('Fetching from URL:', url);
    const res = await fetch(url);
    console.log('Response status:', res.status);
    if (!res.ok) throw new Error('Failed to fetch markers');
    const data = await res.json();
    console.log('Response data:', data);
    return data.markers || [];
  } catch (err) {
    console.error('Error fetching markers:', err);
    return [];
  }
}

/**
 * Add a single new marker for a driver
 * @param {string} driverId 
 * @param {{latitude:number, longitude:number, name:string, studentId:string}} marker 
 * @returns {Promise<Object>}
 */
export async function addMarker(driverId, marker) {
  try {
    const res = await fetch(`${SERVER_URL}/api/markers/${driverId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marker)
    });
    if (!res.ok) throw new Error('Failed to save marker');
    return await res.json();
  } catch (err) {
    console.error('Error adding marker:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Replace all markers for a driver (batch update)
 * @param {string} driverId
 * @param {Array} markers
 * @param {Object} busInfo Optional
 * @returns {Promise<Object>}
 */
export async function updateMarkers(driverId, markers, busInfo = {}) {
  try {
    const res = await fetch(`${SERVER_URL}/api/markers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, markers, busInfo })
    });
    if (!res.ok) throw new Error('Failed to update markers');
    return await res.json();
  } catch (err) {
    console.error('Error updating markers:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch markers for a student
 * @param {string} studentId
 * @returns {Promise<Object>} Object with markers array and busInfo
 */
export async function fetchStudentMarkers(studentId) {
  try {
    const res = await fetch(`${SERVER_URL}/api/markers/student/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch student markers');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching student markers:', err);
    return { markers: [], busInfo: {} };
  }
}

/**
 * Fetch bus location for a driver
 * @param {string} driverId
 * @returns {Promise<Object>} Object with location data
 */
export async function fetchBusLocation(driverId) {
  try {
    const res = await fetch(`${SERVER_URL}/api/bus-location/${driverId}`);
    if (!res.ok) throw new Error('Failed to fetch bus location');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching bus location:', err);
    return { success: false, location: null };
  }
}

/**
 * Update student attendance
 * @param {string} studentId
 * @param {string} attendance - 'present' or 'absent'
 * @returns {Promise<Object>}
 */
export async function updateStudentAttendance(studentId, attendance) {
  try {
    const res = await fetch(`${SERVER_URL}/api/attendance/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance })
    });
    if (!res.ok) throw new Error('Failed to update attendance');
    return await res.json();
  } catch (err) {
    console.error('Error updating attendance:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get student attendance
 * @param {string} studentId
 * @returns {Promise<Object>} Object with attendance data
 */
export async function getStudentAttendance(studentId) {
  try {
    const res = await fetch(`${SERVER_URL}/api/attendance/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching attendance:', err);
    return { success: false, attendance: 'present' };
  }
}

/**
 * Add a new student (admin function)
 * @param {Object} studentData - {username, password, email, name}
 * @returns {Promise<Object>}
 */
export async function addStudent(studentData) {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/add-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    if (!res.ok) throw new Error('Failed to add student');
    return await res.json();
  } catch (err) {
    console.error('Error adding student:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all students with attendance (admin function)
 * @returns {Promise<Object>} Object with students array
 */
export async function getAllStudents() {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/students`);
    if (!res.ok) throw new Error('Failed to fetch students');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error fetching students:', err);
    return { success: false, students: [] };
  }
}
