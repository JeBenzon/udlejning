"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface ProductData {
  name: string;
  description: string;
  category: string;
  dailyPrice: string | number; // Allow string for form input, convert to number on submit
  weekendPrice: string | number;
  weeklyPrice: string | number;
  deposit: string | number;
  mdxContent: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [formData, setFormData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  const fetchProductData = useCallback(async () => {
    if (!slug || process.env.NODE_ENV !== 'development') {
        setIsLoading(false);
        if (process.env.NODE_ENV !== 'development') setError("Editing is only available in development.");
        else setError("No product slug provided.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/editor/products/${slug}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch product data: ${response.statusText}`);
      }
      const data = await response.json();
      setFormData({
        name: data.frontmatter.name,
        description: data.frontmatter.description,
        category: data.frontmatter.category,
        dailyPrice: String(data.frontmatter.dailyPrice), // Keep as string for input
        weekendPrice: String(data.frontmatter.weekendPrice),
        weeklyPrice: String(data.frontmatter.weeklyPrice),
        deposit: String(data.frontmatter.deposit),
        mdxContent: data.content,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (isDevelopment) {
        fetchProductData();
    } else {
        setIsLoading(false);
        setError("Editing is only available in development.");
    }
  }, [fetchProductData, isDevelopment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (process.env.NODE_ENV !== 'development' || !formData) {
        setError("Form submission is only allowed in development or form data is missing.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/editor/products/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            dailyPrice: parseFloat(String(formData.dailyPrice)) || 0,
            weekendPrice: parseFloat(String(formData.weekendPrice)) || 0,
            weeklyPrice: parseFloat(String(formData.weeklyPrice)) || 0,
            deposit: parseFloat(String(formData.deposit)) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server responded with ${response.status}`);
      }

      setSuccessMessage(`Product "${formData.name}" updated successfully!`);
      // Optionally refetch data to confirm changes if not redirecting
      // fetchProductData(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isDevelopment && !isLoading) { // Show unavailable message if not dev and not in initial loading state
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Editor Unavailable</h1>
        <p>This feature is only available in the development environment.</p>
      </div>
    );
  }


  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading product details...</div>;
  }

  if (error && !formData) { // If error and no form data (e.g. product not found)
    return (
        <div className="container mx-auto px-4 py-8">
            <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">Error: {error}</p>
            <Link href="/editor" passHref>
                <Button variant="outline">Back to Editor</Button>
            </Link>
        </div>
    );
  }
  
  if (!formData) {
      // This case should ideally be caught by error state if fetching fails
      return <div className="container mx-auto px-4 py-8">Product data could not be loaded.</div>;
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit: {formData.name}</CardTitle>
          <CardDescription>Modify the details for product (slug: {slug}).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dailyPrice">Daily Price</Label>
                <Input id="dailyPrice" name="dailyPrice" type="number" value={formData.dailyPrice} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="weekendPrice">Weekend Price</Label>
                <Input id="weekendPrice" name="weekendPrice" type="number" value={formData.weekendPrice} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weeklyPrice">Weekly Price</Label>
                <Input id="weeklyPrice" name="weeklyPrice" type="number" value={formData.weeklyPrice} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="deposit">Deposit</Label>
                <Input id="deposit" name="deposit" type="number" value={formData.deposit} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="mdxContent">MDX Content</Label>
              <Textarea
                id="mdxContent"
                name="mdxContent"
                value={formData.mdxContent}
                onChange={handleChange}
                rows={15}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
            <Link href="/editor" passHref>
                <Button type="button" variant="outline">
                    Back to Editor
                </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
