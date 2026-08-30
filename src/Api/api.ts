import AsyncStorage from '@react-native-async-storage/async-storage'
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { CommonActions } from '@react-navigation/native'
import { navigationRef } from '../navigation/RootNavigation'
import { showToast } from '../utils/toast'

// const baseURL = 'http://172.20.10.10:5000'
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

export function handleApiError(error: AxiosError<ApiError>): any {
    let message = error.message

    if (error.response?.data) {
        if (error.response.data.error) {
            message = error.response.data.error
        } else if (Array.isArray(error.response.data)) {
            message = error.response.data
                .map((e, i) => `${i + 1}. ${e?.code} - ${e?.message}`.substring(0, 100))
                .join('\n')
        } else if (Array.isArray(error.response.data.errors)) {
            message = error.response.data.errors
                .map((e, i) => `${i + 1}. ${e?.rule} - ${e?.message}`.substring(0, 100))
                .join('\n')
        } else if (typeof error.response.data === 'object' && error.response.data !== null) {
            const data = error.response.data as any
            message = (data.code || data.message)
                ? `${data.code ?? ''} - ${data.message ?? ''}`.trim()
                : JSON.stringify(data)
            message = message.substring(0, 100)
        }
    }

    showToast(message)
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
