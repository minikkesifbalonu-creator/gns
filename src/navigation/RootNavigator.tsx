import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// Auth Screen
import LoginScreen from '../screens/LoginScreen';

// Dashboard Screens
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

// Core Flow Screens
import StudentDailyLogScreen from '../screens/StudentDailyLogScreen';
import AnnouncementDetailScreen from '../screens/AnnouncementDetailScreen';
import FoodMenuScreen from '../screens/FoodMenuScreen';
import TeacherAttendanceScreen from '../screens/TeacherAttendanceScreen';
import MedicationTrackingScreen from '../screens/MedicationTrackingScreen';
import ParentActivityFlowScreen from '../screens/ParentActivityFlowScreen';
import AdminManagementScreen from '../screens/AdminManagementScreen';
import AdminAttendanceStatusScreen from '../screens/AdminAttendanceStatusScreen';
import AdminAccountManagementScreen from '../screens/AdminAccountManagementScreen';
import AdminAnnouncementManagementScreen from '../screens/AdminAnnouncementManagementScreen';
import CreateAnnouncementScreen from '../screens/CreateAnnouncementScreen';
import CreateUrgentNotificationScreen from '../screens/CreateUrgentNotificationScreen';
import AdminStudentManagementScreen from '../screens/AdminStudentManagementScreen';
import CreateStudentScreen from '../screens/CreateStudentScreen';
import AdminTeacherManagementScreen from '../screens/AdminTeacherManagementScreen';
import CreateTeacherScreen from '../screens/CreateTeacherScreen';
import AdminClassManagementScreen from '../screens/AdminClassManagementScreen';
import CreateClassScreen from '../screens/CreateClassScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';

const Stack = createStackNavigator();

export const RootNavigator = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
                <>
                    {/* PARENT FLOW */}
                    {user.role === 'parent' && (
                        <>
                            <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
                            <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
                            <Stack.Screen name="FoodMenu" component={FoodMenuScreen} />
                            <Stack.Screen name="ParentActivityFlow" component={ParentActivityFlowScreen} />
                            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
                        </>
                    )}

                    {/* TEACHER FLOW */}
                    {user.role === 'teacher' && (
                        <>
                            <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
                            <Stack.Screen name="StudentDailyLog" component={StudentDailyLogScreen} />
                            <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
                            <Stack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
                            <Stack.Screen name="MedicationTracking" component={MedicationTrackingScreen} />
                            <Stack.Screen name="FoodMenu" component={FoodMenuScreen} />
                            <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
                            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
                        </>
                    )}

                    {/* ADMIN FLOW */}
                    {user.role === 'admin' && (
                        <>
                            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                            <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
                            <Stack.Screen name="FoodMenu" component={FoodMenuScreen} />
                            <Stack.Screen name="AdminStudentManagement" component={AdminStudentManagementScreen} />
                            <Stack.Screen name="AdminTeacherManagement" component={AdminTeacherManagementScreen} />
                            <Stack.Screen name="AdminClassManagement" component={AdminClassManagementScreen} />
                            <Stack.Screen name="CreateClass" component={CreateClassScreen} />
                            <Stack.Screen name="AdminAccountManagement" component={AdminAccountManagementScreen} />
                            <Stack.Screen name="AdminAttendanceStatus" component={AdminAttendanceStatusScreen} />
                            <Stack.Screen name="AdminAnnouncementManagement" component={AdminAnnouncementManagementScreen} />
                            <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
                            <Stack.Screen name="CreateUrgentNotification" component={CreateUrgentNotificationScreen} />
                            <Stack.Screen name="CreateStudent" component={CreateStudentScreen} />
                            <Stack.Screen name="CreateTeacher" component={CreateTeacherScreen} />
                        </>
                    )}
                </>
            )}
        </Stack.Navigator>
    );
};
