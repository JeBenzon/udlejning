"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';

interface Product {
  name: string;
  description: string;
  imageUrls: string[];
  dailyPrice: number;
  slug: string;
  category: string;
}

export function ProductSearch({ products }: { products: Product[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  return (
    <div>
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
} 