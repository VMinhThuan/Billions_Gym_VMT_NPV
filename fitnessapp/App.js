import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/store/AuthContext';
import { ThemeProvider } from './src/store/ThemeContext';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View, Text, TextInput, Linking } from 'react-native';
import { navigationRef } from './src/navigation/RootNavigation';
import { parsePaymentDeepLink } from './src/utils/paymentDeepLink';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins': require('./assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
  });

  React.useEffect(() => {
    if (!fontsLoaded) return;
    try {
      if (Text.defaultProps == null) Text.defaultProps = {};
      Text.defaultProps.style = {
        ...(Text.defaultProps.style || {}),
        fontFamily: 'Poppins',
      };

      if (TextInput.defaultProps == null) TextInput.defaultProps = {};
      TextInput.defaultProps.style = {
        ...(TextInput.defaultProps.style || {}),
        fontFamily: 'Poppins',
      };

      console.log('Poppins fonts loaded and global defaults set');
    } catch (e) {
      console.warn('Could not set global default fontFamily:', e);
    }
  }, [fontsLoaded]);

  React.useEffect(() => {
    const handleDeepLink = (event) => {
      const parsed = parsePaymentDeepLink(event?.url);
      if (parsed) {
        if (parsed.isError) {
          navigationRef.current?.navigate('PaymentWebView');
          return;
        }
        navigationRef.current?.navigate('PaymentSuccess', {
          orderId: parsed.orderId,
          paymentMethod: parsed.paymentMethod,
          amount: parsed.amount,
          packageName: parsed.packageName,
          resultCode: parsed.resultCode,
          fromDeepLink: true,
        });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
