import React, { useState } from 'react';
import { Text, Button, Card, Switch, Surface } from 'react-native-paper';
import { globalStyles } from '../../constants/globalStyles';
import { useUser } from '../../constants/UserContext';
import Login from '../../components/Login';

export default function ProfileScreen() {
  const { user, logout } = useUser(); // Access user data and actions from context
  const [darkMode, setDarkMode] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);

  return (
    <Surface style={globalStyles.display} elevation={0}>
      {!user ? (
        <>
          <Text variant="headlineMedium" style={{ marginBottom: 16 }}>Welcome!</Text>
          <Button mode="contained" onPress={() => setLoginVisible(true)}>
            Login or Sign Up
          </Button>
          {loginVisible && <Login onClose={() => setLoginVisible(false)} />}
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
          <Button mode="contained" onPress={logout}>
            Logout
          </Button>
        </>
      )}
    </Surface>
  );
}