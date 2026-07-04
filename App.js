import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import LogsScreen from './src/screens/LogsScreen';
import AddChoiceScreen from './src/screens/AddChoiceScreen';
import AddMedicationScreen from './src/screens/AddMedicationScreen';
import AddMealScreen from './src/screens/AddMealScreen';
import { colors, radius } from './src/theme';
import {
  configureNotifications,
  resyncAllReminders,
} from './src/notifications/reminders';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Center "+" is a raised circular button that opens the Add chooser rather than a tab.
function AddTabButton({ navigation }) {
  return (
    <TouchableOpacity
      style={styles.addButtonWrap}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Add"
      onPress={() => navigation.navigate('AddChoice')}
    >
      <View style={styles.addButton}>
        <Ionicons name="add" size={34} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddTab"
        component={AddPlaceholder}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarButton: () => <AddTabButton navigation={navigation} />,
        })}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// The AddTab screen is never actually shown (its button navigates away instead),
// but a component is required by the navigator.
function AddPlaceholder() {
  return <View />;
}

export default function App() {
  useEffect(() => {
    configureNotifications();
    resyncAllReminders();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="AddChoice" component={AddChoiceScreen} />
          <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen name="AddMeal" component={AddMealScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: colors.card,
    borderTopColor: colors.border,
  },
  addButtonWrap: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
