import Api from '@/src/Api/api';
import { showToast } from '@/src/utils/toast';
import axios from 'axios';
import useAuthStore from '../auth/auth.service';
const create = require('zustand').create
const combine = require('zustand/middleware').combine





const path = '/driver/orders';
let timeOut: any;

const useDriverStore = create(
    combine(
        {
            driver: {
                id: null as number | null,
                total: 0,
                page: 1,
                size: 10,
                search: null as string | null,
                paginate: true,
                data: null as any,
            },
        },
        (set: any, get: any) => ({
            get: {
                list: async () => {
                    const {
                        valet: { page, size, search },
                    } = get();
                    try {
                        const res = await Api.get(path, { query: { page, size, search } });
                        // console.log(res)
                        set((prev) => ({
                            valet: { ...prev.valet, list: res.data },
                        }));
                    } catch (err) {
                        console.error('Failed to load valet orders', err);
                    }
                },

                paginate: ({
                    page,
                    size,
                    search,
                }: {
                    page?: number;
                    size?: number;
                    search?: string;
                }) => {
                    clearTimeout(timeOut);
                    const init = () => {
                        set((prev) => ({
                            valet: {
                                ...prev.valet,
                                page: page || prev.valet.page,
                                size: size || prev.valet.size,
                                search: search || null,
                            },
                        }));
                        useDriverStore.getState().get.list();
                    };

                    if (search) {
                        timeOut = setTimeout(() => {
                            init();
                        }, 1000);
                        set((prev) => ({ valet: { ...prev.valet, search } }));
                        return;
                    }

                    init();
                },




                detail: async (id: number) => {
                    try {
                        const res = await Api.get(`/order/${id}`);
                        set((prev) => ({
                            valet: { ...prev.valet, id, detail: res },
                        }));
                    } catch (err) {
                        console.error('Failed to load valet order detail', err);
                    }
                }

            },

            select: (id: number) => set((prev) => ({ valet: { ...prev.valet, id } })),


            updateProfile: async (form: any) => {
                try {
                    const formData = new FormData();

                    Object.keys(form).forEach(key => {
                        if (key === 'poster' || key === 'profile_image') {
                            return;
                        }

                        let value = form[key];
                        if (value === null || value === undefined) {
                            value = '';
                        }

                        if (key === 'dob' || key === 'license_expiry') {
                            if (value) {
                                try {
                                    const d = new Date(value);
                                    if (!isNaN(d.getTime())) {
                                        const yyyy = d.getFullYear();
                                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                                        const dd = String(d.getDate()).padStart(2, '0');
                                        value = `${yyyy}-${mm}-${dd}`;
                                    }
                                } catch (e) {
                                    console.log("Date formatting error in service:", e);
                                }
                            }
                        }

                        formData.append(key, String(value));
                    });

                    if (form.poster && form.poster.uri && !form.poster.uri.startsWith('http')) {
                        formData.append('profile_image', {
                            uri: form.poster.uri,
                            name: form.poster.name || 'profile.jpg',
                            type: form.poster.type || 'image/jpeg',
                        } as any);
                    }

                    const res = await Api.put('/driver/profile', formData, {
                        formData: true
                    });
                    if (res && res.driver) {
                        useAuthStore.setState({ user: res.driver });
                    }
                    useAuthStore.getState().actions.me().catch(e => console.log("Failed to refresh me:", e));
                    return res.driver;
                } catch (error) {
                    console.error('Error updating profile:', error);
                    throw error;
                }
            },

            updateBank: async (data: {
                bank_name: string;
                account_number: string;
                ifsc_code: string;
                account_holder_name: string;
            }) => {
                try {
                    const payload = {
                        bank_name: data.bank_name,
                        account_number: data.account_number,
                        ifsc_code: data.ifsc_code,
                        account_holder_name: data.account_holder_name,
                        bank_account_number: data.account_number,
                        bank_ifsc: data.ifsc_code,
                        bank_holder_name: data.account_holder_name,
                    };
                    const res = await Api.put('/driver/bank', payload);
                    return res;
                } catch (error) {
                    console.error('Error updating bank details:', error);
                    throw error;
                }
            },

            getProfile: async () => {
                try {
                    const res = await Api.get('/driver/profile');
                    set((prev) => ({
                        driver: { ...prev.driver, data: res.data },
                    }));
                    return res.data
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        })
    )
);

export default useDriverStore;
