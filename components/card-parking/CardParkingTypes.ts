export interface FormState {
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
    phone: string;
    driverName: string;
    photoUri: string | null;
}

export interface PhotosState {
    front: string | null;
    rear: string | null;
    left: string | null;
    right: string | null;
}

export interface CameraState {
    facing: 'back' | 'front';
    flashlight: boolean;
    ocrScanning: boolean;
    generating: boolean;
}

export interface WorkflowState {
    mode: 'checkin' | 'keyreturn';
    checkinStep: number; // 2: Details, 3: Ticket+QR
    returnStep: number;  // 1: Scan, 2: Search, 3: Ticket Found, 4: Reinspection, 5: Status Return
}

export interface TicketData {
    ticketId: string;
    vehicleNumber: string;
    vehicleType: string;
    vehicleColor?: string;
    ownerName: string;
    phone?: string;
    parkingSite?: string;
    entryTime?: string;
    keySlot?: string;
}

export interface SiteOption {
    id: string;
    name: string;
    code: string;
}
