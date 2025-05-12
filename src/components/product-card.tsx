import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    imageUrls: string[];
    dailyPrice: number;
    slug: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImageUrl = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls[0]
    : '/images/placeholder.png';

  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <Card className="overflow-hidden h-full transition-all hover:shadow-md flex flex-col">
        <div className="aspect-square relative w-full">
          <Image
            src={primaryImageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
        <div className="flex flex-col flex-grow p-4">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-xl font-medium">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          </CardContent>
          <CardFooter className="p-0 mt-4">
            <p className="font-medium text-primary">
              {formatCurrency(product.dailyPrice)}/day
            </p>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
} 