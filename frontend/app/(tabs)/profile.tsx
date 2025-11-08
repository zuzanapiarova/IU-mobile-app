import React, { useState, useEffect } from 'react';
import { Text, TextInput, useTheme, Button, Card, Switch, Surface, Snackbar, Portal, Modal } from 'react-native-paper';
import { View, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { globalStyles } from '../../constants/globalStyles';
import { useUser } from '../../constants/UserContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useRootNavigationState } from 'expo-router';

export default function ProfileScreen() {
  const { user, updateUser, logout } = useUser(); // Access user data and actions from context
  const theme = useTheme();
  const router = useRouter();
  const navigationState = useRootNavigationState(); // Check if navigation is ready

  const handleLogout = async () => {
    if (!navigationState?.key) return; // Wait until the navigation system is ready
    await logout(); // Perform logout
    router.replace('/login'); // Navigate to the login page
  };

  useEffect(() => {
    if (!navigationState?.key) return; // Wait until the navigation system is ready
    if (!user) {
      router.replace('/login'); // Navigate to the login page
    }
  }, [user, navigationState]);
  
  const [darkMode, setDarkMode] = useState(user?.themePreference === 'dark');
  const [dataPolicyAccepted, setDataPolicyAccepted] = useState(user?.dataProcessingAgreed || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled || false);
  const [successLimit, setSuccessLimit] = useState(user?.successLimit || 80);
  const [failureLimit, setFailureLimit] = useState(user?.failureLimit || 20);
  const [name, setName] = useState(user?.name || '');
  const [snackbarVisible, setSnackbarVisible] = useState(false); // State for Snackbar visibility
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

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
    setDarkMode(!darkMode); // Update local state immediately
    try {
      await updateUser({ themePreference: newTheme }); // Update user data asynchronously
    } catch (error) {
      console.error('Error updating theme preference:', error);
    }
  };

  const handleToggleDataPolicy = async () => {
    const newStatus = !dataPolicyAccepted;
    setDataPolicyAccepted(newStatus); // Update local state immediately
    try {
      await updateUser({ dataProcessingAgreed: newStatus }); // Update user data asynchronously
    } catch (error) {
      console.error('Error updating data policy acceptance:', error);
    }
  };

  const handleToggleNotifications = async () => {
    const newStatus = !notificationsEnabled;
    setNotificationsEnabled(newStatus); // Update local state immediately
    try {
      await updateUser({ notificationsEnabled: newStatus }); // Update user data asynchronously
    } catch (error) {
      console.error('Error updating notifications:', error);
    }
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
          <Surface style={[globalStyles.display, {backgroundColor: theme.colors.surface}]} elevation={0}>
            <Text variant="headlineMedium" style={[globalStyles.title, globalStyles.header]}>Profile</Text>

            {/* User Info */}
            <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
              <Card.Content>
                <Text style={globalStyles.title}>Name</Text>
                <TextInput
                  mode="outlined"
                  value={name}
                  onChangeText={setName}
                  style={[globalStyles.input]}
                />
                <Button
                  mode="contained"
                  onPress={handleNameChange}
                  disabled={name.trim() === user?.name?.trim()} // Disable if no change in name
                  style={globalStyles.button}>
                  Change Name
                </Button>
              </Card.Content>
            </Card>

            {/* Theme Toggle */}
            <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
              <Card.Content>
                <View style={globalStyles.inRow}>
                  <Text>Dark Mode</Text>
                  <Switch value={darkMode} onValueChange={handleToggleTheme} />
                </View>
              </Card.Content>
            </Card>

            {/* Data Policy */}
            <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
              <Card.Content>
                <View style={globalStyles.inRow}>
                  <Text>Data Policy Acceptance</Text>
                  <Switch value={dataPolicyAccepted} onValueChange={handleToggleDataPolicy} />
                </View>
              </Card.Content>
            </Card>

            {/* Notifications */}
            <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
              <Card.Content>
                <View style={globalStyles.inRow}>
                  <Text>Enable Notifications</Text>
                  <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
                </View>
              </Card.Content>
            </Card>

            {/* Success and Failure Limits */}
            <Card style={[globalStyles.card, { backgroundColor: theme.colors.background }]}>
              <Card.Content>
                <Text style={globalStyles.title}>Success Limit</Text>
                <Text style={{marginBottom: 8}}>
                  Percentage of completed habits at which the day is considered successful
                </Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={successLimit !== null ? successLimit.toString() : ''} // Allow empty input
                  onChangeText={(text) => setSuccessLimit(parseInt(text) || 0)}
                  style={[globalStyles.input, {backgroundColor: theme.colors.surface}]}
                />

                <Text style={globalStyles.title}>Failure Limit</Text>
                <Text style={{marginBottom: 8}}>
                  Percentage of completed habits at which the day is considered unsuccessful
                </Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={failureLimit !== null ? failureLimit.toString() : ''} // Allow empty input
                  onChangeText={(text) => setFailureLimit(parseInt(text) || 0)}
                  style={[globalStyles.input, {backgroundColor: theme.colors.surface}]}
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
                    (successLimit === user?.successLimit && failureLimit === user?.failureLimit) // Check if values have changed
                  }
                  style={globalStyles.button}
                > 
                  Save Limits
                </Button>
              </Card.Content>
            </Card>

            {/* Logout Button */}
            <Button mode="contained" onPress={() => setLogoutModalVisible(true)} textColor={theme.colors.background} style={[globalStyles.button, {marginTop: 16 }]}>
              Logout
            </Button>
          </Surface>
          {/* Delete Modal */}
        <Portal >
          <Modal visible={isLogoutModalVisible} onDismiss={() => setLogoutModalVisible(false)}>
            <Card style={[globalStyles.modal, { backgroundColor: theme.colors.background}]} >
              <Card.Content>
                <Text>Are you sure you want to logout?</Text>
                <Surface style={ globalStyles.inRow } elevation={0}>
                  <Button onPress={() => setLogoutModalVisible(false)}>Cancel</Button>
                  <Button onPress={handleLogout} buttonColor={globalStyles.red.color} textColor={theme.colors.onPrimary} style={[globalStyles.button, {paddingHorizontal: 8}]}>
                    Logout
                  </Button>
                </Surface>
              </Card.Content>
            </Card>
          </Modal>
        </Portal>

        {/* Success Message */}
        <Portal>
          <Modal visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)}>
            <Snackbar
              visible={snackbarVisible}
              onDismiss={() => setSnackbarVisible(false)}
              duration={500} // Automatically disappear after 2 seconds
              style={globalStyles.successMessageContainer} // Custom style for positioning
            >
              <MaterialCommunityIcons name="check-circle-outline" size={80} color={theme.colors.primary} />
            </Snackbar>
          </Modal>
        </Portal>
        </ScrollView>
      </TouchableWithoutFeedback>

      
    </KeyboardAvoidingView>
  );
}