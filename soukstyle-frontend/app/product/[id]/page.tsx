// app/product/[id]/page.tsx
import api from '../../../lib/api';
import ClientProductDetail from './ClientProductDetail';

// Server-side data fetching
async function fetchProductData(id: string) {
  try {
    const productRes = await api.get(`/products/${id}`);
    return {
      success: true,
      product: productRes.data,
    };
  } catch (error: any) {
    console.error('Error fetching product data:', error);
    return {
      success: false,
      error: error.response?.status === 404 ? 'Product not found' : 'Failed to load product',
      retryAfter: error.response?.headers['retry-after'] || 0,
    };
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await fetchProductData(resolvedParams.id);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <ClientProductDetail initialResult={result} productId={resolvedParams.id} />
    </div>
  );
}