import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Home,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import { BRAND } from "../utils/constants";

const getOrderItems = (order) => order?.items || order?.orderItems || [];

const getOrderNumber = (order) =>
  order?.orderNumber || order?._id || order?.id || "Order";

const getOrderStatus = (order) =>
  String(order?.orderStatus || order?.status || "placed").toLowerCase();

const getPaymentStatus = (order) =>
  String(order?.paymentStatus || "pending").toLowerCase();

const getOrderTotal = (order) =>
  Number(order?.totalAmount || order?.total || order?.grandTotal || 0);

const getCustomerName = (order) =>
  order?.shippingAddress?.fullName || order?.user?.name || "Customer";

const getCustomerPhone = (order) =>
  order?.shippingAddress?.phone || order?.user?.phone || "";

const getCustomerEmail = (order) =>
  order?.shippingAddress?.email || order?.user?.email || "";

const getAddressText = (order) => {
  const address = order?.shippingAddress || {};

  return [
    address.addressLine1 || address.line1,
    address.addressLine2 || address.line2,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const getProductImage = (product, item) => {
  return (
    item?.image ||
    product?.image ||
    product?.images?.find((image) => image.isPrimary)?.url ||
    product?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=90"
  );
};

export default function OrderSuccess() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(`/orders/${id}`);

      setOrder(data.order || data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to fetch order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    window.scrollTo(0, 0);
  }, [id]);

  const orderItems = useMemo(() => getOrderItems(order), [order]);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(getOrderNumber(order));
      toast.success("Order number copied");
    } catch {
      toast.error("Unable to copy order number");
    }
  };

  const printOrder = () => {
    window.print();
  };

  if (loading) {
    return (
      <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="h-[520px] animate-pulse rounded-[2rem] bg-white" />
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="grid min-h-[70vh] place-items-center bg-vjj-ivory px-5">
        <div className="max-w-md rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-sm">
          <h1 className="font-serif text-4xl font-bold text-vjj-black">
            Order Not Found
          </h1>

          <p className="mt-3 text-stone-600">
            We could not find the order details. Please check your dashboard.
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-6 py-3 text-sm font-bold text-white transition hover:bg-vjj-bronze"
          >
            Go to Dashboard
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    );
  }

  const orderNumber = getOrderNumber(order);
  const orderStatus = getOrderStatus(order);
  const paymentStatus = getPaymentStatus(order);
  const subtotal = Number(order.subtotal || 0);
  const shippingCharge = Number(order.shippingCharge || 0);
  const total = getOrderTotal(order);

  return (
    <section className="bg-vjj-ivory px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
          >
            <ShoppingBag size={17} />
            Continue Shopping
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyOrderNumber}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
            >
              <Copy size={16} />
              Copy Order No.
            </button>

            <button
              type="button"
              onClick={printOrder}
              className="inline-flex items-center gap-2 rounded-full bg-vjj-black px-5 py-2.5 text-sm font-bold text-white transition hover:bg-vjj-bronze"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-vjj-black p-6 text-white shadow-luxury md:p-8 print:bg-white print:text-black print:shadow-none">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex gap-5">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-green-500 text-white print:border print:border-black print:bg-white print:text-black">
                <CheckCircle2 size={34} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-vjj-champagne print:text-black">
                  Order Confirmed
                </p>

                <h1 className="mt-3 font-serif text-5xl font-bold md:text-6xl">
                  Thank you!
                </h1>

                <p className="mt-3 max-w-2xl text-stone-300 print:text-black">
                  Your order has been placed successfully. Our store team will
                  contact you shortly for confirmation.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white/10 p-5 print:border print:border-black print:bg-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-vjj-champagne print:text-black">
                Order Number
              </p>

              <p className="mt-2 break-all font-serif text-3xl font-bold">
                {orderNumber}
              </p>

              <p className="mt-2 text-sm text-stone-300 print:text-black">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-IN")
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_390px]">
          <main className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <StatusCard
                icon={<PackageCheck />}
                label="Order Status"
                value={orderStatus}
              />

              <StatusCard
                icon={<Download />}
                label="Payment Status"
                value={paymentStatus}
              />

              <StatusCard
                icon={<Truck />}
                label="Payment Method"
                value={order.paymentMethod || "COD"}
              />
            </div>

            <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-vjj-black">
                Ordered Items
              </h2>

              <div className="mt-5 grid gap-4">
                {orderItems.map((item, index) => {
                  const product = item.product || item;
                  const name = item.name || product?.name || "Product";
                  const sku = item.sku || product?.sku || "";
                  const quantity = Number(item.quantity || 1);
                  const price = Number(item.price || product?.price || 0);

                  return (
                    <div
                      key={item._id || `${name}-${index}`}
                      className="rounded-3xl border border-black/10 bg-vjj-ivory p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <img
                          src={getProductImage(product, item)}
                          alt={name}
                          className="h-36 w-full rounded-2xl object-cover md:h-28 md:w-28"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-2xl font-bold text-vjj-black">
                            {name}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                            {sku && <span>SKU: {sku}</span>}
                            <span>Qty: {quantity}</span>
                            {item.selectedSize && (
                              <span>Size: {item.selectedSize}</span>
                            )}
                            {item.selectedMaterial && (
                              <span>{item.selectedMaterial}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-sm text-stone-500">Amount</p>
                          <p className="font-serif text-2xl font-bold text-vjj-black">
                            {formatCurrency(price * quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-vjj-black">
                Delivery Details
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoRow
                  icon={<User size={18} />}
                  label={getCustomerName(order)}
                />
                <InfoRow
                  icon={<Phone size={18} />}
                  label={getCustomerPhone(order) || "N/A"}
                />
                <InfoRow
                  icon={<Mail size={18} />}
                  label={getCustomerEmail(order) || "N/A"}
                />
                <InfoRow
                  icon={<MapPin size={18} />}
                  label={getAddressText(order) || "N/A"}
                />
              </div>

              {order.notes && (
                <div className="mt-5 rounded-2xl bg-vjj-ivory p-4">
                  <p className="text-sm font-bold text-vjj-black">
                    Order Notes
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{order.notes}</p>
                </div>
              )}
            </section>
          </main>

          <aside className="xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-3xl font-bold text-vjj-black">
                Payment Summary
              </h2>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(subtotal || total)}
                />

                <SummaryRow
                  label="Shipping"
                  value={
                    shippingCharge === 0
                      ? "Free"
                      : formatCurrency(shippingCharge)
                  }
                />

                <SummaryRow label="Items" value={String(orderItems.length)} />

                <div className="border-t border-black/10 pt-4">
                  <SummaryRow
                    label="Total"
                    value={formatCurrency(total)}
                    bold
                  />
                </div>
              </div>

              <div className="print:hidden mt-6 grid gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-vjj-black px-6 py-4 text-sm font-bold text-white transition hover:bg-vjj-bronze"
                >
                  View My Orders
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-vjj-ivory px-6 py-4 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
                >
                  <Home size={17} />
                  Back Home
                </Link>
              </div>
            </div>

            <div className="print:hidden mt-5 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-vjj-black">
                Need Help?
              </h3>

              <p className="mt-2 text-sm text-stone-600">
                For order support, contact {BRAND.displayName}.
              </p>

              <a
                href={`tel:${BRAND.phone}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-vjj-champagne px-6 py-3 text-sm font-bold text-vjj-black transition hover:bg-vjj-gold"
              >
                <Phone size={17} />
                {BRAND.phone}
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function StatusCard({ icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
        {icon}
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
        {label}
      </p>

      <p className="mt-2 font-serif text-2xl font-bold capitalize text-vjj-black">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ icon, label }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-vjj-ivory p-4">
      <span className="shrink-0 text-vjj-bronze">{icon}</span>
      <span className="break-words text-sm text-stone-700">{label}</span>
    </div>
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
