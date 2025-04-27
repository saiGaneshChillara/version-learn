import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function LoginScreen({ navigation, setIsGuest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
      setResetError('');
      setResetEmail(''); // Clear the input after success
    } catch (err) {
      setResetError('Error: ' + err.message);
      setResetMessage('');
    }
  };

  return (
    <LinearGradient colors={['#4CAF50', '#1DB954']} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.toggleText}>Need an account? Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* Forgot Password Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setResetMessage('');
            setResetError('');
            setResetEmail('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your email"
                placeholderTextColor="#aaa"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
              />
              {resetMessage ? (
                <Text style={styles.successMessage}>{resetMessage}</Text>
              ) : null}
              {resetError ? (
                <Text style={styles.errorMessage}>{resetError}</Text>
              ) : null}
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.modalButtonText}>Send Reset Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setResetMessage('');
                  setResetError('');
                  setResetEmail('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    paddingTop: StatusBar.currentHeight || 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  toggleText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  guestButton: {
    backgroundColor: '#555',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  successMessage: {
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  errorMessage: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});