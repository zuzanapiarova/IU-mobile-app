import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, Button, TextInput, SegmentedButtons } from 'react-native-paper';
import { useUser } from '../constants/UserContext';
import { globalStyles } from '@/constants/globalStyles';
import { useRouter } from 'expo-router';
import Background from '@/components/Background';
import Loading from '@/components/Loading';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

const Login: React.FC = () => {
  const { login, user, errorMessage, clearErrorMessage } = useUser();
  const router = useRouter();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // local UI error (no internet / backend unreachable)
  const [localError, setLocalError] = useState<string | null>(null);

  // authenticate user
  const handleAuth = async () => {
    setLoading(true);
    setLocalError(null);
    clearErrorMessage();

    try {
      // check if internet is connected
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setLocalError('No internet connection. You need an internet connection to login or sign up.');
        setLoading(false);
        return;
      }

      // check if backend is reachable
      const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000';
      try {
        await axios.get(`${backendUrl}/health`);
      } catch (backendError) {
        setLocalError('The server is not reachable. Please try again later.');
        setLoading(false);
        return;
      }

      // attempt login/signup
      await login(email, password, authMode, name);
      if (user) router.replace('/(tabs)');

    } catch (error) {
      setLocalError('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to the app after login/signup
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user, router]);

  const isSignupDisabled =
    authMode === 'signup' && (!name.trim() || !email.trim() || !password.trim());
  const isLoginDisabled =
    authMode === 'login' && (!email.trim() || !password.trim());

  if (loading) return <Loading />;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
          <Background />
        </View>
        <View style={[globalStyles.container, { flex: 1, justifyContent: 'center' }]}>
          <Text variant="titleLarge" style={[globalStyles.title, { textAlign: 'center', marginBottom: 16 }]}>
            {authMode === 'login' ? 'Login' : 'Sign Up'}
          </Text>

          {/* Signup or Login selection */}
          <SegmentedButtons
            value={authMode}
            onValueChange={(value) => {
              setAuthMode(value);
              clearErrorMessage();
              setLocalError(null);
            }}
            buttons={[
              { value: 'login', label: 'Login' },
              { value: 'signup', label: 'Sign Up' },
            ]}
            style={[globalStyles.segmentedButtons, globalStyles.inputCard]}
          />

          {/* User inputs  */}
          {authMode === 'signup' && (
            <TextInput
              label="Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearErrorMessage();
                setLocalError(null);
              }}
              mode="outlined"
              style={[globalStyles.input]}
            />
          )}
          <TextInput
            label="Email"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            onChangeText={(text) => {
              setEmail(text);
              clearErrorMessage();
              setLocalError(null);
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
              clearErrorMessage();
              setLocalError(null);
            }}
            mode="outlined"
            style={[globalStyles.input]}
          />

          {/* Display error messages */}
          {(localError || errorMessage) && (
            <Text style={[globalStyles.red, { marginTop: 8, textAlign: 'center' }]}>
              {localError || errorMessage}
            </Text>
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