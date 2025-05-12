import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ActivityIndicator, View } from 'react-native';
import { auth } from './firebase';
import AdminScreen from './screens/AdminScreen';
import Chat from './screens/Chat';
import Communities from './screens/Communities';
import Home from './screens/Home';
import Login from './screens/Login';
import Profile from './screens/Profile';
import Signup from './screens/Signup';
import TeacherSubjectContent from './screens/TeacherSubjectContent';
// import SettingsScreen from './screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import SettingsScreen from './screens/SettingsScreen';
import ContactSupportScreen from './screens/support/ContactSupportScreen';
import HelpCenterScreen from './screens/support/HelpCenterScreen';
import PrivacyPolicyScreen from './screens/support/PrivayPolicyScreen';
import TermsOfServiceScreen from './screens/support/TermsOfServiceScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Communities') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
      <Tab.Screen name="Communities" component={Communities} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        user.email.toLowerCase() === 'admin@gmail.com' ? (
          <AdminScreen />
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="TeacherSubjectContentScreen" component={TeacherSubjectContent} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen
              name='HelpCenter'
              component={HelpCenterScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name='ContactSupport'
              component={ContactSupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name='TermsOfService'
              component={TermsOfServiceScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name='PrivacyPolicy'
              component={PrivacyPolicyScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        )
      ) : (
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}