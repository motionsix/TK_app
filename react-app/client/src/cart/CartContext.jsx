import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem('tk_token')) {
      setCount(0);
      return;
    }
    try {
      const { data } = await api.get('/cart');
      setCount(data.items.reduce((sum, it) => sum + it.qty, 0));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    if (user) refreshCart();
    else setCount(0);
  }, [user, refreshCart]);

  return (
    <CartContext.Provider value={{ count, refreshCart }}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
