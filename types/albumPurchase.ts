// Album Purchase Types

// Enums
export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'NEED_NEGOTIATION'
  | 'SUBMITTED'
  | 'SHIPPED'
  | 'COMPLETE_TRACKING_NUMBER'
  | 'RECEIVED_AND_MATCHED'
  | 'REVIEWING'
  | 'FINAL_NEGOTIATION'
  | 'FINISH_REVIEW'
  | 'PENDING_SETTLEMENT'
  | 'SETTLEMENT_COMPLETED';

export type EventStatus = 'AVAILABLE_FOR_PURCHASE' | 'DISCONTINUED';

export type EventPurchaseType =
  | 'ONLY_PHOTOCARD'
  | 'ONLY_ALBUM'
  | 'ALBUM_AND_PHOTOCARD'
  | 'ETC';

export type SettlementStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HOLD';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

// Event DTOs
export interface AlbumPurchaseEventDetail {
  id: number;
  title: string;
  eventDescription?: string;
  memo?: string;
  purchaseAlbumPrice: number;
  photocardPrice: number;
  purchaseAlbumAndPhotocardPrice: number;
  etcPrice: number;
  etcDescription?: string;
  eventDate: string;
  limitPeriodDate?: number;
  deadlineForArrivalDate: string;
  isbn: string;
  albumTitle: string;
  albumArtist: string;
  albumReleaseDate: string;
  albumEntertainmentAgency?: string;
  isDeleted: boolean;
  isVisible: boolean;
  isFinished: boolean;
  eventStatus: EventStatus;
  eventPurchaseType: EventPurchaseType;
  albumPurchaseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumPurchaseEventList {
  id: number;
  title: string;
  albumTitle: string;
  albumArtist: string;
  purchaseAlbumPrice: number;
  eventDate: string;
  deadlineForArrivalDate: string;
  isVisible: boolean;
  isFinished: boolean;
  eventStatus: EventStatus;
  eventPurchaseType: EventPurchaseType;
  albumPurchaseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  albumPurchaseId: number;
  title: string;
  eventDescription?: string;
  memo?: string;
  purchaseAlbumPrice: number;
  photocardPrice: number;
  purchaseAlbumAndPhotocardPrice: number;
  etcPrice: number;
  eventDate: string;
  deadlineForArrivalDate: string;
  limitPeriodDate?: number;
  etcDescription?: string;
  isbn: string;
  albumTitle: string;
  albumArtist: string;
  albumReleaseDate: string;
  albumEntertainmentAgency?: string;
  eventStatus: EventStatus;
  eventPurchaseType: EventPurchaseType;
}

export interface UpdateEventRequest {
  title?: string;
  eventDescription?: string;
  memo?: string;
  purchaseAlbumPrice?: number;
  photocardPrice?: number;
  purchaseAlbumAndPhotocardPrice?: number;
  etcPrice?: number;
  eventDate?: string;
  deadlineForArrivalDate?: string;
  limitPeriodDate?: number;
  etcDescription?: string;
  isVisible?: boolean;
  isFinished?: boolean;
  eventStatus?: EventStatus;
  eventPurchaseType?: EventPurchaseType;
}

// Request DTOs
export interface AlbumPurchaseRequestSimple {
  requestId: number;
  createdAt: string;
  status: PurchaseRequestStatus;
  totalEvaluatedPrice: number;
  itemCount: number;
  userId: number;
  userEmail: string;
  userName: string;
  phoneNumber: string;
  eventId: number;
  eventTitle: string;
  albumTitle: string;
}

export interface AlbumPurchaseRequestDetail {
  requestId: number;
  createdAt: string;
  updatedAt: string;
  status: PurchaseRequestStatus;
  totalEvaluatedPrice: number;
  totalEvaluatedStock: number;
  blockAction: string;
  // 신청자 정보
  userId: number;
  userEmail: string;
  userName: string;
  // 배송지 정보 (신청 시 선택한 주소)
  recipientName: string;
  recipientPhone: string;
  address: string;
  addressDetail: string;
  zipcode: string;
  // 은행 정보
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
  // 행사 정보
  eventId: number;
  eventTitle: string;
  items: RequestItem[];
  shippings: ShippingInfo[];
  trackingNumbers?: TrackingNumberInfo[];
  rejectionReason?: string;
  reviewerNote?: string;
  receivedAt?: string;
  reviewStartedAt?: string;
  finishReviewAt?: string;
  rejectedAt?: string;
  actualReceivedAt?: string;
  settledAt?: string;
}

export type PurchaseAvailableType =
  | 'AVAILABLE'
  | 'NEED_NEGOTIATION'
  | 'UNAVAILABLE';

export interface RequestItem {
  requestItemId: number;
  albumId: number;
  albumTitle: string;
  albumArtist: string;
  albumIsbn: string;
  entertainmentAgency?: string;
  eventId?: number;
  eventTitle?: string;
  evaluatedPrice: number;
  quantity: number;
  finalPrice: number;
  itemOrder: number;
  purchaseAvailableType: PurchaseAvailableType;
  eventPurchaseType?: EventPurchaseType;
  note?: string;
  albumThumbnailUrl?: string;
}

export interface ShippingInfo {
  shippingId: number;
  trackingNumber: string;
  shippingCompany: string;
  actualQuantity: number;
  isReceived: boolean;
  receivedAt?: string;
  receivedBy?: string;
  requestId?: number;
  memo?: string;
  matchedReceiptId?: number;
  photocardCount?: number;
  hasSignedAlbum?: boolean;
  videoUrl?: string;
}

export interface TrackingNumberInfo {
  trackingNumberId: number;
  trackingNumber: string;
  shippingCompany: string;
  isMatched: boolean;
  memo?: string;
  createdAt: string;
  matchedAt?: string;
}

// Receipt DTOs
export interface QuickScanRequest {
  trackingNumber: string;
  receivedBy?: string; // 수령자 (로그인한 유저 이메일)
}

export interface QuickScanResponse {
  receiptId: number;
  trackingNumber: string;
  message: string;
}

export interface UpdateReceiptRequest {
  trackingNumber?: string;
  shippingCompany?: string;
  receivedBy?: string;
  senderName?: string;
  deliveryDestination?: string;
  arrivedQuantity?: number;
  normalPurchaseCount?: number;
  damagedCount?: number;
  hasSignedAlbum?: boolean;
  hasUnreleasedPhotocard?: boolean;
  photocardCount?: number;
  memo?: string;
}

export interface UpdateVideoRequest {
  videoUrl: string;
}

export interface ScanReceiptRequest {
  trackingNumber: string;
  shippingCompany: string;
  receivedBy: string;
  memo?: string;
}

export interface ScanReceiptResponse {
  matched: boolean;
  requestId?: number;
  shippingId?: number;
  unmatchedReceiptId?: number;
  trackingNumber: string;
  message: string;
}

export interface UnmatchedReceiptDetail {
  id: number;
  trackingNumber: string;
  shippingCompany?: string;
  receivedAt: string;
  receivedBy?: string;
  senderName?: string;
  deliveryDestination?: string;
  arrivedQuantity?: number;
  normalPurchaseCount?: number;
  damagedCount?: number;
  hasSignedAlbum?: boolean;
  hasUnreleasedPhotocard?: boolean;
  photocardCount?: number;
  videoUrl?: string;
  isMatched: boolean;
  matchedRequestId?: number;
  matchedAt?: string;
  matchedBy?: string;
  memo?: string;
  createdAt: string;
}

export interface MatchReceiptRequest {
  requestId: number;
  trackingNumber?: string;
  matchedBy: string;
}

export interface UnmatchReceiptRequest {
  unmatchedBy: string;
  reason?: string;
}

export interface UnmatchReceiptResponse {
  unmatchedReceiptId: number;
  trackingNumber: string;
  message: string;
}

// Settlement DTOs
export interface SettlementSimple {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  settlementDate: string;
  finalAmount: number;
  status: SettlementStatus;
  createdAt: string;
}

export interface SettlementDetail {
  id: number;
  purchaseRequestId: number;
  userId: number;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  settlementDate: string;
  originalAmount: number;
  finalAmount: number;
  status: SettlementStatus;
  processedBy: string;
  processedAt: string;
  transferredAt?: string;
  settlementNote?: string;
  items: SettlementItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SettlementItem {
  id: number;
  albumTitle: string;
  albumArtist: string;
  entertainmentAgency: string;
  albumIsbn: string;
  finalPrice: number;
}

export interface CreateSettlementRequest {
  requestIds: number[];
  settlementNote?: string;
  processedBy: string;
}

export interface CompleteSettlementRequest {
  transferredAt: string;
  settlementNote?: string;
}

export interface EligibleRequest {
  requestId: number;
  userId: number;
  userName: string;
  userEmail: string;
  totalEvaluatedPrice: number;
  finishReviewAt: string;
  bankName: string;
  bankAccountNumber: string;
}

// Negotiation DTOs
export interface AcceptRequestDTO {
  reviewerNote?: string;
}

export interface RejectRequestDTO {
  rejectionReason: string;
  reviewerNote?: string;
}

export interface ProposeRequestDTO {
  proposedPrice: number;
  proposalNote?: string;
  proposedBy: string;
}

export interface UpdateStatusRequestDTO {
  status: PurchaseRequestStatus;
  note?: string;
}

export interface UpdateStatusResponseDTO {
  requestId: number;
  status: string;
  message: string;
  allowedTransitions?: PurchaseRequestStatus[];
}

export interface UpdateRequestItemDTO {
  eventPurchaseType?: EventPurchaseType;
  purchaseAvailableType?: PurchaseAvailableType;
  evaluatedPrice?: number;
  quantity?: number;
  note?: string;
}

export interface UpdateSettlementStatusRequest {
  status: SettlementStatus;
  settlementNote?: string;
  transferredAt?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalSettlementCount: number;
  pendingSettlementCount: number;
  completedSettlementCount: number;
  totalSettlementAmount: number;
  pendingSettlementAmount: number;
  completedSettlementAmount: number;
  todaySettlementCount: number;
  todaySettlementAmount: number;
  thisMonthSettlementCount: number;
  thisMonthSettlementAmount: number;
}

export interface PeriodReport {
  startDate: string;
  endDate: string;
  totalSettlementCount: number;
  completedCount: number;
  pendingCount: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  year: number;
  month: number;
  settlementCount: number;
  totalAmount: number;
}
