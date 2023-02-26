import React, { useCallback } from 'react';
import {
  AppState,
  // AppStateStatus,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { WEB_VIEW_DEBUGGING_SCRIPT } from './src/constants/webview';
import { useWebView, useAsyncEffect } from './src/hooks';
import { TokenStorage, FcmTokenStorage } from './src/tools';
import BootSplash from 'react-native-bootsplash';
import { FirebaseNotification } from './src/libs';
import { fcmApis } from './src/apis';

// const WEB_VIEW_URL = 'http://192.168.0.101:3000';
const WEB_VIEW_URL = 'https://diivers.world';

const App: React.FC = () => {
  const { ref, postMessage, onMessage } = useWebView();

  useAsyncEffect(async () => {
    await FirebaseNotification.initialize();
    await FirebaseNotification.requestUserPermission();
    // 맨 처음에 FCM 토큰 무조건 로컬 스토리지에 저장
    const fcmToken = await FirebaseNotification.getToken();
    await FcmTokenStorage.setToken({
      fcmToken,
    });
  }, []);

  // 유저의 FCM 토큰 저장 (api 호출)
  const handleRegisterFCMToken = useCallback(
    async (fcmToken: string, isActive: boolean) => {
      if (!fcmToken) return;
      await fcmApis.registerFCMToken({
        type: Platform.OS === 'android' ? 'android' : 'ios',
        registration_id: fcmToken,
        active: isActive,
      });
      // 안전성을 위해 다시 한번 로컬 스토리지에 저장해줌
      await FcmTokenStorage.setToken({
        fcmToken,
      });
    },
    [],
  );

  // 이전이 어느 상태였던 foreground로 돌아왔을때 필요한 동작들
  useAsyncEffect(async () => {
    console.log(48);
    console.log(AppState.currentState);
    const state = AppState.currentState;

    if (state === 'active' || state === 'unknown') {
      // 로컬 스토리지에서 토큰 확인
      const token = await TokenStorage.getToken();
      await BootSplash.hide({ fade: true });
      postMessage('SET_TOKEN', token);

      // 로컬 스토리지에서 FCM 토큰 확인 -> 있으면 api 등록
      const { fcmToken } = await FcmTokenStorage.getToken();
      if (!fcmToken) return;
      await handleRegisterFCMToken(fcmToken, true);
    }
  }, []);

  // useAppStateEffect(async (state: AppStateStatus) => {
  //   console.log(47, state);
  //   if (state === 'active') {
  //     // 로컬 스토리지에서 토큰 확인
  //     const token = await TokenStorage.getToken();
  //     await BootSplash.hide({ fade: true });
  //     postMessage('SET_TOKEN', token);

  //     // 로컬 스토리지에서 FCM 토큰 확인
  //     const { fcmToken } = await FcmTokenStorage.getToken();
  //     console.log(89, fcmToken);
  //     await handleRegisterFCMToken(fcmToken, true);
  //   }
  // }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar backgroundColor="white" barStyle={'dark-content'} />
      <WebView
        ref={ref}
        onMessage={onMessage}
        source={{ uri: WEB_VIEW_URL }}
        decelerationRate="normal"
        javaScriptEnabled
        injectedJavaScript={WEB_VIEW_DEBUGGING_SCRIPT}
        originWhitelist={['*']}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
};

export default React.memo(App);
