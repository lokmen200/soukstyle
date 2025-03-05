// app/shops/page.tsx
import api from '../../lib/api';
import ClientShopFilters from './ClientShopFilters';

async function fetchShops() {
  try {
    const [shopsRes, productsRes] = await Promise.all([
      api.get('/shops'),
      api.get('/products'),
    ]);
    const shops = shopsRes.data; // Remove filter for testing
    const productsByShop = shops.map((shop: any) => {
      const featuredProduct = productsRes.data.find((p: any) => p.shop === shop._id);
      return { ...shop, featuredProduct };
    });
    return {
      success: true,
      data: productsByShop,
    };
  } catch (error: any) {
    console.error('Error fetching shops:', error);
    return { success: false, error: 'Failed to load shops', retryAfter: error.response?.headers['retry-after'] || 0 };
  }
}

export default async function ShopsPage() {
  const result = await fetchShops();

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Shops</h1>
      <ClientShopFilters initialResult={result} />
    </div>
  );
}