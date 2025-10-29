import React, { useState } from 'react';
import { Text, TextInput, useTheme, Button, Card, Switch, Surface, Snackbar, Portal } from 'react-native-paper';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { globalStyles } from '../../constants/globalStyles';
import { useUser } from '../../constants/UserContext';
import Login from '../../components/Login';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUser(); // Access user data and actions from context
  if (!user) return;
  const theme = useTheme();
  
  const [darkMode, setDarkMode] = useState(user.themePreference === 'dark');
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(user.dataProcessingAgreed || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notificationsEnabled || false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [successLimit, setSuccessLimit] = useState(user.successLimit);
  const [failureLimit, setFailureLimit] = useState(user.failureLimit);
  const [name, setName] = useState(user.name);
  const [snackbarVisible, setSnackbarVisible] = useState(false); // State for Snackbar visibility

  const saveLimits = async () => {
    if (!user) return; // Ensure the user is logged in
    try {
      await updateUser({ successLimit, failureLimit });
      setSnackbarVisible(true); // Show success message
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
      setSnackbarVisible(true); // Show success message
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
                    ]}>
                      Change Name
                    </Button>
                  </Card.Content>
                </Card>

                {/* Theme Toggle */}
                <Card style={globalStyles.card}>
                  <Card.Content>
                    <View style={globalStyles.inRow}>
                      <Text>Dark Mode</Text>
                      <Switch value={darkMode} onValueChange={handleToggleTheme} />
                    </View>
                  </Card.Content>
                </Card>

                {/* Data Policy */}
                <Card style={globalStyles.card}>
                  <Card.Content>
                    <View style={globalStyles.inRow}>
                      <Text>Data Policy Acceptance</Text>
                      <Switch value={dataPolicyAccepted} onValueChange={handleToggleDataPolicy} />
                    </View>
                  </Card.Content>
                </Card>

                {/* Notifications */}
                <Card style={globalStyles.card}>
                  <Card.Content>
                    <View style={globalStyles.inRow}>
                      <Text>Enable Notifications</Text>
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
                      value={successLimit !== null ? successLimit.toString() : ''} // Allow empty input
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
                      value={failureLimit !== null ? failureLimit.toString() : ''} // Allow empty input
                      onChangeText={(text) => setFailureLimit(parseInt(text) || 0)}
                      style={globalStyles.input}
                    />
                    {/* Error Messages */}
                    {failureLimit >= successLimit && (
                      <Text style={{ color: 'red', marginBottom: 8 }}>
                        Failure limit must be smaller than success limit.
                      </Text>
                    )}
                    {successLimit > 100 && (
                      <Text style={{ color: 'red', marginBottom: 8 }}>
                        Success limit cannot be greater than 100.
                      </Text>
                    )}
                    {failureLimit < 0 && (
                      <Text style={{ color: 'red', marginBottom: 8 }}>
                        Failure limit cannot be less than 0.
                      </Text>
                    )}
                    <Button
                      mode="contained"
                      onPress={async () => {
                        await saveLimits();
                        setSnackbarVisible(true); // Show success message
                      }}
                      disabled={
                        successLimit === null || // Ensure successLimit is not empty
                        failureLimit === null || 
                        successLimit <= failureLimit || // Check if successLimit is greater than failureLimit
                        successLimit > 100 || // Check if successLimit is greater than 100
                        failureLimit < 0 || // Check if failureLimit is less than 0
                        (successLimit === user.successLimit && failureLimit === user.failureLimit) // Check if values have changed
                      }
                      style={[
                        globalStyles.button,
                        (successLimit === null || // Ensure successLimit is not empty
                          failureLimit === null || 
                          successLimit <= failureLimit ||
                          successLimit > 100 ||
                          failureLimit < 0 ||
                          (successLimit === user.successLimit &&
                            failureLimit === user.failureLimit)) && { backgroundColor: '#ccc' }, // Gray background when disabled
                      ]}
                    >
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
        </ScrollView>
      </TouchableWithoutFeedback>
      {/* Snackbar for Success Message */}
      {/* Success Message */}
<Portal>
  <Snackbar
    visible={snackbarVisible}
    onDismiss={() => setSnackbarVisible(false)}
    duration={2000} // Automatically disappear after 2 seconds
    style={globalStyles.successMessageContainer} // Custom style for positioning
  >
    <MaterialCommunityIcons name="check-circle-outline" size={80} color={theme.colors.primary} />
  </Snackbar>
</Portal>
    </KeyboardAvoidingView>
  );
}