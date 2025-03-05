// app/shops/ClientShopFilters.tsx
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '../../lib/authContext';
import { ShopCard } from '../../components/ShopCard';
import api from '../../lib/api';

export default function ClientShopFilters({ initialResult }: { initialResult: { success: boolean; data?: any[]; error?: string; retryAfter?: number } }) {
  const [wilaya, setWilaya] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState(initialResult.success ? '' : initialResult.error);
  const [retryAfter, setRetryAfter] = useState(initialResult.retryAfter || 0);
  const { token, user } = useAuth();

  const fetcher = (url: string) => api.get(url).then((res) => res.data);

  const { data: shops, error: swrError, mutate } = useSWR(
    `/shops?wilaya=${wilaya}&city=${city}`,
    fetcher,
    {
      fallbackData: initialResult.success ? initialResult.data : [],
      revalidateOnFocus: false,
    }
  );

  const handleFollow = async (shopId: string, isFollowing: boolean) => {
    if (!token) return;
    try {
      const endpoint = isFollowing ? `/shops/${shopId}/unfollow` : `/shops/${shopId}/follow`;
      await api.post(endpoint, {}, { headers: { 'x-auth-token': token } });
      // Optimistically update the local cache
      mutate(
        (currentShops: any[]) =>
          currentShops.map((shop) =>
            shop._id === shopId
              ? {
                  ...shop,
                  followers: isFollowing
                    ? shop.followers.filter((f: string) => f !== user?._id)
                    : [...(shop.followers || []), user?._id],
                }
              : shop
          ),
        false // Don’t revalidate immediately; assume success
      );
    } catch (error: any) {
      console.error('Error following/unfollowing shop:', error);
      if (error.response?.status === 429) {
        setError('Too many requests. Please try again later.');
        setRetryAfter(error.response.headers['retry-after'] || 60);
      }
      // Revalidate on error to sync with server
      mutate();
    }
  };

  if (!initialResult.success && retryAfter > 0) {
    setTimeout(() => {
      window.location.reload();
    }, retryAfter * 1000);
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Filters Sidebar */}
      <div className="md:w-1/4 bg-gray-50 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Shops</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="wilaya" className="block text-gray-700 mb-1">Wilaya</label>
            <select
              id="wilaya"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
            >
              <option value="">All Wilayas</option>
              <option value="Algiers">Algiers</option>
              <option value="Oran">Oran</option>
            </select>
          </div>
          <div>
            <label htmlFor="city" className="block text-gray-700 mb-1">City</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>
        </div>
      </div>

      {/* Shop Grid */}
      <div className="md:w-3/4">
        {error || swrError ? (
          <p className="text-error-red text-center">
            {error || swrError?.message} {retryAfter > 0 && `(Retrying in ${retryAfter} seconds)`}
          </p>
        ) : shops && shops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop: any) => (
              <ShopCard key={shop._id} shop={shop} onFollow={handleFollow} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No shops found.</p>
        )}
      </div>
    </div>
  );
}