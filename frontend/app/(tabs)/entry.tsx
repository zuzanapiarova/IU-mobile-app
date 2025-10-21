// import React, { useState, useEffect } from "react";
// import { View, Text, TextInput, Button, Alert, ScrollView } from "react-native";
// import * as SQLite from "expo-sqlite";
// import * as LocalAuthentication from "expo-local-authentication";
// import * as SecureStore from "expo-secure-store";
// import Checkbox from "expo-checkbox";
// import { useRouter } from "expo-router";

// const db = SQLite.openDatabaseSync("habits.db");

// export default function OnboardingScreen() {
//   const router = useRouter();

//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [dataConsent, setDataConsent] = useState(false);
//   const [marketingConsent, setMarketingConsent] = useState(false);

//   useEffect(() => {
//     // Make sure table exists
//     db.execSync(`
//       CREATE TABLE IF NOT EXISTS user_profile (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         name TEXT,
//         email TEXT,
//         consent_data_processing INTEGER,
//         consent_marketing INTEGER,
//         biometric_enabled INTEGER
//       );
//     `);
//   }, []);

//   async function handleContinue() {
//     if (!name || !email) {
//       Alert.alert("Missing info", "Please fill out both name and email.");
//       return;
//     }
//     if (!dataConsent) {
//       Alert.alert("Consent required", "You must agree to data processing to continue.");
//       return;
//     }

//     // Save to SQLite
//     db.runSync(
//       `INSERT INTO user_profile (name, email, consent_data_processing, consent_marketing, biometric_enabled)
//        VALUES (?, ?, ?, ?, 0);`,
//       [name, email, dataConsent ? 1 : 0, marketingConsent ? 1 : 0]
//     );

//     Alert.alert("Saved", "Your info has been saved!");

//     // Ask about biometrics
//     enableBiometric();
//   }

//   async function enableBiometric() {
//     const supported = await LocalAuthentication.hasHardwareAsync();
//     if (!supported) {
//       router.replace("/"); // Go to index
//       return;
//     }

//     const enrolled = await LocalAuthentication.isEnrolledAsync();
//     if (!enrolled) {
//       router.replace("/");
//       return;
//     }

//     Alert.alert(
//       "Enable biometric login?",
//       "Would you like to unlock the app with Face ID or Touch ID next time?",
//       [
//         {
//           text: "No",
//           onPress: () => router.replace("/"),
//           style: "cancel",
//         },
//         {
//           text: "Yes",
//           onPress: async () => {
//             await SecureStore.setItemAsync("biometric_enabled", "true");
//             db.runSync(`UPDATE user_profile SET biometric_enabled = 1;`);
//             router.replace("/");
//           },
//         },
//       ]
//     );
//   }

//   return (
//     <ScrollView
//       contentContainerStyle={{
//         flexGrow: 1,
//         justifyContent: "center",
//         padding: 20,
//         backgroundColor: "#fff",
//       }}
//     >
//       <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
//         Welcome to Your Habit Tracker
//       </Text>

//       <TextInput
//         placeholder="Name"
//         value={name}
//         onChangeText={setName}
//         style={{
//           borderWidth: 1,
//           borderColor: "#ccc",
//           borderRadius: 8,
//           padding: 10,
//           marginBottom: 10,
//         }}
//       />
//       <TextInput
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         style={{
//           borderWidth: 1,
//           borderColor: "#ccc",
//           borderRadius: 8,
//           padding: 10,
//           marginBottom: 10,
//         }}
//       />

//       <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
//         <Checkbox value={dataConsent} onValueChange={setDataConsent} />
//         <Text style={{ marginLeft: 8 }}>I agree to data processing</Text>
//       </View>

//       <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
//         <Checkbox value={marketingConsent} onValueChange={setMarketingConsent} />
//         <Text style={{ marginLeft: 8 }}>I want to receive marketing emails</Text>
//       </View>

//       <Button title="Continue" onPress={handleContinue} />
//     </ScrollView>
//   );
// }
