import Api from '@/src/Api/api';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';


export interface ParkingSlot {
    id: string;
    site_id: string;
    slot_number: string;
    is_active: boolean;
    images: string[];
}
const useParkingStore = create(
    combine(
        {
            slots: [] as ParkingSlot[],
            // loading: false,
            error: null as string | null,
        },
        (set) => ({
            actions: {
                fetchSlot: async (site_id: string) => {
                    try {
                        const res = await Api.get<ParkingSlot>(`/valet/parking/details/${site_id}`);
                        // console.log(res)
                        set({ slots: res?.data });
                    } catch (err: any) {
                        set({ error: err.message || 'Failed to fetch parking slot' });
                    }
                },
            },
        })
    )
);

export default useParkingStore;
