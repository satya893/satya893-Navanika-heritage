/**
 * Pure functions for Cart Logic
 * Designed for unit testing without database dependencies.
 */

export interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

export const calculateCartTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const validateQuantity = (quantity: number): boolean => {
  return quantity > 0 && Number.isInteger(quantity);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};
