"use client";

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
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
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [formData, setFormData] = useState<ProductData | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageSuccessMessage, setImageSuccessMessage] = useState<string | null>(null);

  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  const fetchProductData = useCallback(async () => {
    if (!slug || !isDevelopment) {
      setIsLoading(false);
      if (!isDevelopment) setError("Editing is only available in development.");
      else setError("No product slug provided.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
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
        dailyPrice: String(data.frontmatter.dailyPrice),
        weekendPrice: String(data.frontmatter.weekendPrice),
        weeklyPrice: String(data.frontmatter.weeklyPrice),
        deposit: String(data.frontmatter.deposit),
        mdxContent: data.content,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setFormData(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug, isDevelopment]);

  const fetchProductImages = useCallback(async () => {
    if (!slug || !isDevelopment) {
      setIsLoadingImages(false);
      return;
    }
    setIsLoadingImages(true);
    setImageError(null);
    setImageSuccessMessage(null);
    try {
      const response = await fetch(`/api/editor/products/${slug}/images`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch images: ${response.statusText}`);
      }
      const data = await response.json();
      setProductImages(data);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : String(err));
      setProductImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  }, [slug, isDevelopment]);

  useEffect(() => {
    if (isDevelopment) {
      fetchProductData();
      fetchProductImages();
    } else {
      setIsLoading(false);
      setIsLoadingImages(false);
      setError("Editing is only available in development.");
    }
  }, [fetchProductData, fetchProductImages, isDevelopment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmitMdx = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDevelopment || !formData) {
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
      if (!response.ok) throw new Error(result.error || `Server responded with ${response.status}`);
      setSuccessMessage(`Product "${formData.name}" details updated successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleImageUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0 || !isDevelopment) {
      setImageError("Please select files to upload and ensure you are in development mode.");
      return;
    }
    setIsUploading(true);
    setImageError(null);
    setImageSuccessMessage(null);
    const imageFormData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      imageFormData.append('images', selectedFiles[i]);
    }

    try {
      const response = await fetch(`/api/editor/products/${slug}/images`, {
        method: 'POST',
        body: imageFormData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server responded with ${response.status}`);
      setImageSuccessMessage(result.message || 'Images uploaded successfully!');
      fetchProductImages();
      setSelectedFiles(null);
      const fileInput = document.getElementById('imageUploadInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'An unknown error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl: string) => {
    if (!isDevelopment) {
        setImageError("Image deletion is only allowed in development.");
        return;
    }
    const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
    if (!window.confirm(`Are you sure you want to delete image: ${filename}?`)) return;

    setImageError(null);
    setImageSuccessMessage(null);
    try {
      const response = await fetch(`/api/editor/products/${slug}/images?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server responded with ${response.status}`);
      setImageSuccessMessage(result.message || 'Image deleted successfully!');
      fetchProductImages();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'An unknown error occurred during deletion.');
    }
  };
  
  if (!isDevelopment && !isLoading && !isLoadingImages) {
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

  if (error && !formData) {
    return (
        <div className="container mx-auto px-4 py-8">
            <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">Error loading product data: {error}</p>
            <Link href="/editor" passHref><Button variant="outline">Back to Editor</Button></Link>
        </div>
    );
  }
  
  if (!formData) {
      return <div className="container mx-auto px-4 py-8">Product data could not be loaded or does not exist.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Edit: {formData.name}</CardTitle>
          <CardDescription>Modify the details for product (slug: {slug}).</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmitMdx}>
          <CardContent className="space-y-6">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            {successMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md">{successMessage}</p>}

            <div><Label htmlFor="name">Product Name</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} required /></div>
            <div><Label htmlFor="category">Category</Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="dailyPrice">Daily Price</Label><Input id="dailyPrice" name="dailyPrice" type="number" value={formData.dailyPrice} onChange={handleChange} required /></div>
              <div><Label htmlFor="weekendPrice">Weekend Price</Label><Input id="weekendPrice" name="weekendPrice" type="number" value={formData.weekendPrice} onChange={handleChange} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="weeklyPrice">Weekly Price</Label><Input id="weeklyPrice" name="weeklyPrice" type="number" value={formData.weeklyPrice} onChange={handleChange} required /></div>
              <div><Label htmlFor="deposit">Deposit</Label><Input id="deposit" name="deposit" type="number" value={formData.deposit} onChange={handleChange} required /></div>
            </div>
            <div><Label htmlFor="mdxContent">MDX Content</Label><Textarea id="mdxContent" name="mdxContent" value={formData.mdxContent} onChange={handleChange} rows={10}/></div>

          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating Details...' : 'Save Details'}
            </Button>
            <Link href="/editor" passHref>
                <Button type="button" variant="outline">Back to Editor</Button>
            </Link>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Product Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {imageError && <p className="text-red-500 bg-red-100 p-3 rounded-md">{imageError}</p>}
          {imageSuccessMessage && <p className="text-green-500 bg-green-100 p-3 rounded-md">{imageSuccessMessage}</p>}

          <div className="space-y-2">
            <Label htmlFor="imageUploadInput">Upload New Images</Label>
            <div className="flex gap-2">
              <Input 
                id="imageUploadInput" 
                type="file" 
                multiple 
                onChange={handleFileChange} 
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="flex-grow"
              />
              <Button onClick={handleImageUpload} disabled={isUploading || !selectedFiles || selectedFiles.length === 0}>
                {isUploading ? 'Uploading...' : 'Upload Selected'}
              </Button>
            </div>
            {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                    {selectedFiles.length} file(s) selected.
                </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Current Images</h3>
            {isLoadingImages ? (
              <p>Loading images...</p>
            ) : productImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {productImages.map((imageUrl) => (
                  <div key={imageUrl} className="relative group border rounded-md overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`Product Image for ${slug}`}
                      width={200}
                      height={200}
                      className="object-cover aspect-square"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleImageDelete(imageUrl)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No images found for this product.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
