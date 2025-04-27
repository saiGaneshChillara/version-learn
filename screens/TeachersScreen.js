import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function TeachersScreen() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('userType', '==', 'teacher'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const teachersList = [];
      querySnapshot.forEach((doc) => {
        teachersList.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teachersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegisterTeacher = async () => {
    try {
      setError('');
      setRegistering(true);

      if (!username || !phone || !subject || !type || !email || !password) {
        setError('All fields are required');
        setRegistering(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        username,
        userType: 'teacher',
        phone,
        subject,
        type,
        email,
        createdAt: new Date().toISOString(),
      });

      // Show success popup
      Alert.alert(
        'Success',
        'Teacher added successfully!',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );

      // Clear form and hide it, staying on the same screen
      setUsername('');
      setPhone('');
      setSubject('');
      setType('');
      setEmail('');
      setPassword('');
      setRegistering(false);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
      setRegistering(false);
    }
  };

  const renderTeacher = ({ item }) => (
    <View style={styles.teacherItem}>
      <Text style={styles.teacherName}>{item.username || 'N/A'}</Text>
      <Text style={styles.teacherDetail}>Email: {item.email || 'N/A'}</Text>
      <Text style={styles.teacherDetail}>Phone: {item.phone || 'N/A'}</Text>
      <Text style={styles.teacherDetail}>Subject: {item.subject || 'N/A'}</Text>
      <Text style={styles.teacherDetail}>Type: {item.type || 'N/A'}</Text>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <Text>Loading teachers...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Teachers</Text>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.addButtonText}>
          {showForm ? 'Hide Form' : 'Add Teacher'}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Register New Teacher</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Type (e.g., Full-time, Part-time)"
            value={type}
            onChangeText={setType}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, registering && styles.buttonDisabled]}
            onPress={handleRegisterTeacher}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register Teacher</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {teachers.length === 0 ? (
        <Text style={styles.screenText}>No teachers registered yet.</Text>
      ) : (
        <FlatList
          data={teachers}
          renderItem={renderTeacher}
          keyExtractor={item => item.id}
          style={styles.list}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  screenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#ff3333',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  list: {
    width: '100%',
    marginBottom: 20,
  },
  teacherItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  teacherDetail: {
    fontSize: 14,
    color: '#666',
  },
});