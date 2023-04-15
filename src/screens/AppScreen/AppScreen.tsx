import React, { useEffect, useLayoutEffect } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { WEBVIEW_CONSTS } from '@constants';
import { useAsyncEffect, useWebView } from '@hooks';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenRouteParamList } from '@screens';
import { FirebaseNotification, LocalNotification } from '@libs';
import { FcmTokenStorage, registerFCMToken } from '@tools';
import BootSplash from 'react-native-bootsplash';

const AppScreen: React.FC<AppScreenProps> = ({ route }) => {
  const { url = '/home' } = route.params;

  const { ref, onMessage, postMessage } = useWebView();

  useLayoutEffect(() => {
    FirebaseNotification.initialize();
    LocalNotification.initialize(ref);
    FirebaseNotification.requestUserPermission();
  }, [ref]);

  useAsyncEffect(async () => {
    try {
      // 맨 처음에 FCM 토큰 무조건 로컬 스토리지에 저장 후 서버에 전송
      const fcmToken = await FirebaseNotification.getToken();
      await FcmTokenStorage.setToken({
        fcmToken,
      });
      await registerFCMToken(fcmToken, true);
    } catch (error) {
      console.log(error);
    } finally {
      await BootSplash.hide({ fade: true });
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    postMessage('REDIRECT', url);
  }, [postMessage, url]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={ref}
        onMessage={onMessage}
        source={{ uri: WEBVIEW_CONSTS.WEB_VIEW_URL.PROD }}
        decelerationRate="normal"
        javaScriptEnabled
        injectedJavaScript={WEBVIEW_CONSTS.WEB_VIEW_DEBUGGING_SCRIPT}
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
};

type AppScreenProps = NativeStackScreenProps<ScreenRouteParamList, 'AppScreen'>;

export type AppScreenRoute = {
  AppScreen: {
    url: string | null;
  };
};

export default AppScreen;