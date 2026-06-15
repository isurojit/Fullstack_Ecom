import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Home,
  IndianRupee,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import { clearServerCart } from "../features/cart/cartSlice";
import { formatCurrency } from "../utils/formatCurrency";

const getCartItems = (cart) => {
  if (Array.isArray(cart?.items)) return cart.items;
  if (Array.isArray(cart)) return cart;
  return [];
};

const getProduct = (item) => item.product || item;

const getProductImage = (product) => {
  return (
    product?.images?.find((image) => image.isPrimary)?.url ||
    product?.images?.[0]?.url ||
    product?.image ||
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=90"
  );
};

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  paymentMethod: "COD",
  notes: "",
};

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const {
    cart,
    items: fallbackItems,
    loading: cartLoading,
  } = useSelector((state) => state.cart);

  const items = getCartItems(cart).length
    ? getCartItems(cart)
    : fallbackItems || [];

  const [formData, setFormData] = useState({
    ...initialForm,
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [placingOrder, setPlacingOrder] = useState(false);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = getProduct(item);
      const price = Number(item.price || product?.price || 0);
      const quantity = Number(item.quantity || 1);

      return sum + price * quantity;
    }, 0);
  }, [items]);

  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!items.length) {
      toast.error("Your cart is empty");
      navigate("/products");
      return false;
    }

    if (!user) {
      sessionStorage.setItem("vjj_redirect_after_login", "/checkout");
      toast.error("Please login before placing order");
      navigate("/login", {
        state: {
          from: "/checkout",
        },
      });
      return false;
    }

    if (!formData.fullName.trim()) {
      toast.error("Please enter full name");
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter phone number");
      return false;
    }

    if (!/^\d{10}$/.test(String(formData.phone).replace(/\D/g, ""))) {
      toast.error("Please enter a valid 10 digit phone number");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter email address");
      return false;
    }

    if (!formData.addressLine1.trim()) {
      toast.error("Please enter address line 1");
      return false;
    }

    if (!formData.city.trim()) {
      toast.error("Please enter city");
      return false;
    }

    if (!formData.state.trim()) {
      toast.error("Please enter state");
      return false;
    }

    if (!formData.pincode.trim()) {
      toast.error("Please enter pincode");
      return false;
    }

    if (!/^\d{6}$/.test(String(formData.pincode).replace(/\D/g, ""))) {
      toast.error("Please enter a valid 6 digit pincode");
      return false;
    }

    return true;
  };

  const buildOrderPayload = () => {
    return {
      items: items.map((item) => {
        const product = getProduct(item);

        return {
          product: product?._id || item.productId,
          productId: product?._id || item.productId,
          name: product?.name || item.name,
          sku: product?.sku || item.sku,
          image: getProductImage(product),
          price: Number(item.price || product?.price || 0),
          quantity: Number(item.quantity || 1),
          selectedSize: item.selectedSize || "",
          selectedMaterial: item.selectedMaterial || product?.material || "",
        };
      }),

      shippingAddress: {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),

        line1: formData.addressLine1.trim(),
        line2: formData.addressLine2.trim(),

        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),

        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: formData.country.trim() || "India",
      },

      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === "COD" ? "pending" : "pending",

      subtotal,
      shippingCharge: shipping,
      totalAmount: total,
      total,

      notes: formData.notes.trim(),
    };
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setPlacingOrder(true);

      const payload = buildOrderPayload();

      const { data } = await api.post("/orders/checkout", payload);

      const order = data.order || data;
      const orderId = order._id || order.id;

      await dispatch(clearServerCart()).unwrap();

      toast.success("Order placed successfully");

      navigate(`/order-success/${orderId}`, {
        replace: true,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!items.length) {
    return (
      <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-black/10 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
              <ShoppingBag size={34} />
            </div>

            <h1 className="mt-6 font-serif text-5xl font-bold text-vjj-black">
              Your cart is empty
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-stone-600">
              Add jewellery products to your cart before checkout.
            </p>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-7 py-3 text-sm font-bold text-white transition hover:bg-vjj-bronze"
            >
              Start Shopping
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/cart"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Cart
        </Link>

        <div className="mb-8 rounded-[2rem] bg-vjj-black p-6 text-white shadow-luxury md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-vjj-champagne">
            Secure Checkout
          </p>

          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-serif text-5xl font-bold md:text-6xl">
                Checkout
              </h1>

              <p className="mt-4 max-w-2xl text-stone-300">
                Complete your delivery details and place your jewellery order
                securely.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold text-vjj-champagne">
              <LockKeyhole size={17} />
              Protected Order
            </div>
          </div>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid gap-8 xl:grid-cols-[1fr_410px]"
        >
          <main className="space-y-6">
            <CheckoutSection
              icon={<User />}
              title="Contact Details"
              description="We will use this information for order confirmation."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(value) => handleChange("fullName", value)}
                  placeholder="Enter full name"
                  required
                />

                <InputField
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => handleChange("phone", value)}
                  placeholder="10 digit mobile number"
                  required
                />

                <InputField
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleChange("email", value)}
                  placeholder="Enter email"
                  required
                  className="md:col-span-2"
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={<MapPin />}
              title="Delivery Address"
              description="Please enter complete address for order delivery."
            >
              <div className="grid gap-4">
                <InputField
                  label="Address Line 1"
                  value={formData.addressLine1}
                  onChange={(value) => handleChange("addressLine1", value)}
                  placeholder="House no, street, area"
                  required
                />

                <InputField
                  label="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(value) => handleChange("addressLine2", value)}
                  placeholder="Landmark, nearby location"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="City"
                    value={formData.city}
                    onChange={(value) => handleChange("city", value)}
                    placeholder="City"
                    required
                  />

                  <InputField
                    label="State"
                    value={formData.state}
                    onChange={(value) => handleChange("state", value)}
                    placeholder="State"
                    required
                  />

                  <InputField
                    label="Pincode"
                    value={formData.pincode}
                    onChange={(value) => handleChange("pincode", value)}
                    placeholder="6 digit pincode"
                    required
                  />

                  <InputField
                    label="Country"
                    value={formData.country}
                    onChange={(value) => handleChange("country", value)}
                    placeholder="Country"
                    required
                  />
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={<CreditCard />}
              title="Payment Method"
              description="Online payment can be connected later with Razorpay."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <PaymentOption
                  selected={formData.paymentMethod === "COD"}
                  title="Cash on Delivery"
                  text="Pay after order confirmation or during delivery."
                  icon={<IndianRupee />}
                  onClick={() => handleChange("paymentMethod", "COD")}
                />

                <PaymentOption
                  selected={formData.paymentMethod === "ONLINE"}
                  title="Online Payment"
                  text="Coming soon. Keep it ready for Razorpay setup."
                  icon={<CreditCard />}
                  onClick={() => handleChange("paymentMethod", "ONLINE")}
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-bold text-vjj-black">
                  Order Notes
                </label>

                <textarea
                  value={formData.notes}
                  onChange={(event) =>
                    handleChange("notes", event.target.value)
                  }
                  rows={4}
                  placeholder="Any special instruction for the store..."
                  className="w-full rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm outline-none transition focus:border-vjj-gold"
                />
              </div>
            </CheckoutSection>
          </main>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-vjj-black">
                Order Summary
              </h2>

              <div className="mt-5 max-h-[380px] space-y-3 overflow-y-auto pr-1">
                {items.map((item, index) => {
                  const product = getProduct(item);
                  const quantity = Number(item.quantity || 1);
                  const price = Number(item.price || product?.price || 0);

                  return (
                    <div
                      key={`${product?._id || item.productId}-${index}`}
                      className="flex gap-3 rounded-2xl bg-vjj-ivory p-3"
                    >
                      <img
                        src={getProductImage(product)}
                        alt={product?.name || "Product"}
                        className="h-16 w-16 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-bold text-vjj-black">
                          {product?.name || item.name || "Product"}
                        </p>

                        <p className="mt-1 text-xs text-stone-500">
                          Qty: {quantity}
                          {item.selectedSize
                            ? ` · Size: ${item.selectedSize}`
                            : ""}
                        </p>

                        <p className="mt-1 text-sm font-bold text-vjj-bronze">
                          {formatCurrency(price * quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 space-y-4 border-t border-black/10 pt-5">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryRow
                  label="Shipping"
                  value={shipping === 0 ? "Free" : formatCurrency(shipping)}
                />

                <div className="border-t border-black/10 pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(total)}
                    bold
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={placingOrder || cartLoading}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-vjj-black px-6 py-4 text-sm font-bold text-white transition hover:bg-vjj-bronze disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
                <ArrowRight size={17} />
              </button>

              {!user && (
                <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-center text-xs font-semibold text-amber-700">
                  Please login before placing the order.
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3">
              <TrustCard
                icon={<Phone />}
                title="Store Confirmation"
                text="Our team will call or message you after order placement."
              />

              <TrustCard
                icon={<Truck />}
                title="Delivery Support"
                text="Delivery details will be coordinated by the store."
              />

              <TrustCard
                icon={<ShieldCheck />}
                title="Trusted Store"
                text="Secure order process with customer support."
              />
            </div>
          </aside>
        </form>
      </div>
    </section>
  );
}

function CheckoutSection({ icon, title, description, children }) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-5 flex gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
          {icon}
        </div>

        <div>
          <h2 className="font-serif text-3xl font-bold text-vjj-black">
            {title}
          </h2>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-vjj-black">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm outline-none transition focus:border-vjj-gold"
      />
    </label>
  );
}

function PaymentOption({ selected, title, text, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border p-5 text-left transition ${
        selected
          ? "border-vjj-bronze bg-vjj-ivory"
          : "border-black/10 bg-white hover:border-vjj-bronze"
      }`}
    >
      <div
        className={`mb-4 grid h-12 w-12 place-items-center rounded-full ${
          selected
            ? "bg-vjj-black text-vjj-champagne"
            : "bg-vjj-ivory text-vjj-bronze"
        }`}
      >
        {icon}
      </div>

      <p className="font-serif text-2xl font-bold text-vjj-black">{title}</p>
      <p className="mt-2 text-sm text-stone-600">{text}</p>
    </button>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          bold
            ? "font-serif text-2xl font-bold text-vjj-black"
            : "text-sm text-stone-600"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "font-serif text-2xl font-bold text-vjj-black"
            : "text-sm font-bold text-vjj-black"
        }
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
