export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
    role: string;
    fullName: string;
    mustChangePassword: boolean;
}

export interface AuthTokenResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
    role: string;
    fullName: string;
    mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

export interface UserSummary {
    id: string;
    username: string;
    fullName: string;
    role: string;
    isActive: boolean;
    mustChangePassword: boolean;
}

export interface CreateTicketerRequest {
    username: string;
    fullName: string;
    password: string;
    email?: string | null;
}

export interface SetUserActiveRequest {
    isActive: boolean;
}

export interface ApiErrorResponse {
    code?: string;
    description?: string;
    title?: string;
    detail?: string;
    status?: number;
}

export interface AssociationRef {
    id: string;
    name: string;
    code: string;
}

export interface Association extends AssociationRef {
    shortName: string | null;
    memberCount: number | null;
    contactPhone: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CreateAssociationRequest {
    name: string;
    code: string;
    shortName?: string | null;
    memberCount?: number | null;
    contactPhone?: string | null;
}

export interface UpdateAssociationRequest {
    name: string;
    shortName?: string | null;
    memberCount?: number | null;
    contactPhone?: string | null;
    isActive: boolean;
}

export interface BusLevelRef {
    id: string;
    code: string;
    name: string;
    rank: number;
}

export interface BusLevel extends BusLevelRef {
    isActive: boolean;
    createdAt: string;
}

export interface CreateBusLevelRequest {
    code: string;
    name: string;
    rank: number;
}

export interface UpdateBusLevelRequest {
    name: string;
    rank: number;
    isActive: boolean;
}

export interface BusTypeRef {
    id: string;
    code: string;
    name: string;
}

export interface BusType extends BusTypeRef {
    isActive: boolean;
    createdAt: string;
}

export interface CreateBusTypeRequest {
    code: string;
    name: string;
}

export interface UpdateBusTypeRequest {
    name: string;
    isActive: boolean;
}

export interface Station {
    id: string;
    cityId: string;
    cityName: string;
    name: string;
    nameAm: string;
    code: string;
    isActive: boolean;
    isImplicitDefault: boolean;
    createdAt: string;
}

export interface CreateStationRequest {
    cityId: string;
    name: string;
    nameAm: string;
    code: string;
}

export interface UpdateStationRequest {
    name: string;
    nameAm: string;
    isActive: boolean;
}

export interface RouteStation {
    id: string;
    name: string;
    nameAm: string;
    code: string;
    cityId: string;
    cityName: string;
    isImplicitDefault: boolean;
}

export interface UserStationAssignment {
    assignmentId: string;
    userId: string;
    stationId: string;
    stationName: string;
    stationNameAm: string;
    stationCode: string;
    cityId: string;
    cityName: string;
    isImplicitDefault: boolean;
    assignedAtUtc: string;
    endedAtUtc: string | null;
    isActive: boolean;
}

export interface CreateUserStationAssignmentRequest {
    stationId: string;
}

export interface Bus {
    id: string;
    ownerName: string;
    ownerPhone: string;
    delegatePhone: string;
    sideNumber: string;
    plateNumber: string;
    seatCount: number;
    association: AssociationRef;
    busLevel: BusLevelRef;
    busType: BusTypeRef;
    isActive: boolean;
    createdAt: string;
}

export interface CreateBusRequest {
    ownerName: string;
    ownerPhone: string;
    delegatePhone: string;
    sideNumber: string;
    plateNumber: string;
    seatCount: number;
    associationId?: string | null;
    busLevelId?: string | null;
    busTypeId?: string | null;
}

export interface UpdateBusRequest extends CreateBusRequest {
    isActive: boolean;
}

export interface City {
    id: string;
    name: string;
    distanceFromAddisKm: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateCityRequest {
    name: string;
    distanceFromAddisKm: number;
}

export interface Route {
    id: string;
    fromCityId: string;
    fromCity: string;
    fromStation: RouteStation;
    toCityId: string;
    toCity: string;
    toStation: RouteStation;
    distanceKm: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateRouteRequest {
    toCityId: string;
    toStationId?: string | null;
}

export interface UpdateRouteRequest {
    toCityId: string;
    isActive: boolean;
    toStationId?: string | null;
}

export interface Tariff {
    id: string;
    busLevel: BusLevelRef;
    busType: BusTypeRef;
    ratePerKm: number;
    currency: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo: string | null;
}

export interface SetTariffRequest {
    busLevelId: string;
    busTypeId: string;
    ratePerKm: number;
}

export interface Schedule {
    id: string;
    routeId: string;
    fromCity: string;
    toCity: string;
    distanceKm: number;
    busId: string;
    plateNumber: string;
    seatCount: number;
    departureAt: string;
    sequenceNumber: number;
    status: string;
    soldSeatCount: number;
    availableSeatCount: number;
    ratePerKm: number;
    ticketPrice: number;
}

export interface CreateScheduleRequest {
    routeId: string;
    busId: string;
    departureAt: string;
    sequenceNumber: number;
}

export interface UpdateScheduleRequest {
    departureAt: string;
    sequenceNumber: number;
    status: string;
}

export interface SalesParty {
    id: string;
    name: string;
    code: string;
    amountPerSeatEtb: number;
    source: string;
    allocationType: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
}

export interface CreateSalesPartyRequest {
    name: string;
    code: string;
    amountPerSeatEtb: number;
    source: string;
    allocationType: string;
    sortOrder: number;
}

export interface UpdateSalesPartyRequest {
    name: string;
    amountPerSeatEtb: number;
    source: string;
    allocationType: string;
    sortOrder: number;
    isActive: boolean;
}

export interface CashInventory {
    salesPartyId: string;
    partyCode: string;
    partyName: string;
    source: string;
    balanceEtb: number;
    updatedAt: string;
}

export interface CashLedgerEntry {
    id: string;
    salesPartyId: string;
    partyCode: string;
    partyName: string;
    ticketId: string;
    entryType: string;
    amountEtb: number;
    balanceAfterEtb: number;
    occurredAt: string;
}

export interface PaymentSettings {
    onlinePaymentEnabled: boolean;
}

export interface UpdatePaymentSettingsRequest {
    onlinePaymentEnabled: boolean;
}

export interface DashboardReport {
    from: string;
    to: string;
    summary: DashboardSummary;
    ticketsByDay: DailyTicketStats[];
    topBuses: TopBusStats[];
    topCounters: TopCounterStats[];
    revenueByPartyByDay: DailyPartyRevenue[];
}

export interface DashboardSummary {
    totalTicketsSold: number;
    totalTicketFareEtb: number;
    totalSalesFeeEtb: number;
    totalCashCollectedEtb: number;
    partyTotals: PartyRevenueTotal[];
}

export interface DailyTicketStats {
    date: string;
    ticketCount: number;
    ticketFareEtb: number;
    salesFeeEtb: number;
    totalCashCollectedEtb: number;
}

export interface TopBusStats {
    busId: string;
    plateNumber: string;
    sideNumber: string;
    ticketsSold: number;
    ticketFareEtb: number;
}

export interface TopCounterStats {
    userId: string;
    userName: string;
    ticketsSold: number;
    ticketFareEtb: number;
    salesFeeEtb: number;
    totalCashCollectedEtb: number;
}

export interface DailyPartyRevenue {
    date: string;
    parties: PartyDayAmount[];
}

export interface PartyDayAmount {
    partyCode: string;
    partyName: string;
    source: string;
    amountEtb: number;
}

export interface PartyRevenueTotal {
    partyCode: string;
    partyName: string;
    source: string;
    amountEtb: number;
}

export const SCHEDULE_STATUSES = ['Scheduled', 'Boarding', 'Departed', 'Cancelled'] as const;
export const SALES_PARTY_SOURCES = ['SalesFee', 'BusOwnerIncome'] as const;
export const SALES_PARTY_ALLOCATION_TYPES = ['FixedAmount', 'BusOwnerRemainder'] as const;

export interface SellingOptionSummary {
    optionKey: string;
    routeId: string;
    fromCity: string;
    fromStation: RouteStation;
    toCity: string;
    toStation: RouteStation;
    association: AssociationRef;
    busLevel: BusLevelRef;
    busType: BusTypeRef;
    distanceKm: number;
    ratePerKm: number;
    ticketPrice: number;
    nextDepartureAt: string;
    availableBusCount: number;
    availableSeatCount: number;
}

export interface SellingOptionSchedule {
    scheduleId: string;
    sequenceNumber: number;
    departureAt: string;
    plateNumber: string;
    sideNumber: string;
    totalSeats: number;
    availableSeatCount: number;
    isFullySold: boolean;
}

export interface Ticket {
    id: string;
    scheduleId: string;
    fromCity: string;
    toCity: string;
    departureAt: string;
    sequenceNumber: number;
    plateNumber: string;
    sideNumber: string;
    seatNumber: number;
    passengerName: string;
    passengerPhone: string;
    nationalId: string | null;
    price: number;
    distanceKm: number;
    ratePerKm: number;
    paymentMethod: string;
    soldBy: string;
    soldAt: string;
}
