import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { stat, mkdir, writeFile, readdir, unlink } from 'fs/promises'; // Using promise-based fs

const imagesBaseDirectory = path.join(process.cwd(), 'public/images/products');
const imagesPublicPath = '/images/products'; // Public URL path

// GET existing images for a product
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const slug = params.slug;
  const productImageDir = path.join(imagesBaseDirectory, slug);

  try {
    await stat(productImageDir); // Check if directory exists
    const imageFilenames = await readdir(productImageDir);
    const sortedImageFiles = imageFilenames
      .filter(filename => /\.(jpg|jpeg|png|webp|gif)$/i.test(filename))
      .sort((a, b) => a.localeCompare(b));

    const imageUrls = sortedImageFiles.map(filename => `${imagesPublicPath}/${slug}/${filename}`);
    return NextResponse.json(imageUrls);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([]); // No images or directory doesn't exist
    }
    console.error(`Error reading images for product ${slug}:`, error);
    return NextResponse.json({ error: `Failed to retrieve images for ${slug}` }, { status: 500 });
  }
}

// POST (upload) new images for a product
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const slug = params.slug;
  const productImageDir = path.join(imagesBaseDirectory, slug);

  try {
    // Ensure the product's image directory exists
    await mkdir(productImageDir, { recursive: true });

    const formData = await request.formData();
    const files = formData.getAll('images') as File[]; // Assuming input field name is 'images'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFilePaths: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        console.warn('Skipping non-file entry in FormData');
        continue;
      }
      // Basic validation for file type (optional, client-side validation is also good)
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
          console.warn(`Skipping file with unsupported type: ${file.name}`);
          continue; // Skip this file
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(productImageDir, file.name); // Use original filename

      // Prevent overwriting? Or allow? For now, allow.
      // Consider adding logic to rename if file exists or return an error.
      await writeFile(filePath, buffer);
      uploadedFilePaths.push(`${imagesPublicPath}/${slug}/${file.name}`);
    }
    
    if (uploadedFilePaths.length === 0) {
        return NextResponse.json({ error: 'No valid image files were uploaded.'} , { status: 400});
    }

    return NextResponse.json({ message: 'Images uploaded successfully', uploadedFilePaths }, { status: 201 });

  } catch (error) {
    console.error(`Error uploading images for product ${slug}:`, error);
    return NextResponse.json({ error: `Failed to upload images for ${slug}` }, { status: 500 });
  }
}

// DELETE a specific image for a product
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const slug = params.slug;
  const filename = request.nextUrl.searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename query parameter is required' }, { status: 400 });
  }

  const imagePath = path.join(imagesBaseDirectory, slug, filename);

  try {
    await stat(imagePath); // Check if file exists
    await unlink(imagePath);
    return NextResponse.json({ message: `Image '${filename}' deleted successfully from product '${slug}'` });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: `Image '${filename}' not found for product '${slug}'` }, { status: 404 });
    }
    console.error(`Error deleting image '${filename}' for product ${slug}:`, error);
    return NextResponse.json({ error: `Failed to delete image '${filename}'` }, { status: 500 });
  }
}
