import React, { useState } from 'react';
import { Text, TextInput, Button, Card, Switch, Surface } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { globalStyles } from '../../constants/globalStyles';
import { useUser } from '../../constants/UserContext';
import Login from '../../components/Login';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUser(); // Access user data and actions from context
  if (!user) return;

  const [darkMode, setDarkMode] = useState(user.themePreference === 'dark');
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(user.dataProcessingAgreed || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notificationsEnabled || false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [successLimit, setSuccessLimit] = useState(user.successLimit);
  const [failureLimit, setFailureLimit] = useState(user.failureLimit);
  const [name, setName] = useState(user.name);

  const saveLimits = async () => {
    if (!user) return; // Ensure the user is logged in
    try {
      await updateUser({ successLimit, failureLimit });
      alert('Limits updated successfully!');
    } catch (error) {
      console.error('Error updating limits:', error);
      alert('Failed to update limits. Please try again.');
    }
  };

  const handleToggleTheme = async () => {
    const newTheme = darkMode ? 'light' : 'dark';
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

  const handleNameChange = async () => {
    if (!name.trim()) {
      alert('Name cannot be empty.');
      return;
    }
    try {
      await updateUser({ name });
      alert('Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name. Please try again.');
    }
  };

  return (
    <Surface style={globalStyles.display} elevation={0}>
      {!user ? (
        <View style={globalStyles.center}>
          <Text variant="headlineMedium" style={globalStyles.title}>Welcome!</Text>
          <Button mode="contained" onPress={() => setLoginVisible(true)}>
            Login or Sign Up
          </Button>
          {loginVisible && <Login onClose={() => setLoginVisible(false)} />}
        </View>
      ) : (
        <>
          <Text variant="headlineMedium" style={[globalStyles.title, globalStyles.header]}>Profile</Text>

          {/* User Info */}
          <Card style={globalStyles.card}>
            <Card.Content>
              <Text style={globalStyles.title}>Name</Text>
              <TextInput
                mode="outlined"
                value={name}
                onChangeText={setName}
                style={globalStyles.input}
              />
              <Button
                mode="contained"
                onPress={handleNameChange}
                disabled={name.trim() === user.name.trim()} // Disable if no change in name
                style={[
                  globalStyles.button,
                  name.trim() === user.name.trim() && { backgroundColor: '#ccc' }, // Gray background when disabled
                ]}
              >
                Change Name
              </Button>
            </Card.Content>
          </Card>

          {/* Theme Toggle */}
          <Card style={globalStyles.card}>
            <Card.Content>
              <View style={globalStyles.inRow}>
                <Text style={globalStyles.text}>Dark Mode</Text>
                <Switch value={darkMode} onValueChange={handleToggleTheme} />
              </View>
            </Card.Content>
          </Card>

          {/* Data Policy and Notifications */}
          <Card style={globalStyles.card}>
            <Card.Content>
              <View style={globalStyles.inRow}>
                <Text style={[globalStyles.text, {paddingBottom: 10}]}>Data Policy Accepted</Text>
                <Switch value={dataPolicyAccepted} onValueChange={handleToggleDataPolicy} />
              </View>
              <View style={globalStyles.inRow}>
                <Text style={[globalStyles.text, {marginTop: 10}]}>Notifications Enabled</Text>
                <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
              </View>
            </Card.Content>
          </Card>

          {/* Success and Failure Limits */}
          <Card style={globalStyles.card}>
            <Card.Content>
              <Text style={globalStyles.title}>Success Limit</Text>
              <Text style={globalStyles.text}>
                Percentage of completed habits at which the day is considered successful
              </Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={successLimit.toString()}
                onChangeText={(text) => setSuccessLimit(parseInt(text) || 0)}
                style={globalStyles.input}
              />

              <Text style={globalStyles.title}>Failure Limit</Text>
              <Text style={globalStyles.text}>
                Percentage of completed habits at which the day is considered unsuccessful
              </Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={failureLimit.toString()}
                onChangeText={(text) => setFailureLimit(parseInt(text) || 0)}
                style={globalStyles.input}
              />

              <Button mode="contained" onPress={saveLimits} style={globalStyles.button}>
                Save Limits
              </Button>
            </Card.Content>
          </Card>

          {/* Logout Button */}
          <Button mode="contained" onPress={logout} style={[globalStyles.button, { marginTop: 16 }]}>
            Logout
          </Button>
        </>
      )}
    </Surface>
  );
}