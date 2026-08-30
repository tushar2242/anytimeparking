import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';

interface UseRefreshProps {
    onRefresh?: () => Promise<any> | any;
    hapticFeedback?: boolean;
}

export const useRefresh = ({ onRefresh, hapticFeedback = true }: UseRefreshProps = {}) => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        if (!onRefresh) return;

        setRefreshing(true);

        if (hapticFeedback) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        try {
            await Promise.resolve(onRefresh());
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setRefreshing(false);
            if (hapticFeedback) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    }, [onRefresh, hapticFeedback]);

    return {
        refreshing,
        onRefresh: handleRefresh,
    };
};

export default useRefresh;
