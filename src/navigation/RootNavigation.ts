import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef() as any;

export function navigate(name: string, params?: any) {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
}
