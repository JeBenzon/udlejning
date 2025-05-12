"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
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
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDevelopment) {
      setError("Form submission is only allowed in development.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmissionStatus("Creating product details...");
    let productSlug = '';

    // --- Step 1: Create Product MDX ---
    try {
      const createResponse = await fetch('/api/editor/products', {
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
      const createResult = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createResult.error || `Failed to create product: Server responded with ${createResponse.status}`);
      }
      productSlug = createResult.slug; // Store slug for image upload and redirect
      setSubmissionStatus(`Product "${formData.name}" created (slug: ${productSlug}).`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during product creation.');
      setIsSubmitting(false);
      setSubmissionStatus(null);
      return; // Stop if product creation failed
    }

    // --- Step 2: Upload Images (if selected) ---
    if (selectedFiles && selectedFiles.length > 0 && productSlug) {
      setSubmissionStatus(`Uploading ${selectedFiles.length} image(s)...`);
      const imageFormData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        imageFormData.append('images', selectedFiles[i]);
      }

      try {
        const uploadResponse = await fetch(`/api/editor/products/${productSlug}/images`, {
          method: 'POST',
          body: imageFormData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          // Don't throw error here, just report it. Product already created.
          setError(`Product created, but image upload failed: ${uploadResult.error || `Server responded with ${uploadResponse.status}`}`);
          setSubmissionStatus(null); // Clear status message
        } else {
          setSubmissionStatus(`Product created and images uploaded successfully! Redirecting...`);
        }
      } catch (uploadErr) {
        setError(`Product created, but an error occurred during image upload: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
        setSubmissionStatus(null);
      }
    } else {
        setSubmissionStatus(`Product created successfully (no images selected). Redirecting...`);
    }

    // --- Step 3: Redirect (after a short delay to show final status) ---
    setTimeout(() => {
        if (productSlug) {
            router.push(`/editor/edit/${productSlug}`);
        } else {
            // Fallback if slug wasn't obtained (shouldn't happen if create succeeded)
            setError("Could not determine product slug for redirect.");
            setIsSubmitting(false);
        }
        // Don't set isSubmitting to false here as we are navigating away
    }, 1500); // 1.5 second delay

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
          <CardDescription>Fill in the details and optionally upload initial images.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
              {submissionStatus && !error && <p className="text-blue-600 bg-blue-100 p-3 rounded-md">{submissionStatus}</p>}
              {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}

              <div><Label htmlFor="name">Product Name</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting}/></div>
              <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description} onChange={handleChange} required disabled={isSubmitting}/></div>
              <div><Label htmlFor="category">Category</Label><Input id="category" name="category" value={formData.category} onChange={handleChange} required disabled={isSubmitting}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="dailyPrice">Daily Price</Label><Input id="dailyPrice" name="dailyPrice" type="number" value={formData.dailyPrice} onChange={handleChange} required disabled={isSubmitting}/></div>
                <div><Label htmlFor="weekendPrice">Weekend Price</Label><Input id="weekendPrice" name="weekendPrice" type="number" value={formData.weekendPrice} onChange={handleChange} required disabled={isSubmitting}/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="weeklyPrice">Weekly Price</Label><Input id="weeklyPrice" name="weeklyPrice" type="number" value={formData.weeklyPrice} onChange={handleChange} required disabled={isSubmitting}/></div>
                <div><Label htmlFor="deposit">Deposit</Label><Input id="deposit" name="deposit" type="number" value={formData.deposit} onChange={handleChange} required disabled={isSubmitting}/></div>
              </div>
              <div><Label htmlFor="mdxContent">MDX Content</Label><Textarea id="mdxContent" name="mdxContent" value={formData.mdxContent} onChange={handleChange} rows={10} placeholder="Enter product details..." disabled={isSubmitting}/></div>

              <div className="space-y-2">
                  <Label htmlFor="images">Initial Images (Optional)</Label>
                  <Input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={isSubmitting}
                  />
                  {selectedFiles && selectedFiles.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                          {selectedFiles.length} file(s) selected.
                      </p>
                  )}
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (submissionStatus || 'Processing...') : 'Create Product & Upload Images'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="ml-2" disabled={isSubmitting}>
                  Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
}
