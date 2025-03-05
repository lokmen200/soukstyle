// app/product/[id]/ClientProductDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/authContext';
import api from '../../../lib/api';
import { FaShoppingCart, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function ClientProductDetail({ initialResult, productId }: { initialResult: { success: boolean; product?: any; error?: string; retryAfter?: number }; productId: string }) {
  const [product, setProduct] = useState(initialResult.success ? initialResult.product : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialResult.success ? '' : initialResult.error);
  const { token, user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState({ size: '', color: '' });
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false); // Ensure client-side rendering for dates

  useEffect(() => {
    setIsClient(true); // Mark as client-side after mount
    if (token && user) {
      api.get('/orders/me', { headers: { 'x-auth-token': token } })
        .then((response) => {
          setUserOrders(response.data.filter((order: any) => 
            order.status === 'Delivered' && 
            order.products.some((p: any) => p.product._id === productId)
          ));
        })
        .catch((err) => console.error('Error fetching orders:', err));
    }
  }, [token, user, productId]);

  const handleAddToCart = () => {
    if (!token) {
      setError('Please log in to add items to cart');
      toast.error('Please log in to add items to cart');
      return;
    }
    if (!selectedVariant.size || !selectedVariant.color) {
      setError('Please select size and color');
      toast.error('Please select size and color');
      return;
    }
    setLoading(true);
    setError('');
    api.post('/cart', { productId, quantity: 1, variant: selectedVariant }, { headers: { 'x-auth-token': token } })
      .then(() => {
        setError('');
        toast.success('Added to cart');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to add to cart');
        toast.error(err.response?.data?.message || 'Failed to add to cart');
      })
      .finally(() => setLoading(false));
  };

  const handleSubmitReview = (orderId: string) => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }
    setLoading(true);
    api.post(`/products/${productId}/review`, { rating, review, orderId }, { headers: { 'x-auth-token': token } })
      .then((response) => {
        setProduct(response.data);
        setRating(0);
        setReview('');
        toast.success('Review submitted successfully');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to submit review'))
      .finally(() => setLoading(false));
  };

  if (error) return <p className="text-error-red text-center">{error}</p>;
  if (!product) return <p className="text-gray-500 text-center">Product not found.</p>;

  const availableSizes = [...new Set(product.variants.map((v: any) => v.size))];
  const availableColors = [...new Set(product.variants.map((v: any) => v.color))];
  const canReview = userOrders.length > 0 && !product.ratings.some((r: any) => r.user._id === user?._id);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/2">
        <img src={product.image || 'http://localhost:5000/images/default-product.jpg'} alt={product.name} className="w-full h-96 object-cover rounded-lg" />
      </div>
      <div className="md:w-1/2">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
        <p className="text-xl text-gray-600 mb-2">{product.price} DZD</p>
        <p className="text-gray-700 mb-2">{product.description || 'No description available.'}</p>
        <p className="text-gray-600 mb-2">Shop: <Link href={`/shop/${product.shop._id || product.shop}`} className="text-primary-green hover:underline">{product.shop.name || 'Unknown Shop'}</Link></p>
        <p className="text-gray-600 mb-4">Rating: {product.avgRating.toFixed(1)} ({product.ratingCount} reviews)</p>

        <div className="mb-4">
          <label className="block text-gray-800 font-semibold mb-2">Size:</label>
          <select value={selectedVariant.size} onChange={(e) => setSelectedVariant({ ...selectedVariant, size: e.target.value })} className="w-full p-2 border rounded-lg">
            <option value="">Select Size</option>
            {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-800 font-semibold mb-2">Color:</label>
          <select value={selectedVariant.color} onChange={(e) => setSelectedVariant({ ...selectedVariant, color: e.target.value })} className="w-full p-2 border rounded-lg">
            <option value="">Select Color</option>
            {availableColors.map((color) => <option key={color} value={color}>{color}</option>)}
          </select>
        </div>
        <button onClick={handleAddToCart} className="btn-primary flex items-center justify-center w-full" disabled={loading}>
          <FaShoppingCart className="mr-2" />
          {loading ? 'Adding...' : 'Add to Cart'}
        </button>
        {error && <p className="text-error-red text-center mt-2">{error}</p>}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reviews</h2>
          {product.ratings.length > 0 ? (
            product.ratings.map((r: any) => (
              <div key={r._id} className="mb-4 p-4 bg-gray-50 rounded">
                <p className="text-gray-800 font-semibold">{r.user.name} - {r.rating} <FaStar className="inline text-yellow-400" /></p>
                <p className="text-gray-600">{r.review || 'No comment'}</p>
                {isClient && <p className="text-gray-500 text-sm">{new Date(r.createdAt).toISOString().split('T')[0]}</p>}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </div>

        {token && canReview && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Leave a Review</h3>
            <div className="flex items-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write your review..."
              className="w-full p-3 border rounded-lg mb-2"
            />
            <select
              onChange={(e) => handleSubmitReview(e.target.value)}
              className="w-full p-2 border rounded-lg mb-2"
            >
              <option value="">Select Order</option>
              {userOrders.map((order) => (
                <option key={order._id} value={order._id}>Order #{order._id}</option>
              ))}
            </select>
            <button
              onClick={() => handleSubmitReview(userOrders[0]?._id || '')}
              className="btn-primary w-full"
              disabled={loading || !userOrders.length}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}