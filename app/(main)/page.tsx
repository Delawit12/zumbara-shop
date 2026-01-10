"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PromotionSection } from "@/components/core/promotion";
import { CategoryList, Category } from "@/components/core/categories";
import { getCategories } from "@/utils/api/categories";
import { getProducts } from "@/utils/api/products";
import { ShieldCheck, Star, Tag, Truck } from "lucide-react";
import { ProductCard } from "@/components/core/product-card";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<
    string | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 8;

  /** Fetch categories */
  const fetchCategories = useCallback(async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("❌ Failed to load categories:", err);
    }
  }, []);

  /** Fetch products (optionally filtered by category) */
  const fetchProducts = useCallback(
    async (categorySlug?: string, pageParam = 1) => {
      try {
        if (pageParam === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await getProducts({
          sort: "NEWEST",
          page: pageParam,
          pageSize: PAGE_SIZE,
          variant: true,
          categorySlug,
        });

        const items = Array.isArray(res) ? res : res?.data || [];

        if (pageParam === 1) setProducts(items);
        else setProducts((prev) => [...prev, ...items]);

        setHasMore(items.length === PAGE_SIZE);
        setPage(pageParam);
        setSelectedCategorySlug(categorySlug);
      } catch (err) {
        console.error("❌ Failed to load products:", err);
        if (pageParam === 1) setProducts([]);
      } finally {
        if (pageParam === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCategories();
    fetchProducts(undefined, 1);
  }, [fetchCategories, fetchProducts]);

  /** Infinite scroll - load more when reaching bottom */
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchProducts(selectedCategorySlug, page + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, fetchProducts, selectedCategorySlug, page]
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] text-center">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-16 pb-12 space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Shop Smarter with <span className="text-primary">Zumbara</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
          Discover the latest trends, top sellers, and amazing deals — all in
          one place.
        </p>

        <div className="w-full max-w-4xl mt-6">
          <PromotionSection />
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-6 mt-4">
          <Button asChild size="lg" className="px-10 py-3 rounded-xl">
            <Link href="/shop">Start Shopping</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="px-10 py-3 rounded-xl border-primary text-primary hover:bg-primary/10"
          >
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </section>
      {/* Feature Highlights */}
      <section className="px-2 md:px-0 py-12 border-t border-b">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: <Truck className="h-10 w-10 text-primary mx-auto" />,
              title: "Fast Delivery",
              desc: "Receive orders on time, every time.",
            },
            {
              icon: <ShieldCheck className="h-10 w-10 text-primary mx-auto" />,
              title: "Secure Payments",
              desc: "Your data and payments are safe.",
            },
            {
              icon: <Tag className="h-10 w-10 text-primary mx-auto" />,
              title: "Best Prices",
              desc: "Quality items at unbeatable prices.",
            },
            {
              icon: <Star className="h-10 w-10 text-primary mx-auto" />,
              title: "Top Reviews",
              desc: "Trusted by thousands of happy customers.",
            },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              {f.icon} <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Categories */}
      <section className="py-4">
        <CategoryList
          categories={categories}
          onCategorySelect={(slug) => fetchProducts(slug)}
          // onBack={() => fetchProducts()}
        />
      </section>
      {/* Featured Products */}
      <section className="py-16 border-t w-full">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-left mx-auto">
          {selectedCategorySlug ? "Products" : "Featured Products"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">No products found</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto">
            {products.map((product: any, index: number) => {
              const isLast = index === products.length - 1;
              return (
                <div
                  key={product.id}
                  ref={isLast ? lastProductRef : null} // observe the last item
                >
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.name}
                    price={product.price}
                    image={product.image}
                    averageRating={product.averageRating}
                    category={product.categorySlug}
                    description={product.description}
                    discountPrice={product.discountPrice} // if available
                  />
                </div>
              );
            })}
          </div>
        )}
        {loadingMore && (
          <div className="flex justify-center mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl mx-2" />
            ))}
          </div>
        )}
        {/* Load more button */}
        {/* {!loading && products.length > 0 && (
          <div className="mt-8 flex justify-center">
            {hasMore ? (
              <Button
                onClick={() => fetchProducts(selectedCategorySlug, page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </Button>
            ) : (
              products.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  No more products
                </p>
              )
            )}
          </div>
        )} */}
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to find your next favorite item?
          </h2>
          <p className="text-muted-foreground">
            Join Zumbara today and enjoy personalized deals, wishlist tracking,
            and fast checkout.
          </p>
          <Button asChild size="lg" className="px-12 py-3 rounded-xl">
            <Link href="/register">Join Now</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
