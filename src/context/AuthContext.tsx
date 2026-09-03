import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import Api, { setAuthReady } from '../Api/api'
import { showToast } from '../utils/toast'
import useAuthStore from '../features/auth/auth.service'
import useThemeStore from '../features/theme/theme.service'

type User = {
    id: number
    name: string
    email: string
    role: 'driver'
    wallet_balance: number
    profile_image?: string | null
    updated_at?: string | null
}

type AuthContextType = {
    user: User | null
    loading: boolean
    login: (data: any) => Promise<void>
    register: (data: any) => Promise<void>
    logout: () => Promise<void>
    token: string | null
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const router = useRouter()
    const store = useAuthStore()

    useEffect(() => {
        const loadUser = async () => {
            await useThemeStore.getState().loadTheme()
            const storedToken = await AsyncStorage.getItem('token')
            const storedUser = await AsyncStorage.getItem('user')

            if (storedToken && storedUser) {
                setToken(storedToken)
                setUser(JSON.parse(storedUser))
                store.actions.me()
            }

            setLoading(false)
            setAuthReady(true)
        }

        loadUser()
    }, [])

    useEffect(() => {
        if (!loading && (!user || !token)) {
            router.replace('/login' as any)
        }
    }, [loading, user, token])

    useEffect(() => {
        if (store.user) {
            setUser(store.user as any)
            AsyncStorage.setItem('user', JSON.stringify(store.user))
        }
    }, [store.user])

    const login = async (data: any) => {
        try {
            console.log('user login is working')
            const res = await Api.post('/login', data)
            console.log('Login response:', res)

            const { access_token, user } = res

            setUser(user)
            setToken(access_token)

            await AsyncStorage.setItem('token', access_token)
            await AsyncStorage.setItem('user', JSON.stringify(user))

            setAuthReady(true)
            router.replace('/')

        } catch (error: any) {
            console.error('Login error:', error)
            const msg = typeof error === 'string' ? error : error?.response?.data?.message || error?.message || 'Login failed. Please try again.'
            showToast(msg, 3500, 'error')
        }
    }

    const register = async (data: any) => {
        const res = await Api.post('/auth/register', data)
        const { access_token, user } = res

        setUser(user)
        setToken(access_token)

        await AsyncStorage.setItem('token', access_token)
        await AsyncStorage.setItem('user', JSON.stringify(user))

        setAuthReady(true)
        router.replace('/')
    }

    const logout = async () => {
        setUser(null)
        setToken(null)

        await AsyncStorage.removeItem('token')
        await AsyncStorage.removeItem('user')

        store.actions.logout()

        setAuthReady(false)
        router.replace('/login' as any)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}
