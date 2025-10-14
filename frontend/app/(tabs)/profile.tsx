import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, Button, Card, TextInput, useTheme, Modal, Portal, SegmentedButtons, Switch, Surface } from 'react-native-paper';
import { globalStyles } from '../../constants/globalStyles'

export default function ProfileScreen() {
  const theme = useTheme();

  // Simulate user authentication state
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(theme.dark);

  const handleLogin = () => {
    setUser({ name: username });
    setModalVisible(false);
    setUsername('');
    setPassword('');
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Surface 
            style={ globalStyles.display }
            elevation={0}
    >
      {!user ? (
        <>
          <Text variant="headlineMedium" style={{ marginBottom: 16 }}>Welcome!</Text>
          
          {/* Tabs for Login / Signup */}
          <SegmentedButtons
            value={authMode}
            onValueChange={setAuthMode}
            buttons={[
              { value: 'login', label: 'Login' },
              { value: 'signup', label: 'Sign Up' },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Button mode="contained" onPress={() => setModalVisible(true)}>
            {authMode === 'login' ? 'Login' : 'Sign Up'}
          </Button>

          {/* Login / Signup Modal */}
          <Portal>
            <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)}>
              <Text variant="titleLarge" style={{ marginBottom: 16 }}>
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </Text>
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
        </>
      ) : (
        <>
          <Text variant="headlineMedium" style={{ marginBottom: 16 }}>Profile</Text>
          
          {/* User Info */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Title title={`Username: ${user.name}`} />
          </Card>

          {/* Theme Toggle */}
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <Surface>
              <Text>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </Surface>
          </Card>

          {/* Logout Button */}
          <Button mode="contained" onPress={handleLogout}>
            Logout
          </Button>
        </>
      )}
    </Surface>
  );
}


