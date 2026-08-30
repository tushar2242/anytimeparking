import Toast from 'react-native-root-toast'

let toast: Toast | null = null

export const showToast = (message: string, duration = 2000) => {
    if (toast !== null) {
        Toast.hide(toast)
        toast = null
    }

    toast = Toast.show(message, {
        duration,
        position: Toast.positions.BOTTOM,
        shadow: false,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor: '#000',
        textColor: '#fff',
    })
}
