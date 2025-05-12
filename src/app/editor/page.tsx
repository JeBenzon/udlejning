"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface EditorProduct {
  slug: string;
  name: string;
}

export default function EditorPage() {
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (process.env.NODE_ENV !== 'development') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setActionMessage(null);
    try {
      const response = await fetch('/api/editor/products');
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
    if (process.env.NODE_ENV === 'development') {
      fetchProducts();
    } else {
      setIsLoading(false);
    }
  }, [fetchProducts]);

  const handleDeleteProduct = async (slug: string, productName: string) => {
    if (process.env.NODE_ENV !== 'development') {
      setActionMessage("Deletion is only allowed in development.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    setActionMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/editor/products/${slug}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Failed to delete product: ${response.statusText}`);
      }
      setActionMessage(result.message || `Product "${productName}" deleted successfully.`);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during deletion.');
      setActionMessage(null);
    }
  };

  if (!isDevelopment) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Editor Unavailable</h1>
        <p>This editor is only available in the development environment.</p>
      </div>
    );
  }

  if (isLoading && products.length === 0) {
    return <div className="container mx-auto px-4 py-8">Loading editor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Product Editor</h1>
        <Link href="/editor/new" passHref>
          <Button>Create New Product</Button>
        </Link>
      </div>

      {actionMessage && <p className={`mb-4 p-3 rounded-md ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{actionMessage}</p>}
      {error && !actionMessage && <p className="mb-4 p-3 rounded-md bg-red-100 text-red-700">Error: {error}</p>}

      {products.length === 0 && !isLoading ? (
        <p>No products found. Start by creating one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.slug}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>Slug: {product.slug}</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end gap-2">
                <Link href={`/editor/edit/${product.slug}`} passHref>
                   <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.slug, product.name)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
