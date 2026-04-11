// Supabase client configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase configuration missing. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY inside the container environment.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'carniceria-web-app'
    }
  }
});

// Database schema types (for better development experience)
/**
 * @typedef {Object} Product
 * @property {number} id
 * @property {number} category_id
 * @property {string} name
 * @property {string} description
 * @property {number} price_per_kg
 * @property {number} price_per_lb
 * @property {string} image_url
 * @property {number} stock
 * @property {boolean} is_active
 * @property {Object} metadata
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} full_name
 * @property {string} phone
 * @property {Object} address
 * @property {string} role
 * @property {number} points
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} user_id
 * @property {number} total
 * @property {string} status
 * @property {string} delivery_type
 * @property {Object} delivery_address
 * @property {string} notes
 * @property {string} created_at
 * @property {string} updated_at
 */

// Helper functions for common operations

/**
 * Get products with optional filtering and pagination
 * @param {Object} options - Filtering and pagination options
 * @returns {Promise<Array<Product>>}
 */
export async function getProducts(options = {}) {
  const {
    category = null,
    minPrice = 0,
    maxPrice = Infinity,
    inStock = true,
    limit = 50,
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;
  
  let query = supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('is_active', true)
    .range(offset, offset + limit - 1);
  
  // Apply filters
  if (category) {
    query = query.eq('category_id', category);
  }
  
  if (minPrice > 0) {
    query = query.gte('price_per_kg', minPrice);
  }
  
  if (maxPrice < Infinity) {
    query = query.lte('price_per_kg', maxPrice);
  }
  
  if (inStock) {
    query = query.gt('stock', 0);
  }
  
  // Apply sorting
  if (sortOrder === 'asc') {
    query = query.order(sortBy);
  } else {
    query = query.order(sortBy, { ascending: false });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get product by ID
 * @param {string} productId 
 * @returns {Promise<Product>}
 */
export async function getProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('id', productId)
    .eq('is_active', true)
    .single();
  
  if (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get user profile
 * @param {string} userId 
 * @returns {Promise<UserProfile>}
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
  
  return data;
}

/**
 * Update user profile
 * @param {string} userId 
 * @param {Object} updates 
 * @returns {Promise<UserProfile>}
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
  
  return data;
}

/**
 * Create new order using the RPC function (transactional)
 * @param {Object} orderData
 * @param {string} orderData.delivery_type - 'pickup' or 'delivery'
 * @param {Object} [orderData.delivery_address] - Address object for delivery orders
 * @param {string} [orderData.notes] - Optional order notes
 * @param {Array<{product_id: number, quantity_kg: number}>} orderData.items - Cart items
 * @returns {Promise<string>} Order UUID
 */
export async function createOrder(orderData) {
  const { data, error } = await supabase.rpc('create_order_with_items', {
    p_delivery_type: orderData.delivery_type || 'pickup',
    p_address: orderData.delivery_address || null,
    p_notes: orderData.notes || null,
    p_items: orderData.items
  });
  
  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get user orders
 * @param {string} userId 
 * @param {number} limit 
 * @param {number} offset 
 * @returns {Promise<Array<Order>>}
 */
export async function getUserOrders(userId, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
  
  return data;
}

/**
 * Upload file to storage
 * @param {string} bucket 
 * @param {string} path 
 * @param {File} file 
 * @returns {Promise<string>} Public URL
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file);
  
  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(path);
  
  return publicUrl;
}

/**
 * Subscribe to real-time changes
 * @param {string} table 
 * @param {string} event 
 * @param {Function} callback 
 * @param {string} filter 
 * @returns {Function} Unsubscribe function
 */
export function subscribeToChanges(table, event, callback, filter = '') {
  const subscription = supabase
    .channel('table-changes')
    .on('postgres_changes', {
      event: event,
      schema: 'public',
      table: table,
      filter: filter
    }, callback)
    .subscribe();
  
  return () => subscription.unsubscribe();
}

// Error handling wrapper
export function withErrorHandling(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Supabase operation failed:', error);
      throw error;
    }
  };
}

// Export supabase client as default
export default supabase;