// app/admin/ClientAdminDashboard.tsx
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '../../lib/authContext';
import api from '../../lib/api';
import { FaStore, FaUsers, FaTags, FaChartLine } from 'react-icons/fa';

export default function ClientAdminDashboard({ initialResult }: { initialResult: { success: boolean; shops?: any[]; users?: any[]; categories?: any[]; analytics?: any; error?: string; retryAfter?: number } }) {
  const [activeTab, setActiveTab] = useState('shops');
  const [error, setError] = useState(initialResult.success ? '' : initialResult.error);
  const [retryAfter, setRetryAfter] = useState(initialResult.retryAfter || 0);
  const { token, user } = useAuth();

  // Check if user is admin
  const adminIds = process.env.NEXT_PUBLIC_ADMIN_IDS?.split(',') || [];
  const isAdmin = token && user && adminIds.includes(user._id); // Use _id as per backend response

  // Debug logs
  console.log('Token:', token);
  console.log('User:', user);
  console.log('Admin IDs:', adminIds);
  console.log('Is Admin:', isAdmin);

  if (!isAdmin) {
    return <p className="text-error-red text-center">Access denied. Admin privileges required.</p>;
  }

  if (!initialResult.success && retryAfter > 0) {
    setTimeout(() => {
      window.location.reload();
    }, retryAfter * 1000);
  }

  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="md:w-1/4 bg-primary-green text-white p-4 rounded-lg shadow-md">
        <nav className="flex flex-col space-y-2">
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex items-center p-3 rounded ${activeTab === 'shops' ? 'bg-white text-primary-green' : 'hover:bg-green-700'} transition`}
          >
            <FaStore className="mr-2" /> Shops
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center p-3 rounded ${activeTab === 'users' ? 'bg-white text-primary-green' : 'hover:bg-green-700'} transition`}
          >
            <FaUsers className="mr-2" /> Users
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center p-3 rounded ${activeTab === 'categories' ? 'bg-white text-primary-green' : 'hover:bg-green-700'} transition`}
          >
            <FaTags className="mr-2" /> Categories
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center p-3 rounded ${activeTab === 'analytics' ? 'bg-white text-primary-green' : 'hover:bg-green-700'} transition`}
          >
            <FaChartLine className="mr-2" /> Analytics
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="md:w-3/4">
        {error ? (
          <p className="text-error-red text-center">{error} {retryAfter > 0 && `(Retrying in ${retryAfter} seconds)`}</p>
        ) : (
          <div className="card">
            {activeTab === 'shops' && <ShopsTab initialShops={initialResult.shops || []} />}
            {activeTab === 'users' && <UsersTab initialUsers={initialResult.users || []} />}
            {activeTab === 'categories' && <CategoriesTab initialCategories={initialResult.categories || []} />}
            {activeTab === 'analytics' && <AnalyticsTab initialAnalytics={initialResult.analytics} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopsTab({ initialShops }: { initialShops: any[] }) {
  const [shops, setShops] = useState(initialShops);
  const { token } = useAuth();
  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data, error } = useSWR('/admin/shops', fetcher, { fallbackData: initialShops });

  const handleApprove = async (shopId: string) => {
    try {
      await api.put(`/admin/shops/${shopId}/approve`, {}, { headers: { 'x-auth-token': token } });
      setShops((prev) => prev.map((shop) => shop._id === shopId ? { ...shop, status: 'approved' } : shop));
    } catch (err) {
      console.error('Error approving shop:', err);
    }
  };

  const handleDelete = async (shopId: string) => {
    try {
      await api.delete(`/admin/shops/${shopId}`, { headers: { 'x-auth-token': token } });
      setShops((prev) => prev.filter((shop) => shop._id !== shopId));
    } catch (err) {
      console.error('Error deleting shop:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Shops</h2>
      {shops.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Owner</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop._id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{shop.name}</td>
                  <td className="p-3">{shop.owner.name || shop.owner}</td>
                  <td className="p-3 capitalize">{shop.status}</td>
                  <td className="p-3">
                    {shop.status !== 'approved' && (
                      <button onClick={() => handleApprove(shop._id)} className="btn-primary mr-2">Approve</button>
                    )}
                    <button onClick={() => handleDelete(shop._id)} className="btn-accent">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center">No shops found.</p>
      )}
    </div>
  );
}

function UsersTab({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const { token } = useAuth();
  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data, error } = useSWR('/admin/users', fetcher, { fallbackData: initialUsers });

  const handleDelete = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`, { headers: { 'x-auth-token': token } });
      setUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Users</h2>
      {users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(user._id)} className="btn-accent">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center">No users found.</p>
      )}
    </div>
  );
}

function CategoriesTab({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const { token } = useAuth();
  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data, error } = useSWR('/categories', fetcher, { fallbackData: initialCategories });

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/categories', newCategory, { headers: { 'x-auth-token': token } });
      setCategories((prev) => [...prev, response.data]);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Categories</h2>
      {categories.length > 0 ? (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category._id} className="p-2 bg-gray-50 rounded">
              {category.name} - {category.description}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center">No categories found.</p>
      )}
      <form onSubmit={handleAddCategory} className="mt-6 space-y-4">
        <input
          type="text"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
          placeholder="Category Name"
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="text"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          placeholder="Description"
          className="w-full p-3 border rounded-lg"
        />
        <button type="submit" className="btn-primary w-full">Add Category</button>
      </form>
    </div>
  );
}

function AnalyticsTab({ initialAnalytics }: { initialAnalytics?: any }) {
  const { token } = useAuth();
  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data: analytics, error } = useSWR('/admin/analytics', fetcher, { fallbackData: initialAnalytics });

  if (error) return <p className="text-error-red text-center">Failed to load analytics</p>;
  if (!analytics) return <p className="text-gray-500 text-center">Loading analytics...</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Platform Analytics</h2>
      <p>Total Sales: {analytics.totalSales} DZD</p>
      <h3 className="text-xl font-semibold mt-4">Top Shops</h3>
      {analytics.topShops && analytics.topShops.length > 0 ? (
        <ul className="space-y-2">
          {analytics.topShops.map((shop: any) => (
            <li key={shop.name} className="p-2 bg-gray-50 rounded">
              {shop.name} - {shop.totalSales} DZD
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center">No top shops data.</p>
      )}
    </div>
  );
}