// components/ProductCard.tsx
'use client';

import Link from 'next/link';
import { FaCartPlus } from 'react-icons/fa';

export function ProductCard({ product }: { product: any }) {
  return (
    <div className="card">
      <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
        <p className="text-gray-600">{product.price} DZD</p>
        <p className="text-sm text-gray-500">Shop: {product.shop.name}</p>
        <div className="mt-2 flex justify-between items-center">
          <Link href={`/product/${product._id}`} className="text-primary-green hover:underline">
            View
          </Link>
          <button className="text-accent-gold hover:text-yellow-600 transition">
            <FaCartPlus size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}