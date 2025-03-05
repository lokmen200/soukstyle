// app/shop/[id]/ClientShopDetail.tsx
'use client';

import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '../../../lib/authContext';
import api from '../../../lib/api';
import { FaBox, FaChartLine, FaUsers, FaTags, FaFacebook, FaInstagram, FaTiktok, FaShoppingBasket, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const BASE_URL = 'http://localhost:5000';

export default function ClientShopDetail({ initialResult, shopId }: { initialResult: { success: boolean; shop?: any; products?: any[]; error?: string; retryAfter?: number }; shopId: string }) {
  const [activeTab, setActiveTab] = useState('products');
  const [error, setError] = useState(initialResult.success ? '' : initialResult.error);
  const [retryAfter, setRetryAfter] = useState(initialResult.retryAfter || 0);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data: shopData, error: shopError, mutate } = useSWR(`/shops/${shopId}`, fetcher, { fallbackData: initialResult.shop });

  const isOwner = user && shopData && (typeof shopData.owner === 'string' ? shopData.owner === user._id : shopData.owner?._id === user._id);

  useEffect(() => {
    if (!initialResult.success && retryAfter > 0) {
      const timer = setTimeout(() => window.location.reload(), retryAfter * 1000);
      return () => clearTimeout(timer);
    }
  }, [initialResult, retryAfter]);

  const handleFollow = async (isFollowing: boolean) => {
    if (!token) return;
    try {
      const endpoint = isFollowing ? `/shops/${shopId}/unfollow` : `/shops/${shopId}/follow`;
      await api.post(endpoint, {}, { headers: { 'x-auth-token': token } });
      mutate((prevShop: any) => ({
        ...prevShop,
        followers: isFollowing
          ? prevShop.followers.filter((f: string) => f !== user?._id)
          : [...(prevShop.followers || []), user?._id],
      }), false);
      toast.success(isFollowing ? 'Unfollowed shop' : 'Followed shop');
    } catch (error: any) {
      console.error('Error following/unfollowing shop:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait and try again.');
        setRetryAfter(error.response.headers['retry-after'] || 60);
      }
    }
  };

  if (error || shopError) {
    return <p className="text-error-red text-center">{error || shopError?.message} {retryAfter > 0 && `(Retrying in ${retryAfter} seconds)`}</p>;
  }

  if (!shopData) {
    return <p className="text-gray-500 text-center">Shop not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="relative bg-gray-200 h-48 rounded-t-xl overflow-hidden">
        <img src={`${BASE_URL}${shopData.banner}`} alt={shopData.name} className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-4 flex items-center space-x-4">
          <img src={`${BASE_URL}${shopData.logo}`} alt={shopData.name} className="w-16 h-16 rounded-full border-2 border-white" />
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-md">{shopData.name}</h1>
            <p className="text-white drop-shadow-md">Rating: {shopData.avgRating.toFixed(1)} ({shopData.ratingCount} reviews)</p>
            <div className="flex space-x-2 text-white drop-shadow-md">
              {shopData.socialMedia?.facebook && <a href={shopData.socialMedia.facebook} className="hover:text-accent-gold"><FaFacebook size={20} /></a>}
              {shopData.socialMedia?.instagram && <a href={shopData.socialMedia.instagram} className="hover:text-accent-gold"><FaInstagram size={20} /></a>}
              {shopData.socialMedia?.tiktok && <a href={shopData.socialMedia.tiktok} className="hover:text-accent-gold"><FaTiktok size={20} /></a>}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleFollow(shopData.followers?.includes(user?._id))}
          className={`absolute bottom-4 right-4 btn-primary ${shopData.followers?.includes(user?._id) ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
          disabled={!token}
        >
          {shopData.followers?.includes(user?._id) ? 'Unfollow' : 'Follow'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 border-b">
        <button onClick={() => setActiveTab('products')} className={`flex items-center p-3 ${activeTab === 'products' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}>
          <FaBox className="mr-2" /> Products
        </button>
        {isOwner && (
          <>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center p-3 ${activeTab === 'analytics' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}>
              <FaChartLine className="mr-2" /> Analytics
            </button>
            <button onClick={() => setActiveTab('employees')} className={`flex items-center p-3 ${activeTab === 'employees' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}>
              <FaUsers className="mr-2" /> Employees
            </button>
            <button onClick={() => setActiveTab('coupons')} className={`flex items-center p-3 ${activeTab === 'coupons' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}>
              <FaTags className="mr-2" /> Coupons
            </button>
            <button onClick={() => setActiveTab('orders')} className={`flex items-center p-3 ${activeTab === 'orders' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}>
              <FaShoppingBasket className="mr-2" /> Orders
            </button>
          </>
        )}
        <button onClick={() => setActiveTab('reviews')} className={`flex items-center p-3 ${activeTab === 'reviews' ? 'bg-primary-green text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded-t-lg transition`}>
          <FaStar className="mr-2" /> Reviews
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <p className="text-gray-500 text-center">Loading...</p>
        ) : (
          <>
            {activeTab === 'products' && <ProductsTab products={initialResult.products || []} isOwner={isOwner} shopId={shopId} />}
            {isOwner && activeTab === 'analytics' && <AnalyticsTab shopId={shopId} />}
            {isOwner && activeTab === 'employees' && <EmployeesTab shopId={shopId} />}
            {isOwner && activeTab === 'coupons' && <CouponsTab shopId={shopId} />}
            {isOwner && activeTab === 'orders' && <OrdersTab shopId={shopId} />}
            {activeTab === 'reviews' && <ReviewsTab shopId={shopId} isOwner={isOwner} shopData={shopData} mutate={mutate} />}
          </>
        )}
      </div>
    </div>
  );
}

function ProductsTab({ products, isOwner, shopId }: { products: any[]; isOwner: boolean; shopId: string }) {
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '', category: '', image: '', variants: [] as { size: string; color: string; stock: number | string }[] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: { size: string; color: string } }>({});

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const productPayload = {
      ...newProduct,
      variants: newProduct.variants.map(v => ({
        ...v,
        stock: parseInt(v.stock as string) || 0,
      })),
    };
    api.post('/products', { ...productPayload, shop: shopId }, { headers: { 'x-auth-token': token } })
      .then(() => {
        toast.success('Product added successfully');
        window.location.reload();
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to add product');
        toast.error(err.response?.data?.message || 'Failed to add product');
      })
      .finally(() => setLoading(false));
  };

  const handleAddToCart = (productId: string) => {
    if (!token) {
      setError('Please log in to add items to cart');
      toast.error('Please log in to add items to cart');
      return;
    }
    const variant = selectedVariants[productId] || { size: '', color: '' };
    if (!variant.size || !variant.color) {
      setError('Please select size and color');
      toast.error('Please select size and color');
      return;
    }
    setLoading(true);
    setError('');
    api.post('/cart', { productId, quantity: 1, variant }, { headers: { 'x-auth-token': token } })
      .then(() => toast.success('Added to cart'))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to add to cart');
        toast.error(err.response?.data?.message || 'Failed to add to cart');
      })
      .finally(() => setLoading(false));
  };

  const addVariant = () => {
    setNewProduct({
      ...newProduct,
      variants: [...newProduct.variants, { size: '', color: '', stock: '' }],
    });
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const updatedVariants = [...newProduct.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setNewProduct({ ...newProduct, variants: updatedVariants });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Products</h2>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const availableSizes = [...new Set(product.variants.map((v: any) => v.size))];
            const availableColors = [...new Set(product.variants.map((v: any) => v.color))];
            const variantKey = product._id;
            return (
              <div key={product._id} className="card">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                  <p className="text-gray-600">{product.price} DZD</p>
                  {!isOwner && (
                    <>
                      <select
                        value={selectedVariants[variantKey]?.size || ''}
                        onChange={(e) => setSelectedVariants({ ...selectedVariants, [variantKey]: { ...selectedVariants[variantKey], size: e.target.value } })}
                        className="w-full p-2 border rounded-lg mt-2"
                      >
                        <option value="">Select Size</option>
                        {availableSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                      </select>
                      <select
                        value={selectedVariants[variantKey]?.color || ''}
                        onChange={(e) => setSelectedVariants({ ...selectedVariants, [variantKey]: { ...selectedVariants[variantKey], color: e.target.value } })}
                        className="w-full p-2 border rounded-lg mt-2"
                      >
                        <option value="">Select Color</option>
                        {availableColors.map((color) => <option key={color} value={color}>{color}</option>)}
                      </select>
                      <button
                        onClick={() => handleAddToCart(product._id)}
                        className="btn-primary mt-2"
                        disabled={loading}
                      >
                        {loading ? 'Adding...' : 'Add to Cart'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No products available.</p>
      )}
      {isOwner && (
        <form onSubmit={handleAddProduct} className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Add Product</h3>
          <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Name" className="w-full p-3 border rounded-lg" />
          <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Description" className="w-full p-3 border rounded-lg" />
          <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Price (DZD)" className="w-full p-3 border rounded-lg" />
          <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="Stock" className="w-full p-3 border rounded-lg" />
          <input type="text" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="Category ID" className="w-full p-3 border rounded-lg" />
          <input type="text" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} placeholder="Image URL" className="w-full p-3 border rounded-lg" />
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Variants</h4>
            {newProduct.variants.map((variant, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, 'size', e.target.value)}
                  placeholder="Size"
                  className="w-1/3 p-2 border rounded-lg"
                />
                <input
                  type="text"
                  value={variant.color}
                  onChange={(e) => updateVariant(index, 'color', e.target.value)}
                  placeholder="Color"
                  className="w-1/3 p-2 border rounded-lg"
                />
                <input
                  type="number"
                  value={variant.stock === '' ? '' : String(variant.stock)}
                  onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                  placeholder="Stock"
                  className="w-1/3 p-2 border rounded-lg"
                />
              </div>
            ))}
            <button type="button" onClick={addVariant} className="btn-accent mt-2">Add Variant</button>
          </div>
          {error && <p className="text-error-red">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </form>
      )}
    </div>
  );
}

function AnalyticsTab({ shopId }: { shopId: string }) {
  const { token } = useAuth();
  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data: analytics, error } = useSWR(`/shops/analytics`, fetcher, { revalidateOnFocus: false });

  if (error) return <p className="text-error-red text-center">Failed to load analytics</p>;
  if (!analytics) return <p className="text-gray-500 text-center">Loading analytics...</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Analytics</h2>
      <p>Total Sales: {analytics.totalSales} DZD</p>
      <p>Order Count: {analytics.orderCount}</p>
      <p>Product Count: {analytics.productCount}</p>
    </div>
  );
}

function EmployeesTab({ shopId }: { shopId: string }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data.employees || []);
  const { data: fetchedEmployees, error } = useSWR(`/shops/${shopId}`, fetcher, { revalidateOnFocus: false });

  useEffect(() => {
    if (fetchedEmployees) setEmployees(fetchedEmployees);
  }, [fetchedEmployees]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post(`/shops/${shopId}/employees`, { employeeId }, { headers: { 'x-auth-token': token } });
      toast.success('Employee added successfully');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) return <p className="text-error-red text-center">Failed to load employees</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Employees</h2>
      {employees.length > 0 ? (
        <ul className="space-y-2">
          {employees.map((emp) => (
            <li key={emp.user} className="p-2 bg-gray-50 rounded">{emp.user}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center">No employees.</p>
      )}
      <form onSubmit={handleAddEmployee} className="mt-6 space-y-4">
        <input
          type="text"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="Employee User ID"
          className="w-full p-3 border rounded-lg"
        />
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Employee'}
        </button>
      </form>
    </div>
  );
}

function CouponsTab({ shopId }: { shopId: string }) {
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', expiresAt: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data: coupons, error } = useSWR(`/coupons/shop`, fetcher, { revalidateOnFocus: false });

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/coupons', { ...newCoupon, shop: shopId }, { headers: { 'x-auth-token': token } });
      toast.success('Coupon added successfully');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add coupon');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) return <p className="text-error-red text-center">Failed to load coupons</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Coupons</h2>
      {coupons && coupons.length > 0 ? (
        <ul className="space-y-2">
          {coupons.map((coupon: any) => (
            <li key={coupon._id} className="p-2 bg-gray-50 rounded">
              {coupon.code} - {coupon.discount}% (Expires: {new Date(coupon.expiresAt).toLocaleDateString()})
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center">No coupons.</p>
      )}
      <form onSubmit={handleAddCoupon} className="mt-6 space-y-4">
        <input
          type="text"
          value={newCoupon.code}
          onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
          placeholder="Coupon Code"
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="number"
          value={newCoupon.discount}
          onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
          placeholder="Discount (%)"
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="date"
          value={newCoupon.expiresAt}
          onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
          className="w-full p-3 border rounded-lg"
        />
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Coupon'}
        </button>
      </form>
    </div>
  );
}

function OrdersTab({ shopId }: { shopId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const { mutate } = useSWRConfig();

  const fetcher = (url: string) => api.get(url, { headers: { 'x-auth-token': token } }).then((res) => res.data);
  const { data: swrData, error: swrError } = useSWR(`/orders/shop/${shopId}`, fetcher, { revalidateOnFocus: false, revalidateOnReconnect: false });

  useEffect(() => {
    if (swrData && !loading) {
      setOrders(swrData);
    }
    if (swrError && !loading) {
      setError(swrError.response?.data?.message || 'Failed to load orders');
    }
  }, [swrData, swrError, loading]);

  const handleUpdateStatus = (orderId: string, status: string) => {
    setLoading(true);
    setError('');
    api.put(`/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } })
      .then((response) => {
        setOrders((prevOrders) => prevOrders.map((order) => (order._id === orderId ? response.data : order)));
        mutate(`/orders/shop/${shopId}`, (currentData: any[]) => currentData.map((order) => (order._id === orderId ? response.data : order)), false);
        toast.success(`Order status updated to ${status}`);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to update status');
        toast.error(err.response?.data?.message || 'Failed to update status');
      })
      .finally(() => setLoading(false));
  };

  if (error) return <p className="text-error-red text-center">{error}</p>;
  if (!orders.length && !loading) return <p className="text-gray-500 text-center">No orders yet.</p>;

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Orders</h2>
      {loading && <p className="text-gray-500 text-center">Loading...</p>}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="p-4 bg-gray-50 rounded">
              <p><strong>Order #{order._id}</strong></p>
              <p>Buyer: {order.user?.name || 'Unknown'}</p>
              <p>Failed Delivery Rate: {order.buyerFailedDeliveryRate}%</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p>Total: {order.total} DZD</p>
              <p>Status: <span className={`font-semibold ${order.status === 'Delivered' ? 'text-primary-green' : order.status === 'Returned' ? 'text-error-red' : 'text-gray-600'}`}>{order.status}</span></p>
              <p>Items:</p>
              <ul className="ml-4 list-disc">
                {order.products.map((item: any, index: number) => (
                  <li key={`${item.product._id}-${index}`}>
                    {item.product.name} - {item.quantity} x {item.product.price} DZD
                    {item.variant?.size && ` (Size: ${item.variant.size})`}
                    {item.variant?.color && ` (Color: ${item.variant.color})`}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex space-x-2">
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                  className="p-2 border rounded-lg"
                  disabled={loading}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsTab({ shopId, isOwner, shopData, mutate }: { shopId: string; isOwner: boolean; shopData: any; mutate: any }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user && !isOwner) {
      api.get('/orders/me', { headers: { 'x-auth-token': token } })
        .then((response) => {
          setUserOrders(response.data.filter((order: any) => order.status === 'Delivered' && order.shop._id === shopId));
        })
        .catch((err) => console.error('Error fetching orders:', err));
    }
  }, [token, user, shopId, isOwner]);

  const handleSubmitReview = (orderId: string) => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating between 1 and 5');
      return;
    }
    setLoading(true);
    api.post(`/shops/${shopId}/review`, { rating, review, orderId }, { headers: { 'x-auth-token': token } })
      .then((response) => {
        mutate((prevData: any) => ({
          ...prevData,
          ratings: response.data.ratings,
          avgRating: response.data.avgRating,
          ratingCount: response.data.ratingCount,
        }), false);
        setRating(0);
        setReview('');
        toast.success('Review submitted successfully');
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to submit review'))
      .finally(() => setLoading(false));
  };

  const canReview = !isOwner && userOrders.length > 0 && !shopData.ratings.some((r: any) => r.user._id === user?._id);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Shop Reviews</h2>
      {shopData.ratings.length > 0 ? (
        shopData.ratings.map((r: any) => (
          <div key={r._id} className="mb-4 p-4 bg-gray-50 rounded">
            <p className="text-gray-800 font-semibold">{r.user.name} - {r.rating} <FaStar className="inline text-yellow-400" /></p>
            <p className="text-gray-600">{r.review || 'No comment'}</p>
            <p className="text-gray-500 text-sm">{new Date(r.createdAt).toISOString().split('T')[0]}</p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No reviews yet.</p>
      )}

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
  );
}