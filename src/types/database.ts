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

/**
 * One line of the order held in React state.
 *
 * Distinct from CartLegacyItem: that shape is what gets written to localStorage
 * for the vanilla cart, while this one is what the React tree renders. `lineId`
 * exists because the same product can appear twice, so the product id alone is
 * not a stable React key.
 */
export interface OrderLine {
  lineId: string;
  /**
   * Seed products use numeric ids, but the vanilla catalogue in
   * js/modules/utils/base_dinamica.js uses string slugs ('bisteck_res'). Both
   * share the same storage key, so a line restored from a pre-migration cart
   * carries a string. Coercing it with Number() produced NaN, which
   * JSON.stringify writes as null — silently emptying the id of every item in a
   * returning customer's cart.
   */
  productId: number | string;
  name: string;
  pricePerKg: number;
  quantity: number;
  image: string;
  categorySlug: string;
  /**
   * How this line is sold. Merchandising goes by the piece and the Ofertas
   * bundles by the package, so the order cannot assume kilos — otherwise a cap
   * reads as "1 kg × $250". Mirrors CartLegacyItem.tipo.
   */
  unit: 'kg' | 'unidad' | 'paquete';
  /**
   * The untouched item this line was restored from, when it came from storage.
   *
   * CartLegacyItem carries nine fields React never reads — grosor, basePeso,
   * orderMode, requestedWeightKg, requestedPieces, requestedBudget,
   * unitWeightKg, avgPieceWeightKg — and every one is load-bearing in
   * js/modules/core/cart.js: the quote engine, the price calculation and the
   * thickness slider all read them. Rebuilding the legacy shape from scratch on
   * write destroyed a configured premium cut the moment the catalogue mounted.
   * Keeping the original here lets syncLegacyCart merge instead of overwrite.
   */
  legacy?: CartLegacyItem;
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
