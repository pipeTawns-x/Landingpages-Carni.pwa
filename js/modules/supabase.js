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
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} category
 * @property {string} image_url
 * @property {number} stock
 * @property {number} rating
 * @property {number} rating_count
 * @property {boolean} active
 * @property {boolean} is_new
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} phone
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} zip_code
 * @property {string} avatar_url
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} user_id
 * @property {number} total_amount
 * @property {string} status
 * @property {string} payment_method
 * @property {string} shipping_address
 * @property {Array} items
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
    minRating = 0,
    inStock = true,
    limit = 50,
    offset = 0,
    sortBy = 'name',
    sortOrder = 'asc'
  } = options;
  
  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .range(offset, offset + limit - 1);
  
  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }
  
  if (minPrice > 0) {
    query = query.gte('price', minPrice);
  }
  
  if (maxPrice < Infinity) {
    query = query.lte('price', maxPrice);
  }
  
  if (minRating > 0) {
    query = query.gte('rating', minRating);
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
    .select('*')
    .eq('id', productId)
    .eq('active', true)
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
 * Create new order
 * @param {Object} orderData 
 * @returns {Promise<Order>}
 */
export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  
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