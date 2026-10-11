import Api from '@/src/Api/api';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export interface CardParkingTicket {
    id: string;
    ticket_id?: string;
    ticket_no?: string;
    ticket_number?: string;
    car_no: string;
    vehicle_number?: string;
    name: string;
    customer_name?: string;
    owner_name?: string;
    photo?: string | null;
    mobile_no?: string | null;
    phone_no?: string | null;
    phone?: string | null;
    vehicle_type?: string;
    key_slot?: string;
    parking_site?: string;
    status?: 'parked' | 'returned' | 'cancelled' | string;
    exit_time?: string | null;
    return_photo?: string | null;
    created_at?: string;
    updated_at?: string;
    requested_at?: string;
    entry_time?: string;
}

export interface ValetSiteOption {
    id: string;
    name: string;
    badge: string;
    description: string;
    attendants: number;
    slots: number;
    code: string;
    address?: string;
    city?: string;
}

const useCardParkingStore = create(
    combine(
        {
            tickets: [] as CardParkingTicket[],
            loading: false,
            total: 0,
            page: 1,
            selectedTicket: null as CardParkingTicket | null,
            sites: [] as ValetSiteOption[],
        },
        (set, get) => ({
            fetchTickets: async (params?: { search?: string; status?: string; page?: number; per_page?: number }) => {
                set({ loading: true });
                try {
                    const res = await Api.get('/card-parking', { query: params });
                    const list = res.data || res.tickets || (Array.isArray(res) ? res : []);
                    set({
                        tickets: list,
                        total: res.total || list.length,
                        page: res.page || 1,
                        loading: false,
                    });
                    return list;
                } catch (err) {
                    console.log('Failed to fetch card parkings:', err);
                    set({ loading: false });
                    return [];
                }
            },

            getTicketDetail: async (idOrQuery: string) => {
                try {
                    const res = await Api.get(`/card-parking/${idOrQuery}`);
                    const ticket = res.data || res.ticket || res;
                    set({ selectedTicket: ticket });
                    return ticket;
                } catch (err) {
                    // Try searching as list if direct id fails
                    try {
                        const searchRes = await Api.get('/card-parking', { query: { search: idOrQuery } });
                        const list = searchRes.data || (Array.isArray(searchRes) ? searchRes : []);
                        if (list.length > 0) {
                            set({ selectedTicket: list[0] });
                            return list[0];
                        }
                    } catch (sErr) {
                        console.log('Search fallback failed:', sErr);
                    }
                    throw err;
                }
            },

            createTicket: async (formData: FormData) => {
                try {
                    const res = await Api.post('/card-parking', formData, {
                        formData: true,
                    });
                    const newTicket = res.data || res;
                    useCardParkingStore.getState().fetchTickets();
                    return newTicket;
                } catch (err) {
                    console.error('Error creating ticket:', err);
                    throw err;
                }
            },

            returnTicket: async (id: string, formData?: FormData | any) => {
                try {
                    let res;
                    if (formData) {
                        res = await Api.post(`/card-parking/${id}/return`, formData, { formData: true }).catch(() =>
                            Api.put(`/card-parking/${id}`, formData, { formData: true })
                        );
                    } else {
                        res = await Api.post(`/card-parking/${id}/return`, { status: 'returned' }).catch(() =>
                            Api.put(`/card-parking/${id}`, { status: 'returned' })
                        );
                    }
                    useCardParkingStore.getState().fetchTickets();
                    return res;
                } catch (err) {
                    console.error('Error returning ticket:', err);
                    throw err;
                }
            },

            fetchSites: async () => {
                try {
                    const res = await Api.get('/valet-sites');
                    const rawList = res.sites || res.data || (Array.isArray(res) ? res : []);
                    const mapped: ValetSiteOption[] = rawList.map((s: any) => ({
                        id: String(s.id),
                        name: s.name || 'Valet Site',
                        badge: s.category || 'Premium',
                        description: `${s.address || ''} ${s.city || ''}`.trim() || 'Valet Parking Hub',
                        attendants: s.valet_slots || 5,
                        slots: s.valet_slots || 20,
                        code: `SITE-${s.id}`,
                        address: s.address,
                        city: s.city,
                    }));
                    set({ sites: mapped });
                    return mapped;
                } catch (err) {
                    console.log('Error fetching valet sites:', err);
                    return [];
                }
            },
        })
    )
);

export default useCardParkingStore;
