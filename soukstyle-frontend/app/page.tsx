// app/page.tsx
import api from '../lib/api';
import { ShopCard } from '../components/ShopCard';
import Link from 'next/link';
import Search from '../components/Search';

// Server-side data fetching
async function fetchInitialData() {
  try {
    const [productsRes, shopsRes] = await Promise.all([
      api.get('/products?limit=10'),
      api.get('/shops?limit=5'),
    ]);
    return {
      trendingProducts: productsRes.data,
      shops: shopsRes.data,
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return { trendingProducts: [], shops: [] };
  }
}

export default async function Home() {
  const { trendingProducts, shops } = await fetchInitialData();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <Search initialTrendingProducts={trendingProducts} initialShops={shops} />
    </div>
  );
}