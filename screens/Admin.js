import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import BrandButton from '../components/BrandButton';
import { addStudent, getAllStudents } from '../components/markers';

export default function Admin({ navigation }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', username: '', password: '', email: '' });
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await getAllStudents();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.username || !newStudent.password || !newStudent.email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await addStudent(newStudent);
      if (result.success) {
        Alert.alert('Success', result.message);
        setNewStudent({ name: '', username: '', password: '', email: '' });
        setShowAddForm(false);
        loadStudents(); // Refresh the list
      } else {
        Alert.alert('Error', result.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceColor = (attendance) => {
    switch (attendance) {
      case 'present': return '#D4EDDA';
      case 'absent': return '#F8D7DA';
      default: return '#FFF3CD';
    }
  };

  const getAttendanceTextColor = (attendance) => {
    switch (attendance) {
      case 'present': return '#155724';
      case 'absent': return '#721C24';
      default: return '#856404';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Manage Students</Text>

      <Text style={styles.sectionTitle}>All Students ({students.length})</Text>

      {students.length === 0 ? (
        <Text style={styles.noStudents}>No students found. Add some students to get started.</Text>
      ) : (
        students.map((student) => (
          <View key={student._id} style={styles.studentCard}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{student.name || student.username}</Text>
              <Text style={styles.studentId}>ID: {student.uniqueId}</Text>
            </View>

            <View style={styles.studentDetails}>
              <Text style={styles.studentInfo}>Username: {student.username}</Text>
              <Text style={styles.studentInfo}>Email: {student.email}</Text>
            </View>

            <View style={styles.attendanceContainer}>
              <Text style={styles.attendanceLabel}>Today's Attendance:</Text>
              <View style={[styles.attendanceBadge, { backgroundColor: getAttendanceColor(student.attendance) }]}>
                <Text style={[styles.attendanceText, { color: getAttendanceTextColor(student.attendance) }]}>
                  {student.attendance ? student.attendance.charAt(0).toUpperCase() + student.attendance.slice(1) : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}

      <BrandButton title="Sign Out" onPress={() => navigation.navigate('Home')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E2C8',
    padding: 20,
  },
  title: {
    color: '#171D1C',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#171D1C',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171D1C',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#171D1C',
    marginBottom: 15,
    textAlign: 'center',
  },
  noStudents: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171D1C',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  studentDetails: {
    marginBottom: 10,
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  attendanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#171D1C',
    fontWeight: '600',
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
