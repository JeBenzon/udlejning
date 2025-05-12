import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';

const productsDirectory = path.join(process.cwd(), 'content/products');
const imagesBaseDirectory = path.join(process.cwd(), 'public/images/products'); // Path to product images root
const imagesPublicPath = '/images/products'; // Public URL path

// Function to get sorted image URLs for a specific product slug
function getProductImages(slug: string): string[] {
  const productImageDir = path.join(imagesBaseDirectory, slug);
  try {
    if (!fs.existsSync(productImageDir)) {
      console.warn(`Image directory not found for product: ${slug} at ${productImageDir}`);
      return []; // No images if directory doesn't exist
    }
    const imageFilenames = fs.readdirSync(productImageDir);
    // Filter for common image extensions and sort alphabetically
    const sortedImageFiles = imageFilenames
      .filter(filename => /\.(jpg|jpeg|png|webp|gif)$/i.test(filename))
      .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

    // Return full public paths
    return sortedImageFiles.map(filename => `${imagesPublicPath}/${slug}/${filename}`);
  } catch (error) {
    console.error(`Error reading images for product ${slug}:`, error);
    return []; // Return empty on error
  }
}

export async function generateStaticParams() {
  try {
    const filenames = fs.readdirSync(productsDirectory);
    return filenames
      .filter((filename) => filename.endsWith('.mdx')) // Ensure we only consider .mdx files
      .map((filename) => ({
        slug: filename.replace(/\.mdx$/, ''), // Remove .mdx extension for the slug
      }));
  } catch (error) {
    console.error("Error reading products directory for generateStaticParams:", error);
    return []; // Return empty array on error
  }
}

async function getProductBySlug(slug: string) {
  const fullPath = path.join(productsDirectory, `${slug}.mdx`);
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Fetch associated images
    const imageUrls = getProductImages(slug);

    // Validation (check frontmatter and ensure at least one image exists if required)
    if (!data.name || !data.description || typeof data.dailyPrice !== 'number' || typeof data.weekendPrice !== 'number' || typeof data.weeklyPrice !== 'number' || typeof data.deposit !== 'number' || imageUrls.length === 0) {
        console.error(`Missing required frontmatter fields or no images found in ${slug}.mdx`);
        return null;
    }

    return {
      slug,
      frontmatter: data as {
        name: string;
        description: string;
        category: string;
        // imageUrl: string; // Removed imageUrl
        dailyPrice: number;
        weekendPrice: number;
        weeklyPrice: number;
        deposit: number;
      },
      imageUrls, // Add the list of image URLs
      content,
    };
  } catch (error) {
    console.error(`Error reading product file ${slug}.mdx:`, error);
    return null;
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const { frontmatter, imageUrls, content } = product;
  const primaryImageUrl = imageUrls[0]; // Use the first image as primary

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square">
          {/* Use the primary image URL */}
          <Image
            src={primaryImageUrl}
            alt={frontmatter.name}
            fill
            className="object-cover rounded-lg"
            priority // Prioritize loading the main product image
          />
          {/* TODO: Add gallery/carousel for other images in `imageUrls` if needed */}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{frontmatter.name}</h1>
          <p className="text-lg text-muted-foreground mb-6">{frontmatter.description}</p>
          
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Daily</p>
                <p className="text-xl font-semibold">{formatCurrency(frontmatter.dailyPrice)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Weekend</p>
                <p className="text-xl font-semibold">{formatCurrency(frontmatter.weekendPrice)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Weekly</p>
                <p className="text-xl font-semibold">{formatCurrency(frontmatter.weeklyPrice)}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg mb-8">
            <p className="font-medium mb-1">Deposit required</p>
            <p className="text-xl font-semibold">{formatCurrency(frontmatter.deposit)}</p>
          </div>
          
          <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-md font-medium">
            Book Now (Action not implemented)
          </button>
        </div>
      </div>

      <div className="mt-12 prose max-w-none">
         <MDXRemote source={content} />
      </div>
    </div>
  );
} 