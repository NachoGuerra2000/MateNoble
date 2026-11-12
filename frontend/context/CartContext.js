'use client';
import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { productsAPI } from '@/lib/api';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i._id === action.product._id);
      if (existing) {
        return state.map((i) =>
          i._id === action.product._id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i
        );
      }
      return [...state, { ...action.product, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i._id !== action.id);
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) return state.filter((i) => i._id !== action.id);
      return state.map((i) =>
        i._id === action.id
          ? { ...i, quantity: Math.min(action.quantity, i.stock) }
          : i
      );
    case 'SYNC': {
      // Actualiza precio y stock con los datos actuales; saca lo que ya no está disponible
      return state
        .map((i) => {
          const fresh = action.products[i._id];
          if (!fresh || !fresh.active || fresh.stock <= 0) return null;
          return { ...i, ...fresh, quantity: Math.min(i.quantity, fresh.stock) };
        })
        .filter(Boolean);
    }
    case 'CLEAR':
      return [];
    case 'LOAD':
      return action.items;
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [cartItems, dispatch] = useReducer(cartReducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Trae precio y stock actuales de cada producto del carrito (el carrito guardado puede tener precios viejos)
  const syncCart = useCallback(async (items) => {
    if (!items?.length) return { changed: false };
    const products = {};
    await Promise.all(
      items.map(async (i) => {
        try {
          products[i._id] = await productsAPI.getById(i._id);
        } catch (err) {
          if (err.status !== 404) products[i._id] = { ...i, active: true }; // sin conexión: dejarlo como está
        }
      })
    );
    const changed = items.some((i) => {
      const fresh = products[i._id];
      return !fresh || !fresh.active || fresh.price !== i.price || fresh.stock < i.quantity;
    });
    dispatch({ type: 'SYNC', products });
    return { changed };
  }, []);

  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem('mate-cart') || '[]');
      if (saved.length) dispatch({ type: 'LOAD', items: saved });
    } catch {}
    setHydrated(true);
    syncCart(saved);
  }, [syncCart]);

  useEffect(() => {
    if (hydrated) localStorage.setItem('mate-cart', JSON.stringify(cartItems));
  }, [cartItems, hydrated]);

  const addToCart = (product) => dispatch({ type: 'ADD_ITEM', product });
  const removeFromCart = (id) => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncCart,
        total,
        itemCount,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
