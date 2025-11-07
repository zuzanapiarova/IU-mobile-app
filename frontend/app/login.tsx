import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, SegmentedButtons } from 'react-native-paper';
import { useUser } from '../constants/UserContext';
import { globalStyles } from '@/constants/globalStyles';
import { useRouter, useRootNavigationState } from 'expo-router';

const Login: React.FC = () => {
  const { login, user, errorMessage } = useUser(); // Access the login function from context
  const router = useRouter(); // Use router for navigation
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState(''); // Only used for signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigationState = useRootNavigationState(); // Check if navigation is ready

  const handleAuth = async () => {
    setLoading(true);
    try {
      await login(email, password, authMode, name); // Pass the name parameter
      if (user) router.replace('/(tabs)'); // Navigate to the main app after login/signup
    } catch (error) {
      console.error('Error during authentication:', error);
      alert('Failed to authenticate. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigationState?.key) return; // Wait until the navigation system is ready
    if (user) {
      router.replace('/(tabs)'); // Navigate to the main app after login/signup
    }
  }, [user, navigationState]);

  const isSignupDisabled = authMode === 'signup' && (!name.trim() || !email.trim() || !password.trim());
  const isLoginDisabled = authMode === 'login' && (!email.trim() || !password.trim());

  return (
    <View style={[globalStyles.container, styles.container]}>
      <Text variant="titleLarge" style={[globalStyles.title, styles.title]}>
        {authMode === 'login' ? 'Login' : 'Sign Up'}
      </Text>
      <SegmentedButtons
        value={authMode}
        onValueChange={setAuthMode}
        buttons={[
          { value: 'login', label: 'Login' },
          { value: 'signup', label: 'Sign Up' },
        ]}
        style={[styles.segmentedButtons, globalStyles.inputCard]}
      />
      {authMode === 'signup' && (
        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={[globalStyles.input, styles.input]}
        />
      )}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={[globalStyles.input, styles.input]}
      />
      <TextInput
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        mode="outlined"
        style={[globalStyles.input, styles.input]}
      />
      {/* Display error message */}
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
      <Button
        mode="contained"
        onPress={handleAuth}
        disabled={authMode === 'signup' ? isSignupDisabled : isLoginDisabled}
        style={[globalStyles.button, styles.button]}
      >
        {authMode === 'login' ? 'Login' : 'Sign Up'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Login;