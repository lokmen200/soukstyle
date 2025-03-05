// components/ShopCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTiktok, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../lib/authContext';
import api from '../lib/api';
import { toast } from 'react-toastify';

const BASE_URL = 'http://localhost:5000';

export function ShopCard({ shop, onFollow }: { shop: any; onFollow?: (shopId: string, isFollowing: boolean) => void }) {
  const { user, token } = useAuth();
  const isFollowing = user && shop.followers?.includes(user._id);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowClick = () => {
    if (onFollow) onFollow(shop._id, isFollowing);
  };

  const handleAddToCart = async (productId: string) => {
    if (!token) {
      toast.error('Please log in to add items to cart');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/cart', { productId, quantity: 1 }, { headers: { 'x-auth-token': token } });
      toast.success('Added to cart successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <img
        src={`${BASE_URL}${shop.logo}`}
        alt={shop.name}
        className="w-24 h-24 mx-auto rounded-full object-cover"
        onError={(e) => { e.currentTarget.src = `${BASE_URL}/images/default-logo.png`; }}
      />
      <h3 className="text-lg font-medium text-gray-800 text-center mt-2">{shop.name}</h3>
      <div className="flex justify-center space-x-3 mt-2 text-gray-600">
        {shop.socialMedia?.facebook && <a href={shop.socialMedia.facebook} className="hover:text-primary-green"><FaFacebook size={20} /></a>}
        {shop.socialMedia?.instagram && <a href={shop.socialMedia.instagram} className="hover:text-primary-green"><FaInstagram size={20} /></a>}
        {shop.socialMedia?.tiktok && <a href={shop.socialMedia.tiktok} className="hover:text-primary-green"><FaTiktok size={20} /></a>}
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={handleFollowClick}
          className={`btn-primary ${isFollowing ? 'bg-gray-500 hover:bg-gray-600' : ''}`}
          disabled={!user || isLoading}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
        <Link href={`/shop/${shop._id}`} className="text-primary-green hover:underline">View Shop</Link>
      </div>
      {shop.featuredProduct && (
        <div className="mt-4">
          <p className="text-gray-600">Featured: {shop.featuredProduct.name} - {shop.featuredProduct.price} DZD</p>
          <button
            onClick={() => handleAddToCart(shop.featuredProduct._id)}
            className="btn-primary mt-2 flex items-center justify-center w-full"
            disabled={isLoading}
          >
            <FaShoppingCart className="mr-2" />
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      )}
    </div>
  );
}