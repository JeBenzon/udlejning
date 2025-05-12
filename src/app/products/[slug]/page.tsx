import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { notFound } from 'next/navigation';

const productsDirectory = path.join(process.cwd(), 'content/products');

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
    // Use gray-matter to parse the post metadata section
    const { data, content } = matter(fileContents);

    // Ensure required fields are present (add checks as needed based on your frontmatter)
     if (!data.name || !data.description || !data.imageUrl || typeof data.dailyPrice !== 'number' || typeof data.weekendPrice !== 'number' || typeof data.weeklyPrice !== 'number' || typeof data.deposit !== 'number') {
        console.error(`Missing required frontmatter fields in ${slug}.mdx`);
        return null; 
     }

    // Combine the data with the slug and content
    return {
      slug,
      frontmatter: data as { 
        name: string; 
        description: string; 
        category: string; // Assuming category is still needed
        imageUrl: string; 
        dailyPrice: number;
        weekendPrice: number;
        weeklyPrice: number;
        deposit: number;
      },
      content,
    };
  } catch (error) {
    // Handle file not found or other read errors
    console.error(`Error reading product file ${slug}.mdx:`, error);
    return null; // Return null if file doesn't exist or has issues
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    notFound(); // Trigger 404 if product wasn't found or had errors
  }

  const { frontmatter, content } = product;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square">
          <Image
            src={frontmatter.imageUrl}
            alt={frontmatter.name}
            fill
            className="object-cover rounded-lg"
          />
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
         {/* Use MDXRemote to render the content */}
         <MDXRemote source={content} />
      </div>
    </div>
  );
} 