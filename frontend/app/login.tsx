import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { Text, Button, TextInput, SegmentedButtons, useTheme } from 'react-native-paper';
import { useUser } from '../constants/UserContext';
import { globalStyles } from '@/constants/globalStyles';
import { useRouter, useRootNavigationState } from 'expo-router';
import MovingBackground from '@/components/BackgroundAnimation';

const Login: React.FC = () => {
  const theme = useTheme();
  const { login, user, errorMessage, clearErrorMessage } = useUser(); // Access the login function from context
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={{ flex: 1 }}>
      {/* Background Animation */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
        <MovingBackground />
      </View>
    <View style={[globalStyles.container, {flex: 1, justifyContent: 'center' }]}>
      <Text variant="titleLarge" style={[globalStyles.title, {textAlign: 'center', marginBottom: 16}]}>
        {authMode === 'login' ? 'Login' : 'Sign Up'}
      </Text>
      <SegmentedButtons
        value={authMode}
        onValueChange={(value) => {
          setAuthMode(value);
          clearErrorMessage();
        }}
        buttons={[
          { value: 'login', label: 'Login', },
          { value: 'signup', label: 'Sign Up'},
        ]}
        style={[globalStyles.segmentedButtons, globalStyles.inputCard]}
      />
      {authMode === 'signup' && (
        <TextInput
          label="Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearErrorMessage(); // Clear error message when typing
          }}
          mode="outlined"
          style={[globalStyles.input]}
        />
      )}
      <TextInput
        label="Email"
        value={email}
        keyboardType="email-address"    // 👈 Shows '@' and '.' on keyboard
        autoCapitalize="none"           // 👈 Prevents capital letters
        autoCorrect={false}             // 👈 Stops unwanted corrections
        textContentType="emailAddress"  // 👈 Helps with autofill / iOS hints
        onChangeText={(text) => {
          setEmail(text);
          clearErrorMessage(); // Clear error message when typing
        }}
        mode="outlined"
        style={[globalStyles.input]} 
      />
      <TextInput
        label="Password"
        value={password}
        secureTextEntry
        onChangeText={(text) => {
          setPassword(text);
          clearErrorMessage(); // Clear error message when typing
        }}
        mode="outlined"
        style={[globalStyles.input]}
      />
      {/* Display error message */}
      {errorMessage && (
        <Text style={[globalStyles.red, {marginTop: 8,textAlign: 'center'}]}>{errorMessage}</Text>
      )}
      <Button
        mode="contained"
        onPress={handleAuth}
        disabled={authMode === 'signup' ? isSignupDisabled : isLoginDisabled}
        style={globalStyles.button}
      >
        {authMode === 'login' ? 'Login' : 'Sign Up'}
      </Button>
    </View>
    </View>
    </TouchableWithoutFeedback>
  );
};

export default Login;