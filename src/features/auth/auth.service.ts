import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import Api from '../../Api/api';

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: 'driver' | 'admin' | 'valet';
}

export interface User {
    id: string
    name: string
    email: string | null
    phone: string | null
    password: string
    license_number: string | null
    license_image: string | null
    license_expiry: string | null
    id_proof_type: string | null
    id_proof_number: string | null
    id_proof_image: string | null
    dob: string | null
    gender: string | null
    profile_image: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    pincode: string | null
    last_known_lat: number | null
    last_known_lng: number | null
    valet_site_id: string | null
    parked_at: string | null
    requested_at: string | null
    returned_at: string | null
    estimated_busy_until: string | null
    device_token: string | null
    is_active: boolean
    is_available: boolean
    is_verified: boolean
    joined_at: string
    created_at: string
    updated_at: string
    last_login: string | null
    wallet_balance: number
    wallet_bonus: number
}


export interface AuthResponse {
    access_token: string;
    user: AuthUser;
}

const path = '/auth';

const useAuthStore = create(
    combine(
        {
            token: null as string | null,
            user: null as User | null,
            loading: false,
        },
        (set, get) => ({
            actions: {
                login: async (payload: { email?: string; phone?: string; password: string }) => {
                    set({ loading: true });
                    try {
                        const res = await Api.post<AuthResponse>(`${path}/login`, {
                            body: payload,
                        });
                        set({
                            token: res.access_token,
                            user: res.user,
                            loading: false,
                        });
                    } catch (err) {
                        set({ loading: false });
                        throw err;
                    }
                },

                signup: async (payload: {
                    name: string;
                    email: string;
                    phone: string;
                    password: string;
                }) => {
                    set({ loading: true });
                    try {
                        const res = await Api.post<AuthResponse>(`${path}/signup`, {
                            body: payload,
                        });
                        set({
                            token: res.access_token,
                            user: res.user,
                            loading: false,
                        });
                    } catch (err) {
                        set({ loading: false });
                        throw err;
                    }
                },
                me: async () => {
                    try {
                        const res = await Api.post(`${path}/me`, {});
                        set({ user: res?.user });
                        console.log(res)
                    } catch (err) {
                        set({ loading: false });
                        throw err;
                    }
                },

                logout: () => {
                    set({ token: null, user: null });
                },
            },
        })
    )
);

export default useAuthStore;
