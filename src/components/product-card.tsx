import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    imageUrl: string;
    dailyPrice: number;
    slug: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden h-full transition-all hover:shadow-md">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-xl font-medium">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        <CardFooter className="p-4">
          <p className="font-medium text-primary">
            {formatCurrency(product.dailyPrice)}/day
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
} 