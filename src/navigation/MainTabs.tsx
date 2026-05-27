import React from 'react';
import { Pressable, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, BarChart3, User, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from './types';
import { useTheme } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Center FAB that opens the Journal modal — placed in the tab bar
// the same way the Kalo screenshot has a floating green plus.
function CenterFAB() {
  const theme = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const fg = theme.scheme === 'dark' ? '#0A0A0A' : '#FFFFFF';

  return (
    <View style={{ width: 56, alignItems: 'center', justifyContent: 'flex-start' }}>
      <Pressable
        onPress={() => nav.navigate('Journal')}
        style={({ pressed }) => ({
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: theme.colors.pu,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -16,
          opacity: pressed ? 0.85 : 1,
          shadowColor: theme.colors.pu,
          shadowOpacity: 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        })}
      >
        <Plus size={26} color={fg} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export default function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.nav,
          borderTopColor: theme.colors.nb,
          borderTopWidth: 0.5,
          height: 78,
          paddingTop: 10,
          paddingBottom: 16,
        },
        tabBarActiveTintColor: theme.colors.pu,
        tabBarInactiveTintColor: theme.colors.tm,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="_FAB"
        component={HomeScreen /* unused */}
        options={{
          tabBarButton: () => <CenterFAB />,
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />,
        }}
      />
    </Tab.Navigator>
  );
}
