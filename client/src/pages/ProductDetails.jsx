import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import {
  clearSelectedProduct,
  fetchProductBySlug,
} from "../features/products/productSlice";

import {
  addCartItem,
  addGuestCartItem,
  openCart,
} from "../features/cart/cartSlice";

import {
  addGuestWishlistItem,
  addWishlistItem,
  removeGuestWishlistItem,
  removeWishlistItem,
  selectIsWishlisted,
} from "../features/wishlist/wishlistSlice";

import { formatCurrency } from "../utils/formatCurrency";
import { BRAND } from "../utils/constants";

export default function ProductDetails() {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const {
    selectedProduct: product,
    loading,
    error,
  } = useSelector((state) => state.products);

  const { user } = useSelector((state) => state.auth);

  const isWishlisted = useSelector(
    selectIsWishlisted(product?._id || "no-product"),
  );

  const [activeImage, setActiveImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [openSections, setOpenSections] = useState({
    details: true,
    description: true,
    care: false,
  });

  useEffect(() => {
    dispatch(fetchProductBySlug(slug));

    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [slug, dispatch]);

  useEffect(() => {
    if (product) {
      const primaryImage =
        product.images?.find((image) => image.isPrimary)?.url ||
        product.images?.[0]?.url ||
        "";

      setActiveImage(primaryImage);
      setSelectedSize(product.sizes?.[0] || "");
      setQuantity(1);
    }
  }, [product]);

  const productImages = useMemo(() => {
    const images = product?.images?.slice(0, 4) || [];

    if (images.length > 0) return images;

    return [
      {
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=90",
        alt: product?.name || "Product",
        isPrimary: true,
      },
    ];
  }, [product]);

  const primaryImage =
    activeImage || productImages[0]?.url || product?.images?.[0]?.url || "";

  const fallbackSpecificationGroups = useMemo(() => {
    if (!product) return [];

    return [
      {
        title: "Metal Details",
        rows: [
          { label: "Metal", value: product.material },
          { label: "Purity", value: product.purity },
          { label: "Material Colour", value: product.materialColor },
          { label: "Gross Weight", value: product.grossWeight },
          { label: "Net Weight", value: product.netWeight },
        ].filter((row) => row.value),
      },
      {
        title: "General Details",
        rows: [
          { label: "Jewellery Type", value: product.category },
          { label: "Product Type", value: product.productType },
          { label: "Brand", value: BRAND.displayName },
          { label: "Collection", value: product.productCollection },
          { label: "Gender", value: product.gender },
          { label: "Occasion", value: product.occasion },
        ].filter((row) => row.value),
      },
      {
        title: "Product Details",
        rows: [
          { label: "SKU ID", value: product.sku },
          {
            label: "Stock",
            value: product.stock > 0 ? "In Stock" : "Out of Stock",
          },
          {
            label: "Ready to Ship",
            value: product.isReadyToShip ? "Yes" : "No",
          },
          { label: "Featured", value: product.isFeatured ? "Yes" : "No" },
        ].filter((row) => row.value),
      },
    ].filter((group) => group.rows.length > 0);
  }, [product]);

  const specificationGroups =
    product?.specificationGroups?.filter((group) => group.rows?.length > 0)
      ?.length > 0
      ? product.specificationGroups
      : fallbackSpecificationGroups;

  const highlights =
    product?.highlights?.filter(Boolean)?.length > 0
      ? product.highlights
      : [
          "Elegant jewellery crafted for everyday and occasion wear.",
          "Premium finish with carefully verified product details.",
          "Secure packaging and order support after confirmation.",
        ];

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleQuantityChange = (type) => {
    if (type === "minus") {
      setQuantity((prev) => Math.max(1, prev - 1));
      return;
    }

    setQuantity((prev) => Math.min(product.stock || 1, prev + 1));
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const payload = {
      productId: product._id,
      quantity,
      selectedSize,
      selectedMaterial: product.material,
    };

    if (user) {
      const result = await dispatch(addCartItem(payload));

      if (addCartItem.fulfilled.match(result)) {
        toast.success("Added to cart");
        dispatch(openCart());
      } else {
        toast.error(result.payload || "Unable to add item");
      }
    } else {
      dispatch(
        addGuestCartItem({
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: primaryImage,
          price: product.price,
          quantity,
          selectedSize,
          selectedMaterial: product.material,
          stock: product.stock,
        }),
      );

      dispatch(openCart());
      toast.success("Added to cart");
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    if (user) {
      if (isWishlisted) {
        const result = await dispatch(removeWishlistItem(product._id));

        if (removeWishlistItem.fulfilled.match(result)) {
          toast.success("Removed from wishlist");
        } else {
          toast.error(result.payload || "Unable to remove from wishlist");
        }
      } else {
        const result = await dispatch(addWishlistItem(product._id));

        if (addWishlistItem.fulfilled.match(result)) {
          toast.success("Added to wishlist");
        } else {
          toast.error(result.payload || "Unable to add to wishlist");
        }
      }
    } else {
      if (isWishlisted) {
        dispatch(removeGuestWishlistItem(product._id));
        toast.success("Removed from wishlist");
      } else {
        dispatch(addGuestWishlistItem(product));
        toast.success("Added to wishlist");
      }
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-vjj-ivory px-5 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="h-[720px] animate-pulse rounded-[2.5rem] bg-white" />
          <div className="h-[720px] animate-pulse rounded-[2.5rem] bg-white" />
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="mx-auto min-h-screen max-w-4xl bg-vjj-ivory px-5 py-20 text-center">
        <h1 className="font-serif text-5xl font-bold">Product not found</h1>
        <p className="mt-4 text-red-600">{error}</p>
        <Link
          to="/products"
          className="mt-8 inline-flex rounded-full bg-vjj-black px-8 py-3 text-sm font-bold text-white"
        >
          Back to Products
        </Link>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#fbf7ef]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-5 md:py-12">
        <div className="mb-6 text-sm text-stone-500">
          <Link to="/" className="hover:text-vjj-bronze">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/products" className="hover:text-vjj-bronze">
            Jewellery
          </Link>{" "}
          / <span className="text-vjj-black">{product.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="grid gap-4 md:grid-cols-[96px_1fr]">
              <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
                {productImages.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(image.url)}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-white p-1 transition md:h-24 md:w-24 ${
                      primaryImage === image.url
                        ? "border-vjj-gold shadow-glow"
                        : "border-black/10 hover:border-vjj-bronze"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  </button>
                ))}
              </div>

              <motion.div
                key={primaryImage}
                initial={{ opacity: 0.4, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="order-1 overflow-hidden rounded-[2.2rem] border border-black/10 bg-white p-3 shadow-luxury md:order-2"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-white via-amber-50 to-stone-100">
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="h-full w-full object-cover object-center"
                  />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {product.isReadyToShip && (
                      <span className="rounded-full bg-vjj-black/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-vjj-champagne backdrop-blur">
                        Ready
                      </span>
                    )}

                    {product.isFeatured && (
                      <span className="rounded-full bg-vjj-champagne px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-vjj-black">
                        Signature
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Assurance
                icon={<ShieldCheck size={20} />}
                text="Purity Assured"
              />
              <Assurance icon={<Truck size={20} />} text="Secure Delivery" />
              <Assurance icon={<RotateCcw size={20} />} text="Easy Support" />
            </div>
          </div>

          <div>
            <div className="rounded-[2.2rem] border border-black/10 bg-white p-5 shadow-sm md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-vjj-bronze">
                    {product.category}
                  </p>

                  <h1 className="mt-3 font-serif text-4xl font-bold leading-tight text-vjj-black md:text-5xl">
                    {product.name}
                  </h1>

                  <p className="mt-3 text-sm text-stone-500">
                    SKU ID: <span className="font-semibold">{product.sku}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-black/10 bg-white text-vjj-black hover:bg-vjj-ivory"
                  }`}
                >
                  <Heart
                    size={20}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <div className="mt-7 rounded-[1.6rem] bg-vjj-ivory p-5">
                <div className="flex flex-wrap items-end gap-4">
                  <p className="text-4xl font-bold text-vjj-black">
                    {formatCurrency(product.price)}
                  </p>

                  {product.compareAtPrice > product.price && (
                    <p className="pb-1 text-lg text-stone-400 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </p>
                  )}
                </div>

                <p className="mt-2 text-sm text-stone-500">
                  Price inclusive of taxes. Final billing may vary depending on
                  product weight and confirmation.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <MiniSpec label="Metal" value={product.material} />
                <MiniSpec label="Purity" value={product.purity} />
                <MiniSpec
                  label="Availability"
                  value={product.stock > 0 ? "In Stock" : "Out of Stock"}
                />
                <MiniSpec
                  label="Delivery"
                  value={
                    product.isReadyToShip ? "Ready to Ship" : "On Confirmation"
                  }
                />
              </div>

              {product.sizes?.length > 0 && (
                <div className="mt-7">
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-vjj-bronze">
                    Select Size
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                          selectedSize === size
                            ? "border-vjj-black bg-vjj-black text-white"
                            : "border-black/10 bg-white hover:border-vjj-gold"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-vjj-bronze">
                  Quantity
                </p>

                <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("minus")}
                    className="grid h-10 w-10 place-items-center rounded-full hover:bg-vjj-ivory"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="grid h-10 w-12 place-items-center font-bold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleQuantityChange("plus")}
                    className="grid h-10 w-10 place-items-center rounded-full hover:bg-vjj-ivory"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-vjj-black px-8 py-4 text-sm font-bold text-white shadow-luxury transition hover:bg-vjj-bronze disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingBag size={18} />
                  Add to Cart
                </button>

                <Link
                  to="/checkout"
                  onClick={handleAddToCart}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-vjj-bronze bg-vjj-champagne px-8 py-4 text-sm font-bold text-vjj-black transition hover:bg-vjj-gold"
                >
                  Buy Now
                </Link>
              </div>

              <div className="mt-7 grid gap-3">
                {highlights.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl border border-black/10 bg-white p-4"
                  >
                    <BadgeCheck
                      className="shrink-0 text-vjj-bronze"
                      size={20}
                    />
                    <p className="text-sm leading-6 text-stone-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Accordion
                title="Jewellery Details"
                open={openSections.details}
                onClick={() => toggleSection("details")}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {specificationGroups.map((group, index) => (
                    <div
                      key={`${group.title}-${index}`}
                      className="rounded-2xl border border-black/10 bg-vjj-ivory p-5"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <Sparkles className="text-vjj-bronze" size={18} />
                        <h3 className="font-serif text-2xl font-bold text-vjj-black">
                          {group.title}
                        </h3>
                      </div>

                      <div className="divide-y divide-black/10">
                        {group.rows?.map((row, rowIndex) => (
                          <div
                            key={`${row.label}-${rowIndex}`}
                            className="grid grid-cols-[0.9fr_1.1fr] gap-4 py-3 text-sm"
                          >
                            <p className="text-stone-500">{row.label}</p>
                            <p className="font-semibold text-vjj-black">
                              {row.value || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>

              <Accordion
                title="Description"
                open={openSections.description}
                onClick={() => toggleSection("description")}
              >
                <div className="rounded-2xl bg-vjj-ivory p-5">
                  <p className="whitespace-pre-line text-base leading-8 text-stone-700">
                    {product.longDescription || product.description}
                  </p>
                </div>
              </Accordion>

              <Accordion
                title="Care Instructions"
                open={openSections.care}
                onClick={() => toggleSection("care")}
              >
                <div className="rounded-2xl bg-vjj-ivory p-5">
                  <p className="whitespace-pre-line text-base leading-8 text-stone-700">
                    {product.careInstructions ||
                      "Store jewellery in a dry place. Avoid contact with perfume, water and chemicals. Clean gently with a soft cloth."}
                  </p>
                </div>
              </Accordion>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-[2.2rem] border border-black/10 bg-vjj-black p-8 text-white shadow-luxury">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-vjj-champagne">
            VJJ Assurance
          </p>

          <h2 className="mt-3 font-serif text-4xl font-bold">
            Crafted with trust, packed with care.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <DarkAssurance title="Purity" text="Verified jewellery details" />
            <DarkAssurance title="Support" text={`Call ${BRAND.phone}`} />
            <DarkAssurance title="Delivery" text="Safe packaging support" />
            <DarkAssurance
              title="Maintenance"
              text="Cleaning guidance available"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniSpec({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 font-semibold text-vjj-black">{value || "-"}</p>
    </div>
  );
}

function Assurance({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-vjj-black shadow-sm">
      <span className="text-vjj-bronze">{icon}</span>
      {text}
    </div>
  );
}

function DarkAssurance({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="font-serif text-2xl font-bold text-vjj-champagne">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-300">{text}</p>
    </div>
  );
}

function Accordion({ title, open, onClick, children }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <h2 className="font-serif text-3xl font-bold text-vjj-black">
          {title}
        </h2>

        <span className="grid h-10 w-10 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>

      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
