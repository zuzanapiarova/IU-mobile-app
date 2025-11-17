import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, Button, TextInput, SegmentedButtons } from 'react-native-paper';
import { useUser } from '../constants/UserContext';
import { globalStyles } from '@/constants/globalStyles';
import { useRouter } from 'expo-router';
import Background from '@/components/Background';
import Loading from '@/components/Loading';

const Login: React.FC = () =>
{
  const { login, user, errorMessage, clearErrorMessage } = useUser();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // authoenticate user 
  const handleAuth = async () => {
    setLoading(true);
    try {
      await login(email, password, authMode, name);
      if (user) router.replace('/(tabs)');
    } catch (error) {
      alert(`Failed to authenticate: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // navigate to the app after login/signup
  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user, router]);

  const isSignupDisabled = authMode === 'signup' && (!name.trim() || !email.trim() || !password.trim());
  const isLoginDisabled = authMode === 'login' && (!email.trim() || !password.trim());

  if (loading) return <Loading/>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}>
        <Background />
      </View>
    <View style={[globalStyles.container, {flex: 1, justifyContent: 'center' }]}>
      <Text variant="titleLarge" style={[globalStyles.title, {textAlign: 'center', marginBottom: 16}]}>
        {authMode === 'login' ? 'Login' : 'Sign Up'}
      </Text>

      {/* Signup or Login selection */}
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

      {/* User inputs  */}
      {authMode === 'signup' && (
        <TextInput
          label="Name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearErrorMessage();
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
        }}
        mode="outlined"
        style={[globalStyles.input]}
      />

      {/* Display error message */}
      {errorMessage && (
        <Text style={[globalStyles.red, {marginTop: 8,textAlign: 'center'}]}>
          {errorMessage}
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