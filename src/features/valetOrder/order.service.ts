import Api from '@/src/Api/api';
import { showToast } from '@/src/utils/toast';
const create = require('zustand').create
const combine = require('zustand/middleware').combine

export interface ValetOrder {
    id: number | string;
    driver_id: number | string;
    site_id: number | string;
    vehicle_number: string;
    vehicle_type: string;
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
    notes: string;
    status: 'requested' | 'accepted' | 'booked' | 'parked' | 'returned' | 'cancelled';
    requested_at: string;
    accepted_at: string;
    parked_at: string;
    returned_at: string | null;
    created_at: string;
    valet_site?: ValetSite | null;
    site?: ValetSite | null;
    valetSite?: ValetSite | null;
    valet_slot: string | null;
    amount: number | null;
    order_id?: number | string;
    _id?: string;
}

export interface ValetSite {
    id: number | string;
    name: string;
    registration_number: string | null;
    category: '1-star' | '2-star' | '3-star' | '4-star' | '5-star' | 'unrated';
    email: string | null;
    phone: string;
    alternate_phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
    contact_person: string | null;
    contact_designation: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    valet_slots: number | null;
    valet_service_hours: string | null;
    gst_certificate: string | null;
    business_license_image: string | null;
    address_proof_image: string | null;
    images: string | null;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    image: string | null;
    amount?: number | null;
    total_amount?: number | null;
}

const path = '/driver/orders';
let timeOut: any;

const useValetStore = create(
    combine(
        {
            valet: {
                id: null as number | string | null,
                list: [] as ValetOrder[],
                total: 0,
                page: 1,
                size: 10,
                search: null as string | null,
                paginate: true,
                detail: null as ValetOrder | null,
                myOrders: [] as ValetOrder[],
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
                        console.log(res)
                        
                        const list = res.data || res.orders || (Array.isArray(res) ? res : []);

                        set((prev) => ({
                            valet: { ...prev.valet, list },
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
                        useValetStore.getState().get.list();
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

                detail: async (id: number | string) => {
                    try {
                        const res = await Api.get(`/order/${id}`);
                        const detailData = res.data?.order || res.data || res.order || res;

                        set((prev) => ({
                            valet: { ...prev.valet, id, detail: detailData },
                        }));
                    } catch (err) {
                        console.error('Failed to load valet order detail', err);
                    }
                }
            },

            select: (id: number | string) => set((prev) => ({ valet: { ...prev.valet, id } })),

            bookOrder: async (id: number | string) => {
                try {
                    const res = await Api.post(`/order/${id}/book`, {});

                    // console.log(res)
                    useValetStore.getState().get.list();
                    useValetStore.getState().myOrder(['upcoming', 'running', 'completed', 'accepted', 'booked', 'parked', 'returned', 'cancelled']);
                    return res;
                } catch (err: any) {
                    const errMsg = err?.response?.data?.message || err?.message || String(err);
                    showToast(errMsg);
                    throw err;
                }
            },

            myOrder: async (status: string | string[]) => {
                try {
                    const statuses = Array.isArray(status) ? status : [status];
                    const promises = statuses.map(s => Api.get('/my-orders', { query: { status: s } }));
                    const results = await Promise.all(promises);
                    let allOrders: any[] = [];
                    results.forEach(res => {
                        const list = res.orders || res.data || (Array.isArray(res) ? res : []);
                        allOrders = [...allOrders, ...list];
                    });

                    // Sort by requested_at descending
                    allOrders.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());

                    set((prev) => ({
                        valet: { ...prev.valet, myOrders: allOrders },
                    }));
                } catch (error) {
                    console.log(error)
                }
            },

            cancelOrder: async (id: string) => {
                try {
                    const res = await Api.post(`/order/${id}/cancel`, {});

                    useValetStore.getState().get.list();
                    useValetStore.getState().myOrder(['upcoming', 'running', 'completed', 'accepted', 'booked', 'parked', 'returned', 'cancelled']);
                    return res;
                } catch (err: any) {
                    console.log('err', err)
                    const errMsg = err?.response?.data?.message || err?.message || String(err);
                    showToast(errMsg);
                    throw err;
                }
            },

        })
    )
);

export default useValetStore;
