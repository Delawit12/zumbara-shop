"use client";

import { useEffect, useRef } from "react";
import { ProductCard, type ProductCardProps } from "./product-card";
import { Button } from "@/components/ui/button";

interface ProductsGridProps {
  products: ProductCardProps[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const ProductsGrid = ({
  products,
  isLoading = false,
  isLoadingMore = false,
  onLoadMore,
  hasMore = false,
}: ProductsGridProps) => {
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "200px", // preload earlier (smooth UX)
      }
    );

    const current = observerRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-xl h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">
            No products found
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {hasMore && (
        <div
          ref={observerRef}
          className="h-10 flex items-center justify-center"
        >
          {isLoadingMore && (
            <span className="text-sm text-muted-foreground">
              Loading more products…
            </span>
          )}
        </div>
      )}

      {/* {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-8"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )} */}
    </div>
  );
};
