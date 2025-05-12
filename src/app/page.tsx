import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ProductSearch } from '@/components/product-search';
// Note: The 'Product' type will now implicitly come from whatever ProductSearch expects,
// or we can define it here if needed. For now, we'll ensure the shape matches.

const productsDirectory = path.join(process.cwd(), 'content/products');
const imagesBaseDirectory = path.join(process.cwd(), 'public/images/products'); // Path to product images root
const imagesPublicPath = '/images/products'; // Public URL path

// Function to get sorted image URLs (can be shared or duplicated from [slug]/page.tsx)
function getProductImages(slug: string): string[] {
  const productImageDir = path.join(imagesBaseDirectory, slug);
  try {
    if (!fs.existsSync(productImageDir)) {
      return [];
    }
    const imageFilenames = fs.readdirSync(productImageDir);
    const sortedImageFiles = imageFilenames
      .filter(filename => /\.(jpg|jpeg|png|webp|gif)$/i.test(filename))
      .sort((a, b) => a.localeCompare(b));
    return sortedImageFiles.map(filename => `${imagesPublicPath}/${slug}/${filename}`);
  } catch (error) {
    console.error(`Error reading images for product ${slug} in getAllProducts:`, error);
    return [];
  }
}

// Define a type for the product data we will extract
// This should match the structure ProductSearch and ProductCard expect
interface ProductData {
  slug: string;
  name: string;
  description: string;
  category: string;
  imageUrls: string[]; // Added imageUrls
  dailyPrice: number;
  // Add other fields if ProductSearch/ProductCard use them, e.g., weekendPrice, weeklyPrice
}

async function getAllProducts(): Promise<ProductData[]> {
  try {
    const filenames = fs.readdirSync(productsDirectory);
    const products = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map((filename) => {
        const slug = filename.replace(/\.mdx$/, '');
        const fullPath = path.join(productsDirectory, filename);
        try {
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const { data } = matter(fileContents);
          const imageUrls = getProductImages(slug);

          // Validation (check frontmatter WITHOUT requiring images)
          if (!data.name || !data.description || typeof data.dailyPrice !== 'number' || !data.category) {
            console.warn(`Skipping ${filename} due to missing required frontmatter for product listing.`);
            return null;
          }

          return {
            slug,
            name: data.name,
            description: data.description,
            category: data.category,
            imageUrls, // Pass empty array if no images found
            dailyPrice: data.dailyPrice,
          } as ProductData;
        } catch (readError) {
          console.error(`Error reading or parsing ${filename}:`, readError);
          return null;
        }
      });

    return products.filter(product => product !== null) as ProductData[];
  } catch (error) {
    console.error("Error reading products directory for getAllProducts:", error);
    return [];
  }
}


export default async function Home() {
  const allProducts = await getAllProducts();
  console.log("Fetched products for homepage:", allProducts);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Machine Rental</h1>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Available Equipment</h2>
        {/* The 'products' prop of ProductSearch now expects an array of ProductData */}
        <ProductSearch products={allProducts} />
      </section>
    </div>
  );
}
