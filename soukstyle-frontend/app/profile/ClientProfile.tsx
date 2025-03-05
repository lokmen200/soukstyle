// app/profile/ClientProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import api from '../../lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function ClientProfile({ initialTab = 'profile', initialOrders = [] }: { initialTab?: string; initialOrders?: any[] }) {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token && activeTab === 'orders' && !initialOrders.length) {
      setLoading(true);
      api.get('/orders/me', { headers: { 'x-auth-token': token } })
        .then((response) => {
          setOrders(response.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load orders');
          setLoading(false);
        });
    }
  }, [token, activeTab, initialOrders]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!user) return <p className="text-center text-gray-500">Please log in.</p>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>
      <div className="flex flex-col sm:flex-row gap-2 border-b mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`p-3 ${activeTab === 'profile' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`p-3 ${activeTab === 'orders' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}
        >
          Orders
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile Details</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Address:</strong> {user.address.street}, {user.address.city}, {user.address.wilaya}</p>
          <p><strong>Delivery Rating:</strong> {user.deliveryRating.toFixed(1)} ({user.ratingCount} ratings)</p>
          <button onClick={handleLogout} className="btn-primary mt-4">Logout</button>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Order History</h2>
          {loading && <p className="text-gray-500 text-center">Loading...</p>}
          {error && <p className="text-error-red text-center">{error}</p>}
          {!loading && !error && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="p-4 bg-gray-50 rounded">
                  <p><strong>Order #{order._id}</strong></p>
                  <p>Date: {new Date(order.createdAt).toISOString().split('T')[0]}</p>
                  <p>Total: {order.total} DZD</p>
                  <p>Status: <span className={`font-semibold ${order.status === 'Delivered' ? 'text-primary-green' : order.status === 'Returned' ? 'text-error-red' : 'text-gray-600'}`}>{order.status}</span></p>
                  <p>Shop: <Link href={`/shop/${order.shop._id}`} className="text-primary-green hover:underline">{order.shop.name}</Link></p>
                  <p>Items:</p>
                  <ul className="ml-4 list-disc">
                    {order.products.map((item: any, index: number) => (
                      <li key={`${item.product._id}-${index}`}>
                        <Link href={`/product/${item.product._id}`} className="text-primary-green hover:underline">{item.product.name}</Link> 
                        - {item.quantity} x {item.product.price} DZD
                        {item.variant?.size && ` (Size: ${item.variant.size})`}
                        {item.variant?.color && ` (Color: ${item.variant.color})`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : !loading && !error && (
            <p className="text-gray-500 text-center">No orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}