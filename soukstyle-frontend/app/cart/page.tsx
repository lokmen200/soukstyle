// app/cart/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import api from '../../lib/api';
import { FaShoppingCart, FaTrash } from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function CartPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/profile');
      return;
    }

    const fetchCart = () => {
      api.get('/cart', { headers: { 'x-auth-token': token } })
        .then((response) => {
          setCart(response.data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load cart');
          toast.error(err.response?.data?.message || 'Failed to load cart');
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchCart();
  }, [token, router]);

  const handleRemove = (productId: string) => {
    setLoading(true);
    setError('');
    api.delete(`/cart/${productId}`, { headers: { 'x-auth-token': token } })
      .then((response) => {
        setCart(response.data);
        toast.success('Item removed from cart');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to remove item');
        toast.error(err.response?.data?.message || 'Failed to remove item');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUpdateQuantity = (productId: string, quantity: number, variant: any) => {
    if (quantity < 1) return handleRemove(productId);
    setLoading(true);
    setError('');
    api.post('/cart', { productId, quantity, variant }, { headers: { 'x-auth-token': token } })
      .then((response) => {
        setCart(response.data);
        toast.success('Quantity updated');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to update quantity');
        toast.error(err.response?.data?.message || 'Failed to update quantity');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error) return <p className="text-center text-error-red">{error}</p>;

  const total = cart.items.reduce((sum: number, item: any) => sum + item.quantity * item.product.price, 0);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
      {cart.items.length > 0 ? (
        <div className="card">
          <ul className="space-y-4">
            {cart.items.map((item: any) => (
              <li key={`${item.product._id}-${item.variant?.size || ''}-${item.variant?.color || ''}`} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-800">{item.product.name}</p>
                  <p className="text-gray-600">
                    {item.product.price} DZD x {item.quantity} 
                    {item.variant?.size && ` (Size: ${item.variant.size})`}
                    {item.variant?.color && ` (Color: ${item.variant.color})`}
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.product._id, parseInt(e.target.value), item.variant)}
                    className="w-16 p-2 border rounded-lg"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleRemove(item.product._id)}
                    className="text-error-red hover:text-red-700"
                    disabled={loading}
                  >
                    <FaTrash />
                  </button>
                  <span className="text-gray-800 font-semibold">{item.quantity * item.product.price} DZD</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xl font-semibold text-gray-800">Total: {total} DZD</p>
          <Link href="/checkout" className="btn-primary mt-4 inline-block text-center w-full">
            <FaShoppingCart className="inline mr-2" /> Proceed to Checkout
          </Link>
        </div>
      ) : (
        <p className="text-gray-500 text-center">Your cart is empty.</p>
      )}
    </div>
  );
}