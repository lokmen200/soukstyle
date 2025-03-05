// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import api from '../../lib/api';
import { FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function CheckoutPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<any>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      router.push('/profile');
      return;
    }

    const fetchCart = () => {
      api.get('/cart', { headers: { 'x-auth-token': token } })
        .then((response) => {
          console.log('Cart Data:', response.data);
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

  const handleCheckout = useCallback(() => {
    if (!cart.items.length) return;
    setLoading(true);
    setError('');
    const shopId = cart.items[0].product.shop?._id || cart.items[0].product.shop;
    const productsPayload = cart.items.map((item: any) => ({
      product: item.product._id,
      quantity: item.quantity,
      variant: item.variant,
    }));
    console.log('Checkout Payload:', { shopId, products: productsPayload });

    api.post('/orders', { shopId, products: productsPayload }, { headers: { 'x-auth-token': token } })
      .then((response) => {
        console.log('Checkout Response:', response.data);
        setCart({ items: [] });
        setOrder(response.data);
        toast.success('Order placed successfully');
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Checkout failed';
        console.error('Checkout Error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [cart, token]);

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error) return <p className="text-center text-error-red">{error}</p>;

  if (order) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Confirmation</h1>
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Thank You for Your Order!</h2>
          <p><strong>Order #{order._id}</strong></p>
          <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          <p>Total: {order.total} DZD</p>
          <p>Status: <span className="text-primary-green">{order.status}</span></p>
          <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Items:</h3>
          <ul className="space-y-2">
            {order.products.map((item: any, index: number) => (
              <li key={`${item.product._id}-${index}`} className="flex justify-between p-2 bg-gray-50 rounded">
                <span>
                  {item.product.name} - {item.quantity} x {item.product.price} DZD
                  {item.variant?.size && ` (Size: ${item.variant.size})`}
                  {item.variant?.color && ` (Color: ${item.variant.color})`}
                </span>
                <span>{item.quantity * item.product.price} DZD</span>
              </li>
            ))}
          </ul>
          <Link href="/profile?tab=orders" className="btn-primary mt-6 inline-block text-center w-full">
            View My Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!cart.items.length) return <p className="text-center text-gray-500">Your cart is empty.</p>;

  const total = cart.items.reduce((sum: number, item: any) => sum + item.quantity * item.product.price, 0);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Checkout</h1>
      <div className="card">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cart Items</h2>
        <ul className="space-y-4">
          {cart.items.map((item: any) => (
            <li key={`${item.product._id}-${item.variant?.size || ''}-${item.variant?.color || ''}`} className="flex justify-between p-2 bg-gray-50 rounded">
              <span>
                {item.product.name} - {item.quantity} x {item.product.price} DZD
                {item.variant?.size && ` (Size: ${item.variant.size})`}
                {item.variant?.color && ` (Color: ${item.variant.color})`}
              </span>
              <span>{item.quantity * item.product.price} DZD</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xl font-semibold text-gray-800">Total: {total} DZD</p>
        <button
          onClick={handleCheckout}
          className="btn-primary mt-6 flex items-center justify-center w-full"
          disabled={loading}
        >
          <FaShoppingCart className="mr-2" />
          {loading ? 'Processing...' : 'Confirm Checkout'}
        </button>
      </div>
    </div>
  );
}