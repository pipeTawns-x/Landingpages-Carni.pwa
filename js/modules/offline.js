// Offline functionality and sync management
import { supabase } from './supabase.js';
import { appState, showNotification } from './app.js';
import { isAuthenticated } from './auth.js';

// Offline manager class
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.syncInterval = null;
    this.init();
  }

  // Initialize offline manager
  init() {
    this.loadPendingOperations();
    this.setupEventListeners();
    this.startSyncInterval();
  }

  // Setup event listeners for online/offline status
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Listen for custom operations that need syncing
    document.addEventListener('offline:operation', (e) => {
      this.addPendingOperation(e.detail);
    });
  }

  // Handle online status
  handleOnline() {
    this.isOnline = true;
    showNotification('Conexión restaurada', 'success');
    this.syncPendingOperations();
  }

  // Handle offline status
  handleOffline() {
    this.isOnline = false;
    showNotification('Modo offline activado', 'warning');
  }

  // Add operation to pending queue
  addPendingOperation(operation) {
    this.pendingOperations.push({
      ...operation,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      attempts: 0
    });
    
    this.savePendingOperations();
  }

  // Sync pending operations when online
  async syncPendingOperations() {
    if (!this.isOnline || !isAuthenticated()) return;

    const successfulOps = [];
    
    for (const operation of this.pendingOperations) {
      try {
        await this.executeOperation(operation);
        successfulOps.push(operation.id);
        operation.attempts++;
      } catch (error) {
        console.error('Sync operation failed:', error);
        if (operation.attempts >= 3) {
          // Too many attempts, remove operation
          successfulOps.push(operation.id);
          showNotification(`Operación fallida después de 3 intentos: ${operation.type}`, 'error');
        }
      }
    }

    // Remove successful operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !successfulOps.includes(op.id)
    );
    
    this.savePendingOperations();
  }

  // Execute a single operation
  async executeOperation(operation) {
    switch (operation.type) {
      case 'addToCart':
        return this.syncAddToCart(operation.data);
      case 'updateProfile':
        return this.syncUpdateProfile(operation.data);
      case 'createOrder':
        return this.syncCreateOrder(operation.data);
      case 'favoriteProduct':
        return this.syncFavoriteProduct(operation.data);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Sync add to cart operation
  async syncAddToCart(data) {
    const { error } = await supabase
      .from('cart_items')
      .upsert(data, { onConflict: 'user_id,product_id' });
    
    if (error) throw error;
  }

  // Sync update profile operation
  async syncUpdateProfile(data) {
    const { error } = await supabase
      .from('profiles')
      .update(data.updates)
      .eq('id', data.userId);
    
    if (error) throw error;
  }

  // Sync create order operation
  async syncCreateOrder(data) {
    const { error } = await supabase
      .from('orders')
      .insert(data.order);
    
    if (error) throw error;
  }

  // Sync favorite product operation
  async syncFavoriteProduct(data) {
    if (data.favorited) {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: data.userId,
          product_id: data.productId
        });
      
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', data.userId)
        .eq('product_id', data.productId);
      
      if (error) throw error;
    }
  }

  // Save pending operations to localStorage
  savePendingOperations() {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  // Load pending operations from localStorage
  loadPendingOperations() {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }

  // Start sync interval
  startSyncInterval() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000); // Sync every 30 seconds
  }

  // Stop sync interval
  stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get offline status
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.pendingOperations.length,
      canSync: this.isOnline && isAuthenticated()
    };
  }

  // Clear all pending operations
  clearPendingOperations() {
    this.pendingOperations = [];
    this.savePendingOperations();
  }
}

// Global offline manager instance
let offlineManager = null;

// Initialize offline manager
export function initializeOfflineManager() {
  if (!offlineManager) {
    offlineManager = new OfflineManager();
  }
  return offlineManager;
}

// Get offline manager instance
export function getOfflineManager() {
  return offlineManager;
}

// Offline utility functions

// Check if browser supports required offline features
export function supportsOffline() {
  return 'serviceWorker' in navigator && 'indexedDB' in window && 'caches' in window;
}

// Get estimated storage usage
export async function getStorageUsage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting storage estimate:', error);
      return null;
    }
  }
  return null;
}

// Clear cached data
export async function clearCache() {
  try {
    // Clear service worker cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear pending operations
    if (offlineManager) {
      offlineManager.clearPendingOperations();
    }
    
    showNotification('Caché limpiado correctamente', 'success');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    showNotification('Error al limpiar el caché', 'error');
    return false;
  }
}

// Offline UI management
export function updateOfflineUI(isOnline) {
  const offlineElements = document.querySelectorAll('[data-offline]');
  
  offlineElements.forEach(element => {
    const offlineState = element.getAttribute('data-offline');
    
    if (offlineState === 'hide-when-offline') {
      element.style.display = isOnline ? '' : 'none';
    } else if (offlineState === 'show-when-offline') {
      element.style.display = isOnline ? 'none' : '';
    }
  });
  
  // Update online status indicator
  const statusIndicator = document.getElementById('online-status');
  if (statusIndicator) {
    statusIndicator.className = `online-status ${isOnline ? 'online' : 'offline'}`;
    statusIndicator.innerHTML = isOnline ? 
      '<i class="bi bi-wifi"></i> En línea' : 
      '<i class="bi bi-wifi-off"></i> Offline';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize offline manager
  initializeOfflineManager();
  
  // Update UI based on initial online status
  updateOfflineUI(navigator.onLine);
  
  // Add online/offline event listeners for UI updates
  window.addEventListener('online', () => {
    updateOfflineUI(true);
  });
  
  window.addEventListener('offline', () => {
    updateOfflineUI(false);
  });
  
  // Register sync event for background sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('background-sync')
        .then(() => console.log('Background sync registered'))
        .catch(err => console.error('Background sync registration failed:', err));
    });
  }
});

// Export offline utilities
export default {
  initializeOfflineManager,
  getOfflineManager,
  supportsOffline,
  getStorageUsage,
  clearCache,
  updateOfflineUI
};