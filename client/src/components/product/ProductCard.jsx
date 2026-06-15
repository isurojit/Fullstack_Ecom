import { Heart, MessageCircle, ShoppingBag, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { addCartItem } from "../../features/cart/cartSlice";
import {
  addWishlistItem,
  removeWishlistItem,
  selectIsWishlisted,
} from "../../features/wishlist/wishlistSlice";
import { formatCurrency } from "../../utils/formatCurrency";
import { BRAND } from "../../utils/constants";

const getProductImage = (product) => {
  return (
    product?.images?.find((image) => image.isPrimary)?.url ||
    product?.images?.[0]?.url ||
    product?.image ||
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=90"
  );
};

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isWishlisted = useSelector((state) =>
    selectIsWishlisted(state, product._id),
  );

  const productUrl = `/products/${product.slug}`;

  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(
          ((product.comparePrice - product.price) / product.comparePrice) * 100,
        )
      : 0;

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();

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

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      if (isWishlisted) {
        await dispatch(removeWishlistItem(product._id)).unwrap();
        toast.success("Removed from wishlist");
      } else {
        await dispatch(addWishlistItem(product._id)).unwrap();
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(error || "Wishlist update failed");
    }
  };

  const handleWhatsAppEnquiry = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const phone = String(BRAND.phone || "").replace(/\D/g, "");
    const whatsappPhone = phone.startsWith("91") ? phone : `91${phone}`;

    const fullProductUrl = `${window.location.origin}${productUrl}`;

    const message = `Hello ${BRAND.displayName},

I am interested in this product:

Product: ${product.name}
SKU: ${product.sku || "N/A"}
Price: ${formatCurrency(product.price)}
Material: ${product.material || "N/A"}
Purity: ${product.purity || "N/A"}

Product Link:
${fullProductUrl}

Kindly share more details.`;

    window.open(
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-luxury">
      <Link
        to={productUrl}
        className="absolute inset-0 z-10"
        aria-label={`View ${product.name}`}
      />

      <div className="relative overflow-hidden rounded-[1.5rem] bg-vjj-ivory">
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
          {discount > 0 && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              {discount}% OFF
            </span>
          )}

          {product.isFeatured && (
            <span className="rounded-full bg-vjj-black px-3 py-1 text-xs font-bold text-vjj-champagne">
              Featured
            </span>
          )}

          {product.readyToShip && (
            <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white">
              Ready
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={handleWishlist}
            className={`grid h-10 w-10 place-items-center rounded-full shadow-sm transition ${
              isWishlisted
                ? "bg-red-600 text-white"
                : "bg-white text-vjj-black hover:bg-red-600 hover:text-white"
            }`}
            aria-label="Toggle wishlist"
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              navigate(productUrl);
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-vjj-black shadow-sm transition hover:bg-vjj-black hover:text-white"
            aria-label="View product"
          >
            <Eye size={18} />
          </button>
        </div>

        {product.stock <= 0 && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/45">
            <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-red-700">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="relative z-20 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-vjj-bronze">
            {product.category || "Jewellery"}
          </p>

          {product.sku && (
            <p className="text-[11px] font-semibold text-stone-400">
              {product.sku}
            </p>
          )}
        </div>

        <h3 className="line-clamp-2 min-h-[56px] font-serif text-2xl font-bold leading-tight text-vjj-black">
          {product.name}
        </h3>

        <div className="mt-3 flex items-end gap-2">
          <p className="font-serif text-2xl font-bold text-vjj-black">
            {formatCurrency(product.price)}
          </p>

          {product.comparePrice > product.price && (
            <p className="pb-0.5 text-sm font-semibold text-stone-400 line-through">
              {formatCurrency(product.comparePrice)}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
          {product.material && <span>{product.material}</span>}
          {product.purity && <span>· {product.purity}</span>}
          {product.stock > 0 && <span>· Stock: {product.stock}</span>}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-4 py-3 text-xs font-bold text-white transition hover:bg-vjj-bronze disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            <ShoppingBag size={16} />
            Add
          </button>

          <button
            type="button"
            onClick={handleWhatsAppEnquiry}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-green-600 bg-green-50 px-4 py-3 text-xs font-bold text-green-700 transition hover:bg-green-600 hover:text-white"
          >
            <MessageCircle size={16} />
            Enquire
          </button>
        </div>
      </div>
    </article>
  );
}
