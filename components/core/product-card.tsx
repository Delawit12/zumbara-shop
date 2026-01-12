"use client";

import {
  Star,
  StarHalf,
  Star as StarOutline,
  ShoppingCart,
  ShoppingBag,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { addToCart } from "@/utils/api/cart";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useIsAuthenticated } from "@/stores/user-store";

export type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  image?: string;
  averageRating?: number;
  category?: string;
  description?: string;
  discountPrice?: number;
};

export const ProductCard = ({
  id,
  name,
  price,
  image,
  averageRating = 0,
  category,
  description,
  discountPrice,
}: ProductCardProps) => {
  console.log(name);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(discountPrice || price);

  const originalPrice = discountPrice
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ETB",
      }).format(price)
    : null;

  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  const handleAddToCart = async () => {
    try {
      await addToCart({ productId: id, quantity: 1 });
      toast.success("Product added to cart");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      const query = new URLSearchParams({ productId: id });
      router.push(`/auth/login?redirect=/checkout?${query.toString()}`);
      return;
    }

    const queryParams = new URLSearchParams({ productId: id });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
      {/* IMAGE */}
      <Link href={`/shop/${id}`} className="no-underline">
        <div className="relative w-full h-44 overflow-hidden group">
          <img
            src={image || "https://via.placeholder.com/150"}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        {/* CONTENT */}
        <div className="p-4 flex flex-col flex-1 text-left justify-start">
          <div className="flex justify-between">
            {/* TITLE */}
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 truncate text-left">
              {name}
            </h2>

            {/* Cart Icon */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100
                 transition-transform duration-200 hover:scale-110"
              title="Add to cart"
            >
              <ShoppingCart className="w-7 h-7 text-primary/100" />
            </button>
          </div>

          {/* CATEGORY */}
          {category && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left">
              {category}
            </p>
          )}

          {/* PRICE */}
          <div className="flex items-center gap-2 justify-between mt-1 text-left">
            <p
              className={`text-sm font-bold ${
                discountPrice
                  ? "text-red-600"
                  : "text-zinc-800 dark:text-zinc-100"
              }`}
            >
              {formattedPrice}
            </p>
            {originalPrice && (
              <p className="text-xs text-gray-400 line-through">
                {originalPrice}
              </p>
            )}
          </div>

          {/* ⭐ averageRating */}
          <div className="flex items-center gap-1 mt-2 text-left">
            {Array.from({ length: fullStars }).map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 fill-yellow-400 text-yellow-400"
              />
            ))}
            {hasHalfStar && (
              <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            )}
            {Array.from({ length: emptyStars }).map((_, i) => (
              <StarOutline key={i} className="w-4 h-4 text-gray-300" />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {averageRating.toFixed(1)}
            </span>
          </div>

          {/* DESCRIPTION */}
          {description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 text-left">
              {description}
            </p>
          )}
        </div>
      </Link>
      {/* BUTTON */}
      <div className="p-4 pt-0 flex flex-col gap-2">
        {/* <Button
          onClick={handleAddToCart}
          variant="default"
          className="w-full flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Cart
        </Button> */}

        <Button
          onClick={handleBuyNow}
          variant="secondary" // define secondary style in your button component
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Package className="w-4 h-4" />
          Buy Now
        </Button>
      </div>
    </div>
  );
};
