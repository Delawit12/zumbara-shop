"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Star, StarHalf, ShoppingBag, Package } from "lucide-react";
import { getProductById } from "@/utils/api/products";
import { WriteReview } from "@/components/core/write-review";
import { formatETB } from "@/utils/formatter";
import { addToCart } from "@/utils/api/cart";
import { toast } from "sonner";
import { useIsAuthenticated } from "@/stores/user-store";

interface Variant {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  stock: number;
  variants: Variant[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    user: {
      firstName: string;
      lastName: string;
      image: string;
    };
  }>;
  averageRating: number;
  canReview?: boolean;
}

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [canReview, setCanReview] = useState<boolean | null>(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number>(1);
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);
        setProduct(response);
        if (response?.variants?.length > 0) {
          setSelectedVariant(response.variants[0]);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    try {
      if (!isAuthenticated) {
        router.push(`/auth/login?redirect=/shop/${id}`);
        return;
      }
      const variantId = selectedVariant ? selectedVariant.id : undefined;
      await addToCart({
        productId: product?.id || "",
        variantId,
        quantity,
      });
      toast.success("Product added to cart");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to cart");
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      const query = new URLSearchParams({
        productId: product?.id || "",
        ...(selectedVariant && { variantId: selectedVariant.id }),
        quantity: String(quantity ?? 1),
      });
      router.push(
        `/auth/login?redirect=${encodeURIComponent(
          `/checkout?${query.toString()}`
        )}`
      );
      return;
    }

    const queryParams = new URLSearchParams({
      productId: product?.id || "",
      ...(selectedVariant && { variantId: selectedVariant.id }),
      quantity: String(quantity ?? 1),
    });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background">
        <div className="animate-pulse space-y-8 px-6 py-12 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-[600px] bg-muted rounded-lg" />
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
              <div className="h-40 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-foreground">
            Product not found
          </h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const StarRating = ({
    rating,
    size = 24,
  }: {
    rating: number;
    size?: number;
  }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            size={size}
            className="fill-yellow-400 text-yellow-400"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <StarHalf
            key={i}
            size={size}
            className="fill-yellow-400 text-yellow-400"
          />
        );
      } else {
        stars.push(<Star key={i} size={size} className="text-border" />);
      }
    }

    return <div className="flex gap-1">{stars}</div>;
  };

  const mainImage = selectedVariant?.image || product.image;
  const currentPrice = selectedVariant?.price || product.price;

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Main Content */}
      <div className="w-full py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Product Images */}
          <div className="flex flex-col gap-8">
            <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={mainImage || "/placeholder.svg?height=600&width=600"}
                alt={product.name}
                className="w-full h-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Variant Thumbnails */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all border-2 ${
                      selectedVariant?.id === variant.id
                        ? "border-primary"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <img
                      src={
                        variant.image || "/placeholder.svg?height=80&width=80"
                      }
                      alt={variant.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Reviews */}
          <div className="flex flex-col gap-12">
            {/* Product Info Section */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  {product.name}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                  {product.description}
                </p>
              </div>

              {/* Rating */}
              {product.averageRating !== undefined && (
                <div className="flex items-center gap-6">
                  <StarRating rating={product.averageRating} size={24} />

                  <span className="text-base text-muted-foreground">
                    {product.averageRating.toFixed(1)} (
                    {product.reviews?.length || 0}{" "}
                    {product.reviews?.length === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}

              {/* Price Section */}
              <div className="space-y-3 pb-8 border-b border-border">
                <p className="text-2xl font-bold text-foreground">
                  {formatETB(currentPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {selectedVariant?.stock || product.stock}
                  </span>{" "}
                  available in stock
                </p>
              </div>
            </div>

            {/* Variants Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-6">
                    Select variant
                  </h3>
                  <div className="space-y-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground">
                            {variant.name}
                          </span>
                          <span className="font-bold text-foreground">
                            {formatETB(variant.price)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-8">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    className="px-3 py-2 bg-muted text-foreground"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="w-16 text-center px-2 py-2 bg-transparent outline-none"
                    value={quantity}
                    min={1}
                    onChange={(e) => {
                      const v = Number(e.target.value || 1);
                      setQuantity(Number.isNaN(v) ? 1 : Math.max(1, v));
                    }}
                  />
                  <button
                    className="px-3 py-2 bg-muted text-foreground"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium gap-2 border-border hover:border-primary transition-colors bg-transparent"
                onClick={handleAddToCart}
              >
                <ShoppingBag size={20} />
                Add to Cart
              </Button>
              <Button
                className="w-full h-12 text-base font-medium gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleBuyNow}
              >
                <Package size={20} />
                Buy Now
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-20 border-t border-border">
          <div
            className={
              canReview === false
                ? "w-full"
                : "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20"
            }
          >
            {/* Write Review Form */}
            {canReview !== false && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Share Your Experience
                  </h2>
                  <p className="text-muted-foreground">
                    Help others make informed decisions by sharing your thoughts
                  </p>
                </div>
                <div className="space-y-6">
                  <WriteReview productId={product.id} />
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className={`space-y-8 ${canReview === false ? "w-full" : ""}`}>
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  Customer Reviews
                </h2>
                <p className="text-muted-foreground">
                  See what others think about this product
                </p>
              </div>

              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto pr-4">
                  {product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="pb-6 border-b border-border last:border-b-0"
                    >
                      <div className="flex gap-4">
                        <img
                          src={
                            review.user.image ||
                            "/placeholder.svg?height=40&width=40"
                          }
                          alt={`${review.user.firstName} ${review.user.lastName}`}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="font-semibold text-foreground">
                              {review.user.firstName} {review.user.lastName}
                            </p>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={`${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-border"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
