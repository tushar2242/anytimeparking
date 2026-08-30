import { Drawer } from 'expo-router/drawer'
import CustomDrawerContent from '@/components/navigation/CustomDrawerContent'
import HeaderRight from '@/components/header/HeaderRight';
import { Platform, Text } from 'react-native';
import { AuthProvider } from '@/src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainWrapper from '@/components/wrapper/MainWrapper';
import useAuthStore from '@/src/features/auth/auth.service';
import useThemeStore from '@/src/features/theme/theme.service';

export default function Layout() {
  const store = useAuthStore()
  const driverName = store.user?.name
  const themeStore = useThemeStore()
  const isDarkMode = themeStore.isDarkMode

  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#fff' }} edges={['bottom']} >
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerTintColor: isDarkMode ? '#fff' : '#000',
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
              color: isDarkMode ? '#fff' : '#212529',
            },
            headerRight: () => <HeaderRight />,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
            },
            drawerStyle: {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#fff',
            }
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="my-order"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
              swipeEnabled: false
            }}
          />
          <Drawer.Screen name="profile" options={{
            headerTitle: () => (
              <Text style={{ fontSize: 22, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>
                Profile
              </Text>
            ),
          }} />

          <Drawer.Screen
            name="wallet"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
              swipeEnabled: false
            }}
          />

          <Drawer.Screen name="policy" options={{
            headerTitle: () => (
              <Text style={{ fontSize: 22, fontWeight: '700', color: isDarkMode ? '#fff' : '#000' }}>
                Policies
              </Text>
            ),
          }} />

          <Drawer.Screen
            name="card-parking/index"
            options={{
              headerShown: false,
            }}
          />

          <Drawer.Screen
            name="login"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
              swipeEnabled: false
            }}
          />
          <Drawer.Screen
            name="sign-up"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
              swipeEnabled: false
            }}
          />
          <Drawer.Screen
            name="detail/[id]/index"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="order-detail/[id]/index"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="transaction/list/index"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="Withdraw"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="AddBank"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="SecurePayment"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="FastPayout"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="Support"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="otp"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="forgot"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
              swipeEnabled: false
            }}
          />
          <Drawer.Screen
            name="verify-otp"
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
              swipeEnabled: false
            }}
          />
        </Drawer>
      </SafeAreaView>
    </AuthProvider>
  )
}
