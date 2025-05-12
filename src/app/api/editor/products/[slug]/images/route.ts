import path from 'path';
import { type NextRequest, NextResponse } from 'next/server';
import { stat, mkdir, writeFile, readdir, unlink } from 'fs/promises'; // Using promise-based fs

const imagesBaseDirectory = path.join(process.cwd(), 'public/images/products');
const imagesPublicPath = '/images/products'; // Public URL path

// Helper to extract slug from pathname
// This function is no longer needed as slug comes from context.params
/*
function getSlugFromPathname(pathname: string): string | undefined {
  // Pathname is like /api/editor/products/some-product-slug/images
  const parts = pathname.split('/');
  // Expected structure: ['', 'api', 'editor', 'products', 'SLUG', 'images']
  if (parts.length >= 3 && parts[parts.length - 1] === 'images') {
    return parts[parts.length - 2];
  }
  return undefined;
}
*/

// GET existing images for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = await params; // Await params to get slug

  if (!slug) {
    // This check might be redundant if Next.js guarantees slug presence, but safe to keep
    return NextResponse.json({ error: 'Could not determine product slug from URL path' }, { status: 400 });
  }

  const productImageDir = path.join(imagesBaseDirectory, slug);

  try {
    await stat(productImageDir);
    const imageFilenames = await readdir(productImageDir);
    const sortedImageFiles = imageFilenames
      .filter(filename => /\.(jpg|jpeg|png|webp|gif)$/i.test(filename))
      .sort((a, b) => a.localeCompare(b));

    const imageUrls = sortedImageFiles.map(filename => `${imagesPublicPath}/${slug}/${filename}`);
    return NextResponse.json(imageUrls);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error(`Error reading images for product ${slug}:`, error);
    return NextResponse.json({ error: `Failed to retrieve images for ${slug}` }, { status: 500 });
  }
}

// POST (upload) new images for a product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = await params; // Await params to get slug

  if (!slug) {
    // This check might be redundant
    return NextResponse.json({ error: 'Could not determine product slug from URL path' }, { status: 400 });
  }

  const productImageDir = path.join(imagesBaseDirectory, slug);

  try {
    await mkdir(productImageDir, { recursive: true });
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFilePaths: string[] = [];
    for (const file of files) {
      if (!(file instanceof File)) {
        console.warn('Skipping non-file entry in FormData');
        continue;
      }
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
          console.warn(`Skipping file with unsupported type: ${file.name}`);
          continue;
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(productImageDir, file.name);
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = await params; // Await params to get slug
  const filename = request.nextUrl.searchParams.get('filename');

  if (!slug) {
    // This check might be redundant
    return NextResponse.json({ error: 'Could not determine product slug from URL path' }, { status: 400 });
  }
  if (!filename) {
    return NextResponse.json({ error: 'Filename query parameter is required' }, { status: 400 });
  }

  const imagePath = path.join(imagesBaseDirectory, slug, filename);

  try {
    await stat(imagePath);
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
