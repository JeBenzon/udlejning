import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextRequest, NextResponse } from 'next/server';

const productsDirectory = path.join(process.cwd(), 'content/products');
const imagesBaseDirectory = path.join(process.cwd(), 'public/images/products');

// Helper function to generate a slug (you might want a more robust version)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, ''); // Remove all non-word chars
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

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
          return {
            slug,
            name: data.name || 'Unnamed Product', // Provide a fallback for name
          };
        } catch (readError) {
          console.error(`Error reading or parsing ${filename} for editor list:`, readError);
          return {
            slug,
            name: 'Error Reading Product',
          };
        }
      });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error reading products directory for editor:", error);
    return NextResponse.json(
      { error: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.json();
    const {
      name,
      description,
      category,
      dailyPrice,
      weekendPrice,
      weeklyPrice,
      deposit,
      mdxContent = '' // Default to empty string if not provided
    } = formData;

    // Basic validation
    if (!name || !description || !category || dailyPrice === undefined || weekendPrice === undefined || weeklyPrice === undefined || deposit === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const slug = generateSlug(name);
    const filePath = path.join(productsDirectory, `${slug}.mdx`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Product with this name (slug) already exists' }, { status: 409 });
    }

    const frontmatter = {
      name,
      description,
      category,
      dailyPrice: Number(dailyPrice),
      weekendPrice: Number(weekendPrice),
      weeklyPrice: Number(weeklyPrice),
      deposit: Number(deposit),
      // imageUrl will be handled by image upload later, or derived from the first image in the folder
    };

    const fileContent = matter.stringify(mdxContent, frontmatter);
    fs.writeFileSync(filePath, fileContent);

    // Create image directory for the product
    const productImageDir = path.join(imagesBaseDirectory, slug);
    if (!fs.existsSync(productImageDir)) {
      fs.mkdirSync(productImageDir, { recursive: true });
    }

    return NextResponse.json({ message: 'Product created successfully', slug }, { status: 201 });

  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
