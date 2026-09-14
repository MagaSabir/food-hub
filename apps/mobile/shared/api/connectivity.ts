import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

let isOnline = true;

export function isOnlineNow(): boolean {
  return isOnline;
}

export function startConnectivityWatch(): () => void {
  const apply = (connected: boolean | null, reachable: boolean | null) => {
    isOnline = connected !== false && reachable !== false;
    onlineManager.setOnline(isOnline);
  };

  void NetInfo.fetch().then((state) =>
    apply(state.isConnected, state.isInternetReachable),
  );

  return NetInfo.addEventListener((state) =>
    apply(state.isConnected, state.isInternetReachable),
  );
}
