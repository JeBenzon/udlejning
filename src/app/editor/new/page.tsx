"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    dailyPrice: '',
    weekendPrice: '',
    weeklyPrice: '',
    deposit: '',
    mdxContent: '## Product Specifications\n\n## Usage Instructions\n'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (process.env.NODE_ENV !== 'development') {
        setError("Form submission is only allowed in development.");
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/editor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            dailyPrice: parseFloat(formData.dailyPrice) || 0,
            weekendPrice: parseFloat(formData.weekendPrice) || 0,
            weeklyPrice: parseFloat(formData.weeklyPrice) || 0,
            deposit: parseFloat(formData.deposit) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server responded with ${response.status}`);
      }

      setSuccessMessage(`Product "${formData.name}" created successfully! Slug: ${result.slug}`);
      // Optionally reset form or redirect
      // setFormData({ name: '', description: '', category: '', dailyPrice: '', weekendPrice: '', weeklyPrice: '', deposit: '', mdxContent: '## Product Specifications\n\n## Usage Instructions\n'});
      // router.push('/editor'); // Redirect to editor home
      router.push(`/editor/edit/${result.slug}`); // Redirect to edit page for the new product

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isDevelopment) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Editor Unavailable</h1>
        <p>This feature is only available in the development environment.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Product</CardTitle>
          <CardDescription>Fill in the details below to add a new product.</CardDescription>
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
                rows={10}
                placeholder="Enter product details, specifications, usage instructions here in Markdown format."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="ml-2">
                Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
