import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { CommonActions } from '@react-navigation/native'
import { navigationRef } from '../navigation/RootNavigation'
import { showToast } from '../utils/toast'

export const baseURL = process.env.EXPO_PUBLIC_API_URL || "https://valet-api.botsupport.in";

let authReady = false

export const setAuthReady = (ready: boolean) => {
    authReady = ready
}

const PUBLIC_ROUTES = ['/login', '/register']

const api: AxiosInstance = axios.create({
    baseURL,
    timeout: 1000000,
    headers: {
        'Content-Type': 'application/json',
    },
})

export async function getToken() {
    return await AsyncStorage.getItem('token')
}

api.interceptors.request.use(
    async (config) => {
        const isPublic = PUBLIC_ROUTES.some(route =>
            config.url?.includes(route)
        )



        const token = await getToken()

        if (token && !isPublic) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    async (error: any) => {
        if (error?.isAuthBlocked) {
            return Promise.reject(error)
        }

        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('token')
            await AsyncStorage.removeItem('user')

            navigationRef.current?.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            )
        }

        return Promise.reject(error)
    }
)

interface ApiResponse<T> {
    data: T
}

interface ApiError {
    message: string
    status?: number
    [key: string]: any
}

export function handleApiError(error: AxiosError<ApiError> | any): string {
    let message = 'An unexpected error occurred. Please try again.'

    if (typeof error === 'string') {
        message = error
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        message = 'Request timed out. Please check your network connection.'
    } else if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error?.response) {
        message = 'Unable to connect to server. Please check your internet connection or server status.'
    } else if (error?.response) {
        const status = error.response.status
        const data = error.response.data

        if (status === 401) {
            message = 'Session expired. Please log in again.'
        } else if (status === 403) {
            message = 'Access denied. You do not have permission to perform this action.'
        } else if (status === 404) {
            message = 'Requested resource was not found.'
        } else if (status >= 500) {
            message = 'Server error occurred. Please try again later.'
        } else if (data) {
            if (typeof data === 'string') {
                message = data
            } else if (data.message && typeof data.message === 'string') {
                message = data.message
            } else if (data.error && typeof data.error === 'string') {
                message = data.error
            } else if (Array.isArray(data.errors) && data.errors.length > 0) {
                message = data.errors
                    .map((e: any) => (typeof e === 'string' ? e : e?.message || e?.rule || 'Invalid field'))
                    .filter(Boolean)
                    .join('\n')
            } else if (Array.isArray(data) && data.length > 0) {
                message = data
                    .map((e: any) => (typeof e === 'string' ? e : e?.message || 'Invalid item'))
                    .filter(Boolean)
                    .join('\n')
            }
        }
    }

    showToast(message, 3500, 'error')
    return message
}

interface GetParams {
    query?: any
}

export async function get<T>(endpoint: string, options?: GetParams): Promise<T | any> {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await api.get(endpoint, {
            params: options?.query,
        })
        return response.data as any
    } catch (error: any) {
        // console.log(error.response)
        throw handleApiError(error)
    }
}

export interface PostPutOpt {
    formData?: boolean
}

export async function post<T>(endpoint: string, data: any, opt?: PostPutOpt): Promise<T | any> {
    try {
        api.defaults.headers['Content-Type'] = opt?.formData
            ? 'multipart/form-data'
            : 'application/json'

        const response = await api.post(endpoint, data)
        return response.data as any
    } catch (error: any) {
        throw handleApiError(error)
    }
}

export async function put<T>(endpoint: string, data: any, opt?: PostPutOpt): Promise<T | any> {
    try {
        api.defaults.headers['Content-Type'] = opt?.formData
            ? 'multipart/form-data'
            : 'application/json'

        const response: AxiosResponse<ApiResponse<T>> = await api.put(endpoint, data)
        return response.data as any
    } catch (error: any) {
        throw handleApiError(error)
    }
}

export async function patch<T>(endpoint: string, data: any, opt?: PostPutOpt): Promise<T> {
    try {
        api.defaults.headers['Content-Type'] = opt?.formData
            ? 'multipart/form-data'
            : 'application/json'

        const response: AxiosResponse<ApiResponse<T>> = await api.patch(endpoint, data)
        return response.data as any
    } catch (error: any) {
        throw handleApiError(error)
    }
}

export async function del<T>(endpoint: string): Promise<T | any> {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await api.delete(endpoint)
        return response.data as any
    } catch (error: any) {
        throw handleApiError(error)
    }
}

const Api = {
    get,
    post,
    put,
    patch,
    del,
}

export default Api
