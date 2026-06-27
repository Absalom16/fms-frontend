export type UserRole = 'admin' | 'passenger' | 'crew' | 'manager';
export type FlightStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'delayed' | 'cancelled' | 'diverted';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'boarded' | 'no_show';
export type CabinClass = 'economy' | 'business' | 'first';
export type PaymentMethod = 'mtn_mobile_money' | 'airtel_money' | 'credit_card' | 'mobile_money' | 'card' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type CrewRole = 'captain' | 'co_pilot' | 'flight_attendant' | 'purser' | 'flight_engineer' | 'ground_staff';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface PassengerProfile {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  passport_expiry?: string;
  travel_document_expiry?: string;
  frequent_flyer_number?: string;
  frequent_flyer_points?: number;
  loyalty_points?: number;
  loyalty_tier?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  document_expiring_soon?: boolean;
}

export interface Airport {
  id: number;
  iata_code: string;
  icao_code?: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export interface Aircraft {
  id: number;
  registration: string;
  registration_number?: string;
  model: string;
  manufacturer?: string;
  economy_seats: number;
  business_seats: number;
  first_class_seats: number;
  total_seats: number;
  status: 'active' | 'maintenance' | 'retired';
  created_at: string;
}

export interface Route {
  id: number;
  origin_airport_id: number;
  destination_airport_id: number;
  distance_km?: number;
  estimated_duration_minutes?: number;
  origin_airport: Airport;
  destination_airport: Airport;
}

export interface Seat {
  id: number;
  aircraft_id: number;
  seat_number: string;
  seat_class: CabinClass;
  seat_type?: string;
  is_window?: boolean;
  is_aisle?: boolean;
  is_extra_legroom?: boolean;
  is_available?: boolean;
  is_occupied?: boolean;
}

export interface Flight {
  id: number;
  flight_number: string;
  route_id: number;
  aircraft_id: number;
  departure_datetime: string;
  arrival_datetime: string;
  gate?: string;
  terminal?: string;
  status: FlightStatus;
  base_price: number;
  business_price?: number;
  first_price?: number;
  price_for_class?: Record<string, number>;
  available_seats?: number;
  total_seats?: number;
  delay_minutes?: number;
  delay_reason?: string;
  cancellation_reason?: string;
  route?: Route;
  aircraft?: Aircraft;
  cabin_class?: CabinClass;
  created_at: string;
}

export interface Ticket {
  id: number;
  booking_id: number;
  ticket_number: string;
  barcode?: string;
  qr_code?: string;
  status: 'active' | 'used' | 'cancelled';
  issued_at: string;
}

export interface Booking {
  id: number;
  passenger_id: number;
  flight_id: number;
  seat_id?: number;
  pnr_code: string;
  cabin_class?: CabinClass;
  total_price: number;
  fare_amount?: number;
  passengers?: number;
  status: BookingStatus;
  special_requests?: string;
  booked_at?: string;
  checked_in_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  flight?: Flight;
  seat?: Seat;
  ticket?: Ticket;
  passenger?: PassengerProfile;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  provider?: string;
  transaction_id?: string;
  phone_number?: string;
  status: PaymentStatus;
  paid_at?: string;
  refunded_at?: string;
  refund_amount?: number;
  created_at: string;
}

export interface CrewMember {
  id: number;
  user_id?: number;
  employee_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  crew_role?: CrewRole;
  license_number?: string;
  license_expiry?: string;
  certification_expiry?: string;
  medical_cert_expiry?: string;
  medical_expiry?: string;
  hire_date?: string;
  nationality?: string;
  status?: 'active' | 'on_leave' | 'retired';
  is_certification_valid?: boolean;
  is_medical_valid?: boolean;
  certification_valid?: boolean;
  medical_valid?: boolean;
}

export interface FlightCrewAssignment {
  id: number;
  flight_id: number;
  crew_member_id: number;
  role_on_flight: string;
  assigned_at: string;
  crew_member?: CrewMember;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  per_page?: number;
  pages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departure_date: string;
  cabin_class?: string;
  passengers?: number;
}

export interface BookingCreatePayload {
  flight_id: number;
  seat_id: number;
  cabin_class: CabinClass;
  passengers?: number;
  special_requests?: string;
}

export interface PaymentCreatePayload {
  booking_id: number;
  payment_method: string;
  amount?: number;
  provider?: string;
  phone_number?: string;
  currency?: string;
}

// Report types
export interface BookingReportItem {
  date: string;
  total?: number;
  confirmed: number;
  cancelled: number;
}

export interface RevenueReportItem {
  period: string;
  revenue: number;
  transactions?: number;
}

export interface OccupancyReportItem {
  flight_number: string;
  route?: string;
  departure?: string;
  booked_seats?: number;
  booked?: number;
  total_seats: number;
  occupancy_rate?: number;
  occupancy_pct?: number;
}
