import { useEffect } from "react";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import ProductCard from "../components/product/ProductCard";
import {
  fetchWishlist,
  removeWishlistItem,
  selectWishlistItems,
} from "../features/wishlist/wishlistSlice";
import { addCartItem } from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatCurrency";

const getProductImage = (product) => {
  return (
    product?.images?.find((image) => image.isPrimary)?.url ||
    product?.images?.[0]?.url ||
    product?.image ||
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=90"
  );
};

export default function Wishlist() {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const items = useSelector(selectWishlistItems);
  const { loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, user]);

  const handleRemove = async (productId) => {
    try {
      await dispatch(removeWishlistItem(productId)).unwrap();
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(error || "Unable to remove item");
    }
  };

  const handleAddToCart = async (product) => {
    if (product.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    try {
      await dispatch(
        addCartItem({
          productId: product._id,
          quantity: 1,
          selectedSize: product.sizes?.[0] || "",
          selectedMaterial: product.material || "",
        }),
      ).unwrap();

      toast.success("Added to cart");
    } catch (error) {
      toast.error(error || "Unable to add to cart");
    }
  };

  return (
    <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[2rem] bg-vjj-black p-6 text-white shadow-luxury md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-vjj-champagne">
            My Wishlist
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-serif text-5xl font-bold md:text-6xl">
                Saved Jewellery
              </h1>

              <p className="mt-4 max-w-2xl text-stone-300">
                Keep your favourite jewellery pieces saved and add them to cart
                whenever you are ready.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-champagne px-6 py-3 text-sm font-bold text-vjj-black transition hover:bg-vjj-gold"
            >
              Explore More
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        {loading ? (
          <WishlistSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-[2rem] border border-black/10 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
              <Heart size={34} />
            </div>

            <h2 className="mt-6 font-serif text-4xl font-bold text-vjj-black">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-stone-600">
              Tap the heart icon on any product to save it here. Your favourite
              jewellery collection will appear on this page.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-7 py-3 text-sm font-bold text-white transition hover:bg-vjj-bronze"
              >
                <ShoppingBag size={17} />
                Start Shopping
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-vjj-ivory px-7 py-3 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
              >
                Back Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col justify-between gap-4 rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm md:flex-row md:items-center">
              <div>
                <p className="font-serif text-2xl font-bold text-vjj-black">
                  {items.length} Saved {items.length === 1 ? "Item" : "Items"}
                </p>

                <p className="text-sm text-stone-600">
                  Add saved items to cart or remove items you no longer need.
                </p>
              </div>

              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-vjj-bronze"
              >
                Continue Shopping
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
              <main>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </main>

              <aside className="xl:sticky xl:top-28 xl:self-start">
                <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
                  <h2 className="font-serif text-3xl font-bold text-vjj-black">
                    Wishlist Summary
                  </h2>

                  <div className="mt-5 space-y-4">
                    {items.slice(0, 4).map((product) => (
                      <div
                        key={product._id}
                        className="flex gap-3 rounded-2xl bg-vjj-ivory p-3"
                      >
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-bold text-vjj-black">
                            {product.name}
                          </p>

                          <p className="mt-1 text-sm font-bold text-vjj-bronze">
                            {formatCurrency(product.price)}
                          </p>

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              className="rounded-full bg-vjj-black px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-vjj-bronze"
                            >
                              Add
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemove(product._id)}
                              className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length > 4 && (
                    <p className="mt-4 text-center text-sm text-stone-500">
                      +{items.length - 4} more saved items
                    </p>
                  )}

                  <Link
                    to="/cart"
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-vjj-champagne px-6 py-3 text-sm font-bold text-vjj-black transition hover:bg-vjj-gold"
                  >
                    Go to Cart
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function WishlistSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-[430px] animate-pulse rounded-[2rem] bg-white"
        />
      ))}
    </div>
  );
}
