// app/checkout/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useIsAuthenticated } from "@/stores/user-store";

import { getCart } from "@/utils/api/cart";
import { getProductById } from "@/utils/api/products";
import { createOrder } from "@/utils/api/order";
import { formatETB } from "@/utils/formatter";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

// THIS IS THE ONLY CORRECT WAY — NO FUNCTION, NO REVALIDATE FUNCTION
export const dynamic = "force-dynamic";
// DO NOT USE: export const revalidate = 0; → IT'S A FUNCTION IN SOME VERSIONS!
// JUST USE dynamic = "force-dynamic" → THAT'S ENOUGH

// Your full checkout logic — unchanged
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const cartId = searchParams.get("cartId");
  const productId = searchParams.get("productId");
  const variantId = searchParams.get("variantId");
  const quantityParam = searchParams.get("quantity");
  const quantityFromQuery = quantityParam
    ? parseInt(quantityParam, 10)
    : undefined;

  const isAuthenticated = useIsAuthenticated();

  const [loading, setLoading] = useState(true);
  const [checkoutItem, setCheckoutItem] = useState<any>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const placeOrder = async () => {
    try {
      // Redirect to login if user is not authenticated
      if (!isAuthenticated) {
        // preserve current checkout query so user can continue
        const query = new URLSearchParams();
        if (cartId) query.set("cartId", cartId);
        if (productId) query.set("productId", productId);
        if (variantId) query.set("variantId", variantId);
        router.push(`/auth/login?redirect=/checkout?${query.toString()}`);
        return;
      }

      setPlacingOrder(true);
      let result;

      if (cartId) {
        result = await createOrder({ cartId });
        // router.push(`/orders/${result.id}`);
      } else {
        result = await createOrder({
          productId: checkoutItem.product.id,
          variantId: checkoutItem.variant?.id,
          quantity: checkoutItem.quantity,
        });
        // router.push(`/orders/${result.id}`);
      }

      setCreatedOrderId(result.id);
      setOrderSuccess(true);
    } catch (err: any) {
      alert(err.message || "Order failed");
    } finally {
      setPlacingOrder(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (cartId) {
          const data = await getCart();
          setCheckoutItem({
            type: "cart",
            items: data.items,
            total: data.items.reduce(
              (sum: number, item: any) =>
                sum +
                (item.variant ? item.variant.price : item.product.price) *
                  item.quantity,
              0
            ),
          });
        } else if (productId) {
          const product = await getProductById(productId);
          const variant = variantId
            ? product.variants.find((v: any) => v.id === variantId)
            : null;
          const price = variant ? variant.price : product.price;

          const qty =
            quantityFromQuery &&
            Number.isFinite(quantityFromQuery) &&
            quantityFromQuery > 0
              ? quantityFromQuery
              : 1;
          setCheckoutItem({
            type: "single",
            product,
            variant,
            quantity: qty,
            total: price * qty,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [cartId, productId, variantId]);

  if (loading)
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-lg">
        Loading checkout...
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      {checkoutItem.type === "cart" &&
        checkoutItem.items.map((item: any) => {
          const price = item.variant ? item.variant.price : item.product.price;
          const total = price * item.quantity;

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 py-3 border-b"
            >
              <img
                src={item.product.image || "/placeholder.png"}
                width={70}
                height={70}
                alt={item.product.name}
                className="rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatETB(price)} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatETB(total)}</p>
            </div>
          );
        })}

      {checkoutItem.type === "single" && (
        <div className="flex gap-4 border-b py-4">
          <img
            src={checkoutItem.product.image || "/placeholder.png"}
            width={90}
            height={90}
            alt={checkoutItem.product.name}
            className="rounded object-cover"
          />
          <div className="flex-1">
            <p className="font-medium">{checkoutItem.product.name}</p>
            {checkoutItem.variant && (
              <p className="text-sm text-muted-foreground">
                {checkoutItem.variant.name}
              </p>
            )}
            <div className="mt-2">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {formatETB(
                    checkoutItem.variant
                      ? checkoutItem.variant.price
                      : checkoutItem.product.price
                  )}
                </p>
                <div className="flex items-center border rounded px-2">
                  <button
                    className="px-2"
                    onClick={() =>
                      setCheckoutItem((prev: any) => {
                        const qty = Math.max(1, prev.quantity - 1);
                        const price = prev.variant
                          ? prev.variant.price
                          : prev.product.price;
                        return { ...prev, quantity: qty, total: price * qty };
                      })
                    }
                  >
                    -
                  </button>
                  <span className="px-3">{checkoutItem.quantity}</span>
                  <button
                    className="px-2"
                    onClick={() =>
                      setCheckoutItem((prev: any) => {
                        const qty = prev.quantity + 1;
                        const price = prev.variant
                          ? prev.variant.price
                          : prev.product.price;
                        return { ...prev, quantity: qty, total: price * qty };
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="font-semibold mt-1">
                {formatETB(checkoutItem.total)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between py-4 text-lg font-semibold border-t mt-6">
        <span>Total</span>
        <span className="text-primary">{formatETB(checkoutItem.total)}</span>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Please send a text message to{" "}
        <span className="font-medium">+251905561888</span> before placing your
        order.
      </div>

      <Button
        className="w-full mt-4"
        size="lg"
        disabled={placingOrder}
        onClick={placeOrder}
      >
        {placingOrder ? "Placing Order..." : "Place Order"}
      </Button>

      {orderSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full text-center space-y-4 shadow-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />

            <h2 className="text-xl font-semibold">Order Placed Successfully</h2>

            <p className="text-sm text-muted-foreground">
              Your order has been placed Successfully. Our delivery team will
              contact you shortly to confirm and deliver your items.
            </p>

            <div className="flex flex-col gap-3 mt-4">
              <Button className="w-full" onClick={() => router.push("/shop")}>
                Continue Shopping
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/orders")}
              >
                My Orders
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// THIS IS THE ONLY SUSPENSE WRAPPER YOU NEED
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
