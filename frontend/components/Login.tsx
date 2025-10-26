import React, { useState } from 'react';
import { Text, Button, TextInput, Modal, Portal, SegmentedButtons } from 'react-native-paper';
import { useUser } from '../constants/UserContext';

interface LoginProps {
  onClose: () => void; // Callback to close the modal
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const { login } = useUser(); // Access the login function from context
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    await login(username, password, authMode); // Call the login function
    onClose(); // Close the modal after login/signup
    setUsername('');
    setPassword('');
  };

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
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Password"
          value={password}
          secureTextEntry
          onChangeText={setPassword}
          style={{ marginBottom: 12 }}
        />
        <Button mode="contained" onPress={handleLogin}>
          {authMode === 'login' ? 'Login' : 'Sign Up'}
        </Button>
      </Modal>
    </Portal>
  );
};

export default Login;