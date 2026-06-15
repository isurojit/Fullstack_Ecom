import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  removeCartItem,
  updateCartItem,
  clearServerCart,
} from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatCurrency";

const getCartItems = (cart) => {
  if (Array.isArray(cart?.items)) return cart.items;
  if (Array.isArray(cart)) return cart;
  return [];
};

const getProduct = (item) => item.product || item;

const getItemProductId = (item) => {
  const product = getProduct(item);
  return item.productId || product?._id || item._id;
};

const getProductImage = (product) => {
  return (
    product?.images?.find((image) => image.isPrimary)?.url ||
    product?.images?.[0]?.url ||
    product?.image ||
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=90"
  );
};

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    cart,
    items: fallbackItems,
    loading,
  } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const items = getCartItems(cart).length
    ? getCartItems(cart)
    : fallbackItems || [];

  const subtotal = items.reduce((sum, item) => {
    const product = getProduct(item);
    const price = Number(item.price || product?.price || 0);
    const quantity = Number(item.quantity || 1);

    return sum + price * quantity;
  }, 0);

  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  const handleQuantityChange = async (item, nextQuantity) => {
    if (nextQuantity < 1) return;

    const product = getProduct(item);
    const productId = getItemProductId(item);

    if (product?.stock && nextQuantity > product.stock) {
      toast.error(`Only ${product.stock} item available`);
      return;
    }

    try {
      await dispatch(
        updateCartItem({
          productId,
          quantity: nextQuantity,
          selectedSize: item.selectedSize || "",
          selectedMaterial: item.selectedMaterial || "",
        }),
      ).unwrap();
    } catch (error) {
      toast.error(error || "Unable to update cart");
    }
  };

  const handleRemove = async (item) => {
    const productId = getItemProductId(item);

    try {
      await dispatch(
        removeCartItem({
          productId,
          selectedSize: item.selectedSize || "",
          selectedMaterial: item.selectedMaterial || "",
        }),
      ).unwrap();

      toast.success("Removed from cart");
    } catch (error) {
      toast.error(error || "Unable to remove item");
    }
  };

  const handleClearCart = async () => {
    if (!items.length) return;

    try {
      await dispatch(clearServerCart()).unwrap();
      toast.success("Cart cleared");
    } catch (error) {
      toast.error(error || "Unable to clear cart");
    }
  };

  const handleCheckout = () => {
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!user) {
      sessionStorage.setItem("vjj_redirect_after_login", "/checkout");
      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });
      return;
    }

    navigate("/checkout");
  };

  if (!items.length) {
    return (
      <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-black/10 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
              <ShoppingBag size={34} />
            </div>

            <h1 className="mt-6 font-serif text-5xl font-bold text-vjj-black">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-stone-600">
              Explore our jewellery collection and add your favourite products
              to cart.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-7 py-3 text-sm font-bold text-white transition hover:bg-vjj-bronze"
              >
                Start Shopping
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/wishlist"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-vjj-ivory px-7 py-3 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
              >
                View Wishlist
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] bg-vjj-black p-6 text-white shadow-luxury md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-vjj-champagne">
            Shopping Cart
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-serif text-5xl font-bold md:text-6xl">
                Your Cart
              </h1>

              <p className="mt-4 max-w-2xl text-stone-300">
                Review your selected jewellery before proceeding to checkout.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-champagne px-6 py-3 text-sm font-bold text-vjj-black transition hover:bg-vjj-gold"
            >
              Continue Shopping
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_390px]">
          <main className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="font-serif text-3xl font-bold text-vjj-black">
                  Cart Items
                </h2>
                <p className="text-sm text-stone-600">
                  {items.length} {items.length === 1 ? "item" : "items"} added
                  to your cart.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearCart}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={16} />
                Clear Cart
              </button>
            </div>

            <div className="grid gap-4">
              {items.map((item, index) => {
                const product = getProduct(item);
                const productId = getItemProductId(item);
                const quantity = Number(item.quantity || 1);
                const price = Number(item.price || product?.price || 0);
                const itemTotal = price * quantity;

                return (
                  <div
                    key={`${productId}-${item.selectedSize || ""}-${
                      item.selectedMaterial || ""
                    }-${index}`}
                    className="rounded-3xl border border-black/10 bg-vjj-ivory p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row">
                      <Link
                        to={`/products/${product?.slug}`}
                        className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-white md:h-36 md:w-36"
                      >
                        <img
                          src={getProductImage(product)}
                          alt={product?.name || "Product"}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row">
                          <div>
                            <Link
                              to={`/products/${product?.slug}`}
                              className="font-serif text-2xl font-bold text-vjj-black hover:text-vjj-bronze"
                            >
                              {product?.name || item.name || "Product"}
                            </Link>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                              {product?.sku && <span>SKU: {product.sku}</span>}
                              {item.selectedSize && (
                                <span>· Size: {item.selectedSize}</span>
                              )}
                              {item.selectedMaterial && (
                                <span>· {item.selectedMaterial}</span>
                              )}
                              {product?.purity && (
                                <span>· {product.purity}</span>
                              )}
                            </div>

                            <p className="mt-3 font-serif text-2xl font-bold text-vjj-black">
                              {formatCurrency(price)}
                            </p>
                          </div>

                          <div className="text-left lg:text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                              Item Total
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-vjj-black">
                              {formatCurrency(itemTotal)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(item, quantity - 1)
                              }
                              className="grid h-10 w-10 place-items-center rounded-full bg-vjj-ivory text-vjj-black transition hover:bg-vjj-black hover:text-white"
                            >
                              <Minus size={16} />
                            </button>

                            <span className="grid h-10 w-14 place-items-center text-sm font-bold">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(item, quantity + 1)
                              }
                              className="grid h-10 w-10 place-items-center rounded-full bg-vjj-ivory text-vjj-black transition hover:bg-vjj-black hover:text-white"
                            >
                              <Plus size={16} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-vjj-black">
                Order Summary
              </h2>

              <div className="mt-5 space-y-4">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryRow
                  label="Shipping"
                  value={shipping === 0 ? "Free" : formatCurrency(shipping)}
                />
                <SummaryRow label="Items" value={items.length} />

                <div className="border-t border-black/10 pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(total)}
                    bold
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-vjj-black px-6 py-4 text-sm font-bold text-white transition hover:bg-vjj-bronze disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                Proceed to Checkout
                <ArrowRight size={17} />
              </button>

              {!user && (
                <p className="mt-3 text-center text-xs text-stone-500">
                  You will be asked to login before placing the order.
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              <TrustCard
                icon={<Truck />}
                title="Delivery Support"
                text="Store team will coordinate order delivery."
              />

              <TrustCard
                icon={<ShieldCheck />}
                title="Trusted Jewellery"
                text="Carefully selected products from Verma ji jewellers."
              />

              <TrustCard
                icon={<CreditCard />}
                title="Secure Checkout"
                text="Simple checkout with order confirmation."
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`${
          bold
            ? "font-serif text-2xl font-bold text-vjj-black"
            : "text-sm text-stone-600"
        }`}
      >
        {label}
      </span>

      <span
        className={`${
          bold
            ? "font-serif text-2xl font-bold text-vjj-black"
            : "text-sm font-bold text-vjj-black"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TrustCard({ icon, title, text }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
          {icon}
        </div>

        <div>
          <p className="font-bold text-vjj-black">{title}</p>
          <p className="mt-1 text-sm text-stone-600">{text}</p>
        </div>
      </div>
    </div>
  );
}
