import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NextRequest, NextResponse } from 'next/server';

const productsDirectory = path.join(process.cwd(), 'content/products');
const imagesBaseDirectory = path.join(process.cwd(), 'public/images/products'); // For image handling later

interface ProductParams {
  params: {
    slug: string;
  };
}

// GET a single product for editing
export async function GET(request: NextRequest, { params }: ProductParams) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = params;
  const filePath = path.join(productsDirectory, `${slug}.mdx`);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return NextResponse.json({ frontmatter: data, content, slug });
  } catch (error) {
    console.error(`Error reading product file ${slug}.mdx:`, error);
    return NextResponse.json({ error: 'Failed to retrieve product' }, { status: 500 });
  }
}

// PUT (update) a product
export async function PUT(request: NextRequest, { params }: ProductParams) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = params;
  const filePath = path.join(productsDirectory, `${slug}.mdx`);

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Product not found, cannot update.' }, { status: 404 });
    }

    const formData = await request.json();
    const {
      name,
      description,
      category,
      dailyPrice,
      weekendPrice,
      weeklyPrice,
      deposit,
      mdxContent
    } = formData;

    // Basic validation
    if (name === undefined || description === undefined || category === undefined || dailyPrice === undefined || weekendPrice === undefined || weeklyPrice === undefined || deposit === undefined || mdxContent === undefined) {
      return NextResponse.json({ error: 'Missing required fields for update' }, { status: 400 });
    }

    // Note: We are NOT changing the slug or filename here.
    // If the 'name' changes, the slug derived from it would also change.
    // Handling slug changes (renaming files and potentially image folders) is more complex
    // and can be added as a separate feature or handled with caution.
    // For now, the filename (and thus the slug in the URL) remains constant.

    const frontmatter = {
      name,
      description,
      category,
      dailyPrice: Number(dailyPrice),
      weekendPrice: Number(weekendPrice),
      weeklyPrice: Number(weeklyPrice),
      deposit: Number(deposit),
    };

    const fileContent = matter.stringify(mdxContent, frontmatter);
    fs.writeFileSync(filePath, fileContent);

    return NextResponse.json({ message: 'Product updated successfully', slug });

  } catch (error) {
    console.error(`Error updating product ${slug}.mdx:`, error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(request: NextRequest, { params }: ProductParams) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { slug } = params;
  const mdxFilePath = path.join(productsDirectory, `${slug}.mdx`);
  const imageDirectoryPath = path.join(imagesBaseDirectory, slug);

  try {
    let mdxDeleted = false;
    if (fs.existsSync(mdxFilePath)) {
      fs.unlinkSync(mdxFilePath);
      mdxDeleted = true;
    } else {
      console.warn(`MDX file not found for deletion: ${mdxFilePath}`);
      // We might still want to attempt to delete the image directory
    }

    let imageDirDeleted = false;
    if (fs.existsSync(imageDirectoryPath)) {
      fs.rmSync(imageDirectoryPath, { recursive: true, force: true }); // force: true to suppress errors if dir is empty or not found
      imageDirDeleted = true;
    } else {
      console.warn(`Image directory not found for deletion: ${imageDirectoryPath}`);
    }

    if (!mdxDeleted && !imageDirDeleted) {
        return NextResponse.json({ error: 'Product (MDX and image directory) not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: `Product '${slug}' deleted successfully (MDX: ${mdxDeleted}, Images: ${imageDirDeleted})` });

  } catch (error) {
    console.error(`Error deleting product ${slug}:`, error);
    return NextResponse.json({ error: `Failed to delete product '${slug}'` }, { status: 500 });
  }
}
