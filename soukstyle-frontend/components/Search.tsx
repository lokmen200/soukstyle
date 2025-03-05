// components/Search.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { ShopCard } from './ShopCard';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function Search({ initialTrendingProducts, initialShops }: { initialTrendingProducts: any[]; initialShops: any[] }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ products: any[]; shops: any[] }>({ products: [], shops: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Track if search was performed
  const router = useRouter();

  const handleSearch = () => {
    if (!search.trim()) return;
    setLoading(true);
    setHasSearched(true); // Mark that a search occurred
    Promise.all([
      api.get(`/products?search=${encodeURIComponent(search)}`),
      api.get(`/shops?search=${encodeURIComponent(search)}`),
    ])
      .then(([productsRes, shopsRes]) => {
        setResults({ products: productsRes.data, shops: shopsRes.data });
        if (productsRes.data.length === 0 && shopsRes.data.length === 0) {
          toast.info('No results found');
        } else {
          toast.success('Search completed');
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Search failed');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to SoukStyle</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search products or shops..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green"
          />
          <button
            onClick={handleSearch}
            className="btn-primary px-4 py-2"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results or No Results */}
      {hasSearched ? (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Products</h2>
            {results.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.products.map((product) => (
                  <Link key={product._id} href={`/product/${product._id}`} className="card">
                    <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                      <p className="text-gray-600">{product.price} DZD</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No products found.</p>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Shops</h2>
            {results.shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.shops.map((shop) => (
                  <ShopCard key={shop._id} shop={shop} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No shops found.</p>
            )}
          </div>
        </div>
      ) : (
        /* Trending Products and Featured Shops (Default View) */
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Trending Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialTrendingProducts.map((product) => (
                <Link key={product._id} href={`/product/${product._id}`} className="card">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                    <p className="text-gray-600">{product.price} DZD</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Featured Shops</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialShops.map((shop) => (
                <ShopCard key={shop._id} shop={shop} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}