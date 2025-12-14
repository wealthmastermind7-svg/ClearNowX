import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "@/screens/SplashScreen";
import ScanScreen from "@/screens/ScanScreen";
import ResultsScreen from "@/screens/ResultsScreen";
import SuccessScreen from "@/screens/SuccessScreen";
import FilePreviewScreen from "@/screens/FilePreviewScreen";

export type RootStackParamList = {
  Splash: undefined;
  Scan: undefined;
  Results: undefined;
  Success: { filesDeleted?: number; spaceFreed?: number } | undefined;
  FilePreview: { category: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#0B0C0F" },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="FilePreview" component={FilePreviewScreen} />
    </Stack.Navigator>
  );
}
