import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@/environments/environment';
import {
    Association,
    Bus,
    BusLevel,
    BusType,
    CashInventory,
    CashLedgerEntry,
    City,
    CreateAssociationRequest,
    CreateBusRequest,
    CreateBusLevelRequest,
    CreateBusTypeRequest,
    CreateCityRequest,
    CreateRouteRequest,
    CreateSalesPartyRequest,
    CreateScheduleRequest,
    CreateStationRequest,
    CreateTicketerRequest,
    CreateUserStationAssignmentRequest,
    DashboardReport,
    DailyPartyRevenue,
    DailyTicketStats,
    PaymentSettings,
    Route,
    SalesParty,
    Schedule,
    SellingOptionSchedule,
    SellingOptionSummary,
    SetTariffRequest,
    SetUserActiveRequest,
    Station,
    Tariff,
    Ticket,
    TopBusStats,
    TopCounterStats,
    UpdateAssociationRequest,
    UpdateBusRequest,
    UpdateBusLevelRequest,
    UpdateBusTypeRequest,
    UpdatePaymentSettingsRequest,
    UpdateRouteRequest,
    UpdateSalesPartyRequest,
    UpdateScheduleRequest,
    UpdateStationRequest,
    UserStationAssignment,
    UserSummary
} from '@/app/core/models/api.models';

@Injectable({ providedIn: 'root' })
export class TicketApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    getBuses() {
        return this.http.get<Bus[]>(`${this.baseUrl}/buses`);
    }

    getBus(id: string) {
        return this.http.get<Bus>(`${this.baseUrl}/buses/${id}`);
    }

    createBus(request: CreateBusRequest) {
        return this.http.post<Bus>(`${this.baseUrl}/buses`, request);
    }

    updateBus(id: string, request: UpdateBusRequest) {
        return this.http.put<Bus>(`${this.baseUrl}/buses/${id}`, request);
    }

    getAssociations() {
        return this.http.get<Association[]>(`${this.baseUrl}/associations`);
    }

    createAssociation(request: CreateAssociationRequest) {
        return this.http.post<Association>(`${this.baseUrl}/associations`, request);
    }

    updateAssociation(id: string, request: UpdateAssociationRequest) {
        return this.http.put<Association>(`${this.baseUrl}/associations/${id}`, request);
    }

    getBusLevels() {
        return this.http.get<BusLevel[]>(`${this.baseUrl}/bus-levels`);
    }

    createBusLevel(request: CreateBusLevelRequest) {
        return this.http.post<BusLevel>(`${this.baseUrl}/bus-levels`, request);
    }

    updateBusLevel(id: string, request: UpdateBusLevelRequest) {
        return this.http.put<BusLevel>(`${this.baseUrl}/bus-levels/${id}`, request);
    }

    getBusTypes() {
        return this.http.get<BusType[]>(`${this.baseUrl}/bus-types`);
    }

    createBusType(request: CreateBusTypeRequest) {
        return this.http.post<BusType>(`${this.baseUrl}/bus-types`, request);
    }

    updateBusType(id: string, request: UpdateBusTypeRequest) {
        return this.http.put<BusType>(`${this.baseUrl}/bus-types/${id}`, request);
    }

    getStations(cityId?: string) {
        let params = new HttpParams();
        if (cityId) {
            params = params.set('cityId', cityId);
        }
        return this.http.get<Station[]>(`${this.baseUrl}/stations`, { params });
    }

    createStation(request: CreateStationRequest) {
        return this.http.post<Station>(`${this.baseUrl}/stations`, request);
    }

    updateStation(id: string, request: UpdateStationRequest) {
        return this.http.put<Station>(`${this.baseUrl}/stations/${id}`, request);
    }

    getCities() {
        return this.http.get<City[]>(`${this.baseUrl}/cities`);
    }

    createCity(request: CreateCityRequest) {
        return this.http.post<City>(`${this.baseUrl}/cities`, request);
    }

    getRoutes(toCityId?: string) {
        let params = new HttpParams();
        if (toCityId) {
            params = params.set('toCityId', toCityId);
        }
        return this.http.get<Route[]>(`${this.baseUrl}/routes`, { params });
    }

    createRoute(request: CreateRouteRequest) {
        return this.http.post<Route>(`${this.baseUrl}/routes`, request);
    }

    updateRoute(id: string, request: UpdateRouteRequest) {
        return this.http.put<Route>(`${this.baseUrl}/routes/${id}`, request);
    }

    getActiveTariffs() {
        return this.http.get<Tariff[]>(`${this.baseUrl}/tariffs/active`);
    }

    setTariff(request: SetTariffRequest) {
        return this.http.put<Tariff>(`${this.baseUrl}/tariffs`, request);
    }

    getTariffHistory() {
        return this.http.get<Tariff[]>(`${this.baseUrl}/tariffs/history`);
    }

    getSchedules(routeId?: string, date?: string) {
        let params = new HttpParams();
        if (routeId) {
            params = params.set('routeId', routeId);
        }
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<Schedule[]>(`${this.baseUrl}/schedules`, { params });
    }

    createSchedule(request: CreateScheduleRequest) {
        return this.http.post<Schedule>(`${this.baseUrl}/schedules`, request);
    }

    updateSchedule(id: string, request: UpdateScheduleRequest) {
        return this.http.put<Schedule>(`${this.baseUrl}/schedules/${id}`, request);
    }

    searchSellingOptions(toCityId: string, date: string) {
        const params = new HttpParams().set('toCityId', toCityId).set('date', date);
        return this.http.get<SellingOptionSummary[]>(`${this.baseUrl}/selling-options/search`, { params });
    }

    getSellingOptionSchedules(optionKey: string) {
        return this.http.get<SellingOptionSchedule[]>(`${this.baseUrl}/selling-options/${encodeURIComponent(optionKey)}/schedules`);
    }

    searchTickets(scheduleId?: string, passengerPhone?: string, date?: string) {
        let params = new HttpParams();
        if (scheduleId) {
            params = params.set('scheduleId', scheduleId);
        }
        if (passengerPhone) {
            params = params.set('passengerPhone', passengerPhone);
        }
        if (date) {
            params = params.set('date', date);
        }
        return this.http.get<Ticket[]>(`${this.baseUrl}/tickets`, { params });
    }

    getTicket(id: string) {
        return this.http.get<Ticket>(`${this.baseUrl}/tickets/${id}`);
    }

    getSalesParties() {
        return this.http.get<SalesParty[]>(`${this.baseUrl}/sales-parties`);
    }

    createSalesParty(request: CreateSalesPartyRequest) {
        return this.http.post<SalesParty>(`${this.baseUrl}/sales-parties`, request);
    }

    updateSalesParty(id: string, request: UpdateSalesPartyRequest) {
        return this.http.put<SalesParty>(`${this.baseUrl}/sales-parties/${id}`, request);
    }

    getCashInventory() {
        return this.http.get<CashInventory[]>(`${this.baseUrl}/cash-inventory`);
    }

    getCashLedger(salesPartyId?: string) {
        let params = new HttpParams();
        if (salesPartyId) {
            params = params.set('salesPartyId', salesPartyId);
        }
        return this.http.get<CashLedgerEntry[]>(`${this.baseUrl}/cash-inventory/ledger`, { params });
    }

    getPaymentSettings() {
        return this.http.get<PaymentSettings>(`${this.baseUrl}/settings/payments`);
    }

    updatePaymentSettings(request: UpdatePaymentSettingsRequest) {
        return this.http.put<PaymentSettings>(`${this.baseUrl}/settings/payments`, request);
    }

    getDashboardReport(from?: string, to?: string, top = 10) {
        let params = new HttpParams().set('top', top);
        if (from) {
            params = params.set('from', from);
        }
        if (to) {
            params = params.set('to', to);
        }
        return this.http.get<DashboardReport>(`${this.baseUrl}/reports/dashboard`, { params });
    }

    getTicketsByDay(from?: string, to?: string) {
        let params = new HttpParams();
        if (from) {
            params = params.set('from', from);
        }
        if (to) {
            params = params.set('to', to);
        }
        return this.http.get<DailyTicketStats[]>(`${this.baseUrl}/reports/tickets-by-day`, { params });
    }

    getTopBuses(from?: string, to?: string, top = 10) {
        let params = new HttpParams().set('top', top);
        if (from) {
            params = params.set('from', from);
        }
        if (to) {
            params = params.set('to', to);
        }
        return this.http.get<TopBusStats[]>(`${this.baseUrl}/reports/top-buses`, { params });
    }

    getTopCounters(from?: string, to?: string, top = 10) {
        let params = new HttpParams().set('top', top);
        if (from) {
            params = params.set('from', from);
        }
        if (to) {
            params = params.set('to', to);
        }
        return this.http.get<TopCounterStats[]>(`${this.baseUrl}/reports/top-counters`, { params });
    }

    getRevenueByParty(from?: string, to?: string) {
        let params = new HttpParams();
        if (from) {
            params = params.set('from', from);
        }
        if (to) {
            params = params.set('to', to);
        }
        return this.http.get<DailyPartyRevenue[]>(`${this.baseUrl}/reports/revenue-by-party`, { params });
    }

    getUsers() {
        return this.http.get<UserSummary[]>(`${this.baseUrl}/users`);
    }

    createTicketer(request: CreateTicketerRequest) {
        return this.http.post<UserSummary>(`${this.baseUrl}/users`, request);
    }

    setUserActive(id: string, request: SetUserActiveRequest) {
        return this.http.patch<UserSummary>(`${this.baseUrl}/users/${id}/active`, request);
    }

    getUserStationAssignments(userId: string) {
        return this.http.get<UserStationAssignment[]>(`${this.baseUrl}/users/${userId}/station-assignments`);
    }

    assignUserStation(userId: string, request: CreateUserStationAssignmentRequest) {
        return this.http.post<UserStationAssignment>(`${this.baseUrl}/users/${userId}/station-assignments`, request);
    }

    endUserStationAssignment(userId: string, assignmentId: string) {
        return this.http.post<UserStationAssignment>(`${this.baseUrl}/users/${userId}/station-assignments/${assignmentId}/end`, {});
    }
}
