import { create } from 'zustand';

export type PhotoSlot = 'front' | 'rear' | 'left' | 'right';

export interface VehiclePhotosState {
    photoFront: string | null;
    photoRear: string | null;
    photoLeft: string | null;
    photoRight: string | null;
    setPhoto: (slot: PhotoSlot, uri: string | null) => void;
    setAllPhotos: (photos: {
        front?: string | null;
        rear?: string | null;
        left?: string | null;
        right?: string | null;
    }) => void;
    resetPhotos: () => void;
    countCaptured: () => number;
    getFormDataPhotos: () => {
        primaryPhoto: string | null;
        photoFront: string | null;
        photoRear: string | null;
        photoLeft: string | null;
        photoRight: string | null;
    };
}

export const useVehiclePhotosStore = create<VehiclePhotosState>((set, get) => ({
    photoFront: null,
    photoRear: null,
    photoLeft: null,
    photoRight: null,

    setPhoto: (slot: PhotoSlot, uri: string | null) => {
        if (slot === 'front') set({ photoFront: uri });
        else if (slot === 'rear') set({ photoRear: uri });
        else if (slot === 'left') set({ photoLeft: uri });
        else if (slot === 'right') set({ photoRight: uri });
    },

    setAllPhotos: (photos) => {
        set((state) => ({
            photoFront: photos.front !== undefined ? photos.front : state.photoFront,
            photoRear: photos.rear !== undefined ? photos.rear : state.photoRear,
            photoLeft: photos.left !== undefined ? photos.left : state.photoLeft,
            photoRight: photos.right !== undefined ? photos.right : state.photoRight,
        }));
    },

    resetPhotos: () => {
        set({
            photoFront: null,
            photoRear: null,
            photoLeft: null,
            photoRight: null,
        });
    },

    countCaptured: () => {
        const { photoFront, photoRear, photoLeft, photoRight } = get();
        let count = 0;
        if (photoFront) count++;
        if (photoRear) count++;
        if (photoLeft) count++;
        if (photoRight) count++;
        return count;
    },

    getFormDataPhotos: () => {
        const { photoFront, photoRear, photoLeft, photoRight } = get();
        const primaryPhoto = photoFront || photoRear || photoLeft || photoRight || null;
        return {
            primaryPhoto,
            photoFront,
            photoRear,
            photoLeft,
            photoRight,
        };
    },
}));

export default useVehiclePhotosStore;
