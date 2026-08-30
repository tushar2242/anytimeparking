import React from 'react';
import {
    ScrollView,
    RefreshControl,
    StyleSheet,
    ScrollViewProps,
    ViewStyle,
    View
} from 'react-native';
import { useRefresh } from '@/hooks/useRefresh';

// Production level colors
const REFRESH_TINT = '#6366F1';
const REFRESH_BACKGROUND = '#FFFFFF';

interface PullToRefreshProps extends ScrollViewProps {
    children: React.ReactNode;
    onRefresh?: () => Promise<any> | any;
    refreshing?: boolean; // Optional external control
    containerStyle?: ViewStyle;
    contentContainerStyle?: ViewStyle;
}

/**
 * Global PullToRefresh component for production-level native feeling.
 * Wraps ScrollView with a standardized RefreshControl and haptic feedback.
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh: onRefreshProp,
    refreshing: refreshingProp,
    containerStyle,
    contentContainerStyle,
    ...rest
}) => {
    // Use our global hook if an onRefresh prop is provided
    const { refreshing, onRefresh } = useRefresh({
        onRefresh: onRefreshProp,
    });

    // Determine current refreshing state (support both internal and external)
    const currentRefreshing = refreshingProp !== undefined ? refreshingProp : refreshing;

    return (
        <ScrollView
            style={[styles.scroll, containerStyle]}
            contentContainerStyle={[styles.content, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEventThrottle={16}
            refreshControl={
                <RefreshControl
                    refreshing={currentRefreshing}
                    onRefresh={onRefreshProp ? onRefresh : undefined}
                    tintColor={REFRESH_TINT}
                    colors={[REFRESH_TINT]}
                    progressBackgroundColor={REFRESH_BACKGROUND}
                    progressViewOffset={0}
                />
            }
            {...rest}
        >
            {children}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
    },
});

export default PullToRefresh;
