import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TestScreen from "../src/components/TestScreen";
import ChatBot from "../src/components/ChatBot";
import { useLanguage } from "../LanguageContext";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const BottomTab = createBottomTabNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={BottomTabNavigator} />
      <Drawer.Screen name="ChatBot" component={ChatBot} />
    </Drawer.Navigator>
  );
}

function BottomTabNavigator() {
  const { t } = useLanguage();

  return (
    <BottomTab.Navigator screenOptions={{ headerShown: false }}>
      <BottomTab.Screen
        name={t("HomeScreen")}
        component={() => <TestScreen text={t("HomeScreen")} />}
      />
      <BottomTab.Screen
        name={t("MailScreen")}
        component={() => <TestScreen text={t("MailScreen")} />}
      />
      <BottomTab.Screen
        name={t("Gift")}
        component={() => <TestScreen text={t("Gift")} />}
      />
      <BottomTab.Screen
        name={t("Rating")}
        component={() => <TestScreen text={t("Rating")} />}
      />
    </BottomTab.Navigator>
  );
}

function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}
