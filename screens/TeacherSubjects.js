import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Video } from 'expo-av';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { AntDesign } from '@expo/vector-icons';

export default function TeacherSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Fetch subjects from Firestore
  const fetchSubjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'subjects'));
      const subjectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const groupedSubjects = subjectsData.reduce((acc, item) => {
        acc[item.subjectName] = acc[item.subjectName] || [];
        acc[item.subjectName].push(item);
        return acc;
      }, {});

      setSubjects(groupedSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Handle File Selection
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedFile = result.assets[0];
      console.log('Selected File:', selectedFile);

      setFile(selectedFile);
      setFileType(selectedFile.mimeType?.startsWith('video') ? 'Video' : 'Notes');
    } catch (error) {
      console.error('File selection error:', error);
      Alert.alert('Error', 'Could not pick file. Please try again.');
    }
  };

  // Upload file to Firebase Storage and save URL to Firestore
  const uploadContent = async () => {
    if (!subjectName.trim() || !topic.trim() || !file) {
      Alert.alert('Missing Fields', 'Please fill all fields and select a file.');
      return;
    }

    setUploading(true);
    try {
      const fileRef = ref(storage, `subjects/${Date.now()}_${file.name}`);
      const response = await fetch(file.uri);
      const blob = await response.blob();
      await uploadBytes(fileRef, blob);

      const downloadURL = await getDownloadURL(fileRef);
      console.log('Uploaded File URL:', downloadURL);

      await addDoc(collection(db, 'subjects'), {
        subjectName,
        topic,
        fileType,
        fileUrl: downloadURL,
        fileName: file.name,
        createdAt: new Date().toISOString(),
      });

      await fetchSubjects();

      Alert.alert('Success', 'Content uploaded successfully!');
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload content: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setModalVisible(false);
    setSubjectName('');
    setTopic('');
    setFile(null);
    setFileType(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.keys(subjects).length === 0 ? (
          <Text style={styles.noDataText}>No subjects available yet.</Text>
        ) : (
          Object.keys(subjects).map(subject => (
            <View key={subject} style={styles.subjectCard}>
              <Text style={styles.subjectTitle}>{subject}</Text>
              {subjects[subject].map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.contentCard}
                  onPress={() => {
                    if (item.fileType === 'Video') {
                      setSelectedVideo(item.fileUrl);
                      setVideoModal(true);
                    }
                  }}
                >
                  <Text style={styles.topicText}>📚 {item.topic}</Text>
                  <Text style={styles.fileName}>{item.fileName}</Text>
                  <Text style={styles.fileType}>{item.fileType}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setModalVisible(true)}>
        <AntDesign name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Content</Text>

            <TextInput
              style={styles.input}
              placeholder="Subject Name"
              placeholderTextColor="#888"
              value={subjectName}
              onChangeText={setSubjectName}
            />
            <TextInput
              style={styles.input}
              placeholder="Topic"
              placeholderTextColor="#888"
              value={topic}
              onChangeText={setTopic}
            />

            <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
              <Text style={styles.fileButtonText}>
                {file ? `Selected: ${file.name}` : 'Pick a File (Video/Notes)'}
              </Text>
            </TouchableOpacity>

            {uploading ? (
              <ActivityIndicator size="large" color="#2ecc71" style={styles.uploadingIndicator} />
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={uploadContent}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Video Modal */}
      <Modal visible={videoModal} animationType="slide" transparent={false} onRequestClose={() => setVideoModal(false)}>
        <View style={styles.videoContainer}>
          {selectedVideo && (
            <Video
              source={{ uri: selectedVideo }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
              shouldPlay
              onError={(error) => {
                console.error('Video Playback Error:', error);
                Alert.alert('Error', 'Failed to play video.');
              }}
              onLoad={() => console.log('Video Loaded Successfully')}
            />
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => setVideoModal(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  subjectCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 4 },
  subjectTitle: { fontSize: 22, fontWeight: '700', color: '#2c3e50', marginBottom: 10 },
  contentCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginTop: 8 },
  topicText: { fontSize: 16, fontWeight: '600', color: '#34495e' },
  fileName: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
  fileType: { fontSize: 12, color: '#3498db', marginTop: 2 },
  noDataText: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginTop: 20 },
  floatingButton: { 
    position: 'absolute', 
    bottom: 25, 
    right: 25, 
    backgroundColor: '#2ecc71', 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 6 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    width: '85%', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    elevation: 5 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#2c3e50', 
    marginBottom: 15, 
    textAlign: 'center' 
  },
  input: { 
    width: '100%', 
    backgroundColor: '#f8f9fa', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    fontSize: 16 
  },
  fileButton: { 
    backgroundColor: '#3498db', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 15 
  },
  fileButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  uploadButton: { 
    backgroundColor: '#2ecc71', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 10 
  },
  uploadButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  cancelButton: { 
    backgroundColor: '#e74c3c', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  cancelButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  uploadingIndicator: { 
    marginVertical: 15 
  },
  videoContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000' 
  },
  videoPlayer: { 
    width: '100%', 
    height: '60%' 
  },
  closeButton: { 
    marginTop: 20, 
    padding: 10, 
    backgroundColor: 'red', 
    borderRadius: 5 
  },
  closeButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});