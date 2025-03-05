// app/shop/[id]/page.tsx
import api from '../../../lib/api';
import ClientShopDetail from './ClientShopDetail';

async function fetchShopData(id: string) {
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return { success: false, error: 'Invalid shop ID' };
  }
  try {
    const [shopRes, productsRes] = await Promise.all([
      api.get(`/shops/${id}`),
      api.get(`/products?shop=${id}`),
    ]);
    return {
      success: true,
      shop: shopRes.data,
      products: productsRes.data,
    };
  } catch (error: any) {
    console.error('Error fetching shop data:', error);
    return {
      success: false,
      error: error.response?.status === 429
        ? 'Too many requests. Please try again later.'
        : error.response?.status === 404
        ? 'Shop not found'
        : 'Failed to load shop data',
      retryAfter: error.response?.headers['retry-after'] || 0,
    };
  }
}

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await fetchShopData(resolvedParams.id);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <ClientShopDetail initialResult={result} shopId={resolvedParams.id} />
    </div>
  );
}