import React, { useState } from 'react';
import { Text, Button, TextInput, Modal, Portal, SegmentedButtons } from 'react-native-paper';
import { useUser } from '../constants/UserContext';

interface LoginProps {
  onClose: () => void; // Callback to close the modal
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const { login } = useUser(); // Access the login function from context
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState(''); // Only used for signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    await login(email, password, authMode, name); // Pass the name parameter
    onClose(); // Close the modal after login/signup
    setName('');
    setEmail('');
    setPassword('');
  };

  const isSignupDisabled = authMode === 'signup' && (!name.trim() || !email.trim() || !password.trim());
  const isLoginDisabled = authMode === 'login' && (!email.trim() || !password.trim());

  return (
    <Portal>
      <Modal visible onDismiss={onClose}>
        <Text variant="titleLarge" style={{ marginBottom: 16 }}>
          {authMode === 'login' ? 'Login' : 'Sign Up'}
        </Text>
        <SegmentedButtons
          value={authMode}
          onValueChange={setAuthMode}
          buttons={[
            { value: 'login', label: 'Login' },
            { value: 'signup', label: 'Sign Up' },
          ]}
          style={{ marginBottom: 16 }}
        />
        {authMode === 'signup' && (
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={{ marginBottom: 12 }}
          />
        )}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          style={{ marginBottom: 12 }}
        />
        <Button
          mode="contained"
          onPress={handleAuth}
          disabled={authMode === 'signup' ? isSignupDisabled : isLoginDisabled}
        >
          {authMode === 'login' ? 'Login' : 'Sign Up'}
        </Button>
      </Modal>
    </Portal>
  );
};

export default Login;