import Toast from 'react-native-root-toast'

let toast: Toast | null = null

export type ToastType = 'error' | 'success' | 'info'

export const showToast = (message: string, duration = 3000, type: ToastType = 'error') => {
    if (!message) return

    if (toast !== null) {
        Toast.hide(toast)
        toast = null
    }

    const backgroundColor =
        type === 'error' ? '#D32F2F' : type === 'success' ? '#2E7D32' : '#0288D1'

    toast = Toast.show(message, {
        duration,
        position: Toast.positions.BOTTOM - 40,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor,
        textColor: '#FFFFFF',
        opacity: 0.95,
    })
}

