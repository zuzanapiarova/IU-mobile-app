import React, { useState } from 'react';
import { Text, Button, Card, Switch, Surface } from 'react-native-paper';
import { globalStyles } from '../../constants/globalStyles';
import { useUser } from '../../constants/UserContext';
import Login from '../../components/Login';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUser(); // Access user data and actions from context
  const [darkMode, setDarkMode] = useState(false);
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(user?.dataProcessingAgreed || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled || false);
  const [loginVisible, setLoginVisible] = useState(false);

  const handleToggleTheme = async () => {
    const newTheme = user?.themePreference === 'dark' ? 'light' : 'dark';
    await updateUser({ themePreference: newTheme });
    setDarkMode(!darkMode);
  };

  const handleToggleDataPolicy = async () => {
    const newStatus = !dataPolicyAccepted;
    await updateUser({ dataProcessingAgreed: newStatus });
    setDataPolicyAccepted(newStatus);
  };

  const handleToggleNotifications = async () => {
    const newStatus = !notificationsEnabled;
    await updateUser({ notificationsEnabled: newStatus });
    setNotificationsEnabled(newStatus);
  };

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
            <Card.Title title={`Name: ${user.name}`} />
          </Card>

          {/* Theme Toggle */}
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <Surface>
              <Text>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={handleToggleTheme} />
            </Surface>
          </Card>

          {/* User Preferences */}
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <Surface>
              <Button
                mode={dataPolicyAccepted ? 'contained' : 'outlined'}
                onPress={handleToggleDataPolicy}
              >
                {dataPolicyAccepted ? 'Data Policy Accepted' : 'Accept Data Policy'}
              </Button>
              <Button
                mode={notificationsEnabled ? 'contained' : 'outlined'}
                onPress={handleToggleNotifications}
              >
                {notificationsEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
              </Button>
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