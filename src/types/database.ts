export type ProductBadge = 'Oferta Especial' | 'Don Carlos Recomienda';

export interface CategoryRef {
  id?: number;
  name?: string;
  slug?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price_per_kg: number;
  price_per_lb?: number | null;
  stock: number;
  category_id: number;
  image_url?: string | null;
  is_active: boolean;
  is_promoted?: boolean;
  badge?: ProductBadge;
  categories?: CategoryRef | CategoryRef[] | null;
}

export interface Campaign {
  id: string;
  product_id: number;
  title: string;
  objective: 'ventas' | 'leads' | 'trafico' | 'reconocimiento';
  status: 'draft' | 'approved' | 'active';
  brief: string;
  ia_switch_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  campaign_id?: string;
  type: 'image' | 'video' | 'audio';
  provider: 'predis' | 'elevenlabs' | 'manual';
  content_url: string;
  copy_text?: string;
  is_approved?: boolean;
  duration?: number;
}

export interface ScheduledPublication {
  id: string;
  asset_id: string;
  platform: 'web' | 'meta' | 'tiktok' | 'whatsapp';
  scheduled_at: string;
  is_published: boolean;
  published_at?: string | null;
}

export interface CartLegacyItem {
  id: number | string;
  name: string;
  price: number;
  img?: string;
  tipo: 'kg' | 'corte' | 'unidad' | 'paquete';
  peso?: number;
  piezas?: number;
  grosor?: number;
  basePeso?: number;
  categoria?: string;
  orderMode?: 'weight' | 'pieces' | 'price';
  requestedWeightKg?: number;
  requestedPieces?: number;
  requestedBudget?: number;
  unitWeightKg?: number;
  avgPieceWeightKg?: number;
}

export interface BuildAdsCampaignRequest {
  prompt: string;
  format: 'post' | 'reel' | 'carousel';
  brand_colors: string[];
}

export interface BuildAdsAudioRequest {
  text: string;
  voice_id: 'don_carlos_v1';
  stability: number;
}
