import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Filter,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../../services/api";
import { formatCurrency } from "../../utils/formatCurrency";
import { CATEGORIES } from "../../utils/constants";

const MATERIALS = ["Gold", "Silver", "Diamond", "Platinum", "Gemstone"];
const PURITIES = ["18K", "22K", "24K", "925 Silver"];
const PRODUCT_TYPES = [
  "Ring",
  "Earring",
  "Pendant",
  "Bangle",
  "Bracelet",
  "Mangalsutra",
  "Necklace",
  "Nose Pin",
  "Coin",
  "Bridal Set",
  "Other",
];
const GENDERS = ["Women", "Men", "Kids", "Unisex"];
const OCCASIONS = [
  "Daily Wear",
  "Wedding",
  "Engagement",
  "Festive",
  "Office Wear",
  "Party Wear",
  "Gift",
];

const emptySpecGroups = [
  {
    title: "Metal Details",
    rows: [
      { label: "Material", value: "" },
      { label: "Purity", value: "" },
      { label: "Material Color", value: "" },
      { label: "Gross Weight", value: "" },
      { label: "Net Weight", value: "" },
    ],
  },
  {
    title: "Product Details",
    rows: [
      { label: "Product Type", value: "" },
      { label: "Collection", value: "" },
      { label: "Gender", value: "" },
      { label: "Occasion", value: "" },
    ],
  },
];

const emptyForm = {
  name: "",
  sku: "",
  category: "",
  description: "",
  longDescription: "",

  price: "",
  comparePrice: "",

  material: "",
  purity: "",
  productType: "",
  productCollection: "",
  gender: "",
  occasion: "",
  materialColor: "",
  grossWeight: "",
  netWeight: "",

  stock: "",
  sizes: "",
  tags: "",
  highlights: "",
  careInstructions:
    "Keep jewellery away from perfume, water and harsh chemicals. Store separately in a soft pouch or box after use.",

  makingCharge: "",
  gstPercent: "",

  isFeatured: false,
  readyToShip: true,
  isActive: true,

  images: [],
  specificationGroups: emptySpecGroups,
};

const getPrimaryImage = (product) => {
  return (
    product?.images?.find((image) => image.isPrimary)?.url ||
    product?.images?.[0]?.url ||
    product?.image ||
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=90"
  );
};

const normalizeProductToForm = (product) => {
  return {
    name: product.name || "",
    sku: product.sku || "",
    category: product.category || "",
    description: product.description || "",
    longDescription: product.longDescription || "",

    price: product.price || "",
    comparePrice: product.comparePrice || "",

    material: product.material || "",
    purity: product.purity || "",
    productType: product.productType || "",
    productCollection: product.productCollection || product.collection || "",
    gender: product.gender || "",
    occasion: product.occasion || "",
    materialColor: product.materialColor || "",
    grossWeight: product.grossWeight || "",
    netWeight: product.netWeight || "",

    stock: product.stock || "",
    sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    highlights: Array.isArray(product.highlights)
      ? product.highlights.join("\n")
      : "",
    careInstructions: product.careInstructions || "",

    makingCharge: product.makingCharge || "",
    gstPercent: product.gstPercent || "",

    isFeatured: Boolean(product.isFeatured),
    readyToShip: Boolean(product.readyToShip),
    isActive: product.isActive !== false,

    images: Array.isArray(product.images) ? product.images.slice(0, 4) : [],
    specificationGroups:
      Array.isArray(product.specificationGroups) &&
      product.specificationGroups.length
        ? product.specificationGroups
        : emptySpecGroups,
  };
};

const cleanList = (value) => {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const cleanMultilineList = (value) => {
  if (!value) return [];

  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
};

const cleanSpecificationGroups = (groups) => {
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group) => ({
      title: String(group.title || "").trim(),
      rows: Array.isArray(group.rows)
        ? group.rows
            .map((row) => ({
              label: String(row.label || "").trim(),
              value: String(row.value || "").trim(),
            }))
            .filter((row) => row.label && row.value)
        : [],
    }))
    .filter((group) => group.title && group.rows.length > 0);
};

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [uploadingImages, setUploadingImages] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/products", {
        params: {
          limit: 200,
          admin: true,
        },
      });

      setProducts(data.products || data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = products
      .map((product) => product.category)
      .filter(Boolean);

    return [...new Set(uniqueCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.material?.toLowerCase().includes(search) ||
        product.purity?.toLowerCase().includes(search);

      const matchesCategory =
        !categoryFilter || product.category === categoryFilter;

      const stock = Number(product.stock || 0);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && stock > 0 && stock <= 5) ||
        (stockFilter === "out" && stock === 0) ||
        (stockFilter === "available" && stock > 5);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const lowStockCount = useMemo(() => {
    return products.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((product) => Number(product.stock || 0) === 0)
      .length;
  }, [products]);

  const clearProductFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStockFilter("all");
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const startCreate = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData(normalizeProductToForm(product));
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return false;
    }

    if (!formData.sku.trim()) {
      toast.error("SKU is required");
      return false;
    }

    if (!formData.category.trim()) {
      toast.error("Category is required");
      return false;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Valid price is required");
      return false;
    }

    if (formData.comparePrice && Number(formData.comparePrice) < 0) {
      toast.error("Compare price cannot be negative");
      return false;
    }

    if (formData.stock === "" || Number(formData.stock) < 0) {
      toast.error("Valid stock quantity is required");
      return false;
    }

    if (formData.images.length > 4) {
      toast.error("Maximum 4 images allowed");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category.trim(),

      description: formData.description.trim(),
      longDescription: formData.longDescription.trim(),

      price: Number(formData.price || 0),
      comparePrice: Number(formData.comparePrice || 0),

      material: formData.material.trim(),
      purity: formData.purity.trim(),

      productType: formData.productType.trim(),
      productCollection: formData.productCollection.trim(),
      gender: formData.gender.trim(),
      occasion: formData.occasion.trim(),
      materialColor: formData.materialColor.trim(),
      grossWeight: formData.grossWeight.trim(),
      netWeight: formData.netWeight.trim(),

      stock: Number(formData.stock || 0),

      sizes: cleanList(formData.sizes),
      tags: cleanList(formData.tags),
      highlights: cleanMultilineList(formData.highlights),
      careInstructions: formData.careInstructions.trim(),

      makingCharge: Number(formData.makingCharge || 0),
      gstPercent: Number(formData.gstPercent || 0),

      isFeatured: Boolean(formData.isFeatured),
      readyToShip: Boolean(formData.readyToShip),
      isActive: Boolean(formData.isActive),

      images: formData.images.slice(0, 4),
      specificationGroups: cleanSpecificationGroups(
        formData.specificationGroups,
      ),
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingProduct) {
        const { data } = await api.patch(
          `/products/admin/${editingProduct._id}`,
          payload,
        );

        const updatedProduct = data.product || data;

        setProducts((prev) =>
          prev.map((product) =>
            product._id === editingProduct._id ? updatedProduct : product,
          ),
        );

        toast.success("Product updated successfully");
      } else {
        const { data } = await api.post("/products/admin", payload);

        const createdProduct = data.product || data;

        setProducts((prev) => [createdProduct, ...prev]);

        toast.success("Product created successfully");
      }

      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/products/admin/${product._id}`);

      setProducts((prev) =>
        prev.filter((existingProduct) => existingProduct._id !== product._id),
      );

      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete product");
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const remainingSlots = 4 - formData.images.length;

    if (remainingSlots <= 0) {
      toast.error("Maximum 4 images allowed");
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    try {
      setUploadingImages(true);

      const uploadedImages = [];

      for (const file of selectedFiles) {
        const imageForm = new FormData();
        imageForm.append("image", file);

        const { data } = await api.post("/upload", imageForm, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const imageUrl = data.url || data.secure_url || data.image?.url;

        if (imageUrl) {
          uploadedImages.push({
            url: imageUrl,
            publicId:
              data.publicId || data.public_id || data.image?.publicId || "",
            alt: formData.name || "Product image",
            isPrimary:
              formData.images.length === 0 && uploadedImages.length === 0,
          });
        }
      }

      if (!uploadedImages.length) {
        toast.error("Image upload failed");
        return;
      }

      setFormData((prev) => {
        const currentImages = prev.images || [];
        const mergedImages = [...currentImages, ...uploadedImages].slice(0, 4);

        const hasPrimary = mergedImages.some((image) => image.isPrimary);

        return {
          ...prev,
          images: hasPrimary
            ? mergedImages
            : mergedImages.map((image, index) => ({
                ...image,
                isPrimary: index === 0,
              })),
        };
      });

      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload image");
    } finally {
      setUploadingImages(false);
      event.target.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => {
      const updatedImages = prev.images.filter(
        (_, index) => index !== indexToRemove,
      );

      if (
        updatedImages.length &&
        !updatedImages.some((image) => image.isPrimary)
      ) {
        updatedImages[0] = {
          ...updatedImages[0],
          isPrimary: true,
        };
      }

      return {
        ...prev,
        images: updatedImages,
      };
    });
  };

  const setPrimaryImage = (indexToPrimary) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((image, index) => ({
        ...image,
        isPrimary: index === indexToPrimary,
      })),
    }));
  };

  return (
    <div className="px-5 py-8 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-vjj-bronze">
            Admin Products
          </p>

          <h1 className="mt-3 font-serif text-5xl font-bold text-vjj-black">
            Manage Products
          </h1>

          <p className="mt-3 max-w-2xl text-stone-600">
            Add, update, filter and manage jewellery products with detailed
            specifications and images.
          </p>
        </div>

        <button
          type="button"
          onClick={showForm ? resetForm : startCreate}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-vjj-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-vjj-bronze"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Close Form" : "Add Product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm md:p-7"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-vjj-bronze">
                {editingProduct ? "Edit Product" : "New Product"}
              </p>
              <h2 className="mt-2 font-serif text-4xl font-bold text-vjj-black">
                {editingProduct ? editingProduct.name : "Create Product"}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-vjj-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-vjj-bronze disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                <Check size={16} />
                {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <main className="space-y-6">
              <FormSection title="Basic Information">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Product Name"
                    value={formData.name}
                    onChange={(value) => handleChange("name", value)}
                    placeholder="Gold Ring"
                    required
                  />

                  <InputField
                    label="SKU"
                    value={formData.sku}
                    onChange={(value) => handleChange("sku", value)}
                    placeholder="VJJ-RING-001"
                    required
                  />

                  <SelectField
                    label="Category"
                    value={formData.category}
                    onChange={(value) => handleChange("category", value)}
                    options={CATEGORIES}
                    required
                  />

                  <SelectField
                    label="Product Type"
                    value={formData.productType}
                    onChange={(value) => handleChange("productType", value)}
                    options={PRODUCT_TYPES}
                  />

                  <InputField
                    label="Short Description"
                    value={formData.description}
                    onChange={(value) => handleChange("description", value)}
                    placeholder="Short product description"
                    className="md:col-span-2"
                  />

                  <TextareaField
                    label="Long Description"
                    value={formData.longDescription}
                    onChange={(value) => handleChange("longDescription", value)}
                    placeholder="Detailed product description"
                    className="md:col-span-2"
                  />
                </div>
              </FormSection>

              <FormSection title="Pricing & Stock">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <InputField
                    label="Price"
                    type="number"
                    value={formData.price}
                    onChange={(value) => handleChange("price", value)}
                    placeholder="0"
                    required
                  />

                  <InputField
                    label="Compare Price"
                    type="number"
                    value={formData.comparePrice}
                    onChange={(value) => handleChange("comparePrice", value)}
                    placeholder="Optional"
                  />

                  <InputField
                    label="Stock"
                    type="number"
                    value={formData.stock}
                    onChange={(value) => handleChange("stock", value)}
                    placeholder="0"
                    required
                  />

                  <InputField
                    label="GST %"
                    type="number"
                    value={formData.gstPercent}
                    onChange={(value) => handleChange("gstPercent", value)}
                    placeholder="3"
                  />

                  <InputField
                    label="Making Charge"
                    type="number"
                    value={formData.makingCharge}
                    onChange={(value) => handleChange("makingCharge", value)}
                    placeholder="0"
                  />
                </div>
              </FormSection>

              <FormSection title="Jewellery Details">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <SelectField
                    label="Material"
                    value={formData.material}
                    onChange={(value) => handleChange("material", value)}
                    options={MATERIALS}
                  />

                  <SelectField
                    label="Purity"
                    value={formData.purity}
                    onChange={(value) => handleChange("purity", value)}
                    options={PURITIES}
                  />

                  <InputField
                    label="Material Color"
                    value={formData.materialColor}
                    onChange={(value) => handleChange("materialColor", value)}
                    placeholder="Yellow Gold"
                  />

                  <InputField
                    label="Collection"
                    value={formData.productCollection}
                    onChange={(value) =>
                      handleChange("productCollection", value)
                    }
                    placeholder="Wedding Collection"
                  />

                  <SelectField
                    label="Gender"
                    value={formData.gender}
                    onChange={(value) => handleChange("gender", value)}
                    options={GENDERS}
                  />

                  <SelectField
                    label="Occasion"
                    value={formData.occasion}
                    onChange={(value) => handleChange("occasion", value)}
                    options={OCCASIONS}
                  />

                  <InputField
                    label="Gross Weight"
                    value={formData.grossWeight}
                    onChange={(value) => handleChange("grossWeight", value)}
                    placeholder="10.5 gm"
                  />

                  <InputField
                    label="Net Weight"
                    value={formData.netWeight}
                    onChange={(value) => handleChange("netWeight", value)}
                    placeholder="9.8 gm"
                  />

                  <InputField
                    label="Sizes"
                    value={formData.sizes}
                    onChange={(value) => handleChange("sizes", value)}
                    placeholder="6, 7, 8"
                  />
                </div>
              </FormSection>

              <FormSection title="Tags, Highlights & Care">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Tags"
                    value={formData.tags}
                    onChange={(value) => handleChange("tags", value)}
                    placeholder="bridal, daily wear, gold"
                  />

                  <TextareaField
                    label="Highlights"
                    value={formData.highlights}
                    onChange={(value) => handleChange("highlights", value)}
                    placeholder="One highlight per line"
                  />

                  <TextareaField
                    label="Care Instructions"
                    value={formData.careInstructions}
                    onChange={(value) =>
                      handleChange("careInstructions", value)
                    }
                    placeholder="Care instructions"
                    className="md:col-span-2"
                  />
                </div>
              </FormSection>

              <FormSection title="Specification Groups">
                <SpecificationEditor
                  groups={formData.specificationGroups}
                  onChange={(groups) =>
                    handleChange("specificationGroups", groups)
                  }
                />
              </FormSection>
            </main>

            <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
              <ProductImagesSection
                images={formData.images}
                uploading={uploadingImages}
                onUpload={handleImageUpload}
                onRemove={removeImage}
                onPrimary={setPrimaryImage}
              />

              <FormSection title="Product Status">
                <div className="grid gap-3">
                  <ToggleField
                    label="Active Product"
                    description="Show this product on website"
                    checked={formData.isActive}
                    onChange={(value) => handleChange("isActive", value)}
                  />

                  <ToggleField
                    label="Featured Product"
                    description="Show in highlighted sections"
                    checked={formData.isFeatured}
                    onChange={(value) => handleChange("isFeatured", value)}
                  />

                  <ToggleField
                    label="Ready To Ship"
                    description="Mark product ready for faster delivery"
                    checked={formData.readyToShip}
                    onChange={(value) => handleChange("readyToShip", value)}
                  />
                </div>
              </FormSection>
            </aside>
          </div>
        </form>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Products" value={products.length} />
        <StatCard
          label="Visible Now"
          value={products.filter((p) => p.isActive !== false).length}
        />
        <StatCard label="Low Stock" value={lowStockCount} warning />
        <StatCard label="Out of Stock" value={outOfStockCount} danger />
      </div>

      <div className="mb-6 rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-vjj-ivory text-vjj-bronze">
                <Filter size={18} />
              </div>

              <div>
                <h2 className="font-serif text-3xl font-bold text-vjj-black">
                  Product Filters
                </h2>
                <p className="text-sm text-stone-600">
                  Showing {filteredProducts.length} of {products.length}{" "}
                  products
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearProductFilters}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-vjj-ivory px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
          <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3">
            <Search size={18} className="text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by product name, SKU, category, material..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm font-semibold outline-none focus:border-vjj-gold"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm font-semibold outline-none focus:border-vjj-gold"
          >
            <option value="all">All Stock</option>
            <option value="available">Available Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        {stockFilter === "low" && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <AlertTriangle size={17} />
            Showing products with stock between 1 and 5.
          </div>
        )}

        {stockFilter === "out" && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertTriangle size={17} />
            Showing products which are out of stock.
          </div>
        )}
      </div>

      <section className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-3xl font-bold text-vjj-black">
              Product List
            </h2>
            <p className="text-sm text-stone-600">
              Manage all jewellery products from here.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProducts}
            className="rounded-full border border-black/10 bg-vjj-ivory px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <ProductListSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-vjj-ivory p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-vjj-bronze">
              <Search />
            </div>
            <h3 className="mt-4 font-serif text-2xl font-bold text-vjj-black">
              No products found
            </h3>
            <p className="mt-2 text-stone-600">
              No products found for selected filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock || 0);

              return (
                <div
                  key={product._id}
                  className="rounded-3xl border border-black/10 bg-vjj-ivory p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <img
                      src={getPrimaryImage(product)}
                      alt={product.name}
                      className="h-32 w-full rounded-2xl object-cover lg:h-28 lg:w-28"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-2xl font-bold text-vjj-black">
                          {product.name}
                        </h3>

                        {product.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-vjj-black px-3 py-1 text-xs font-bold text-vjj-champagne">
                            <Sparkles size={12} />
                            Featured
                          </span>
                        )}

                        {product.readyToShip && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                            Ready
                          </span>
                        )}

                        {product.isActive === false && (
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-stone-600">
                        {product.sku && <span>SKU: {product.sku}</span>}
                        {product.category && <span>· {product.category}</span>}
                        {product.material && <span>· {product.material}</span>}
                        {product.purity && <span>· {product.purity}</span>}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <p className="font-serif text-2xl font-bold text-vjj-black">
                          {formatCurrency(product.price)}
                        </p>

                        {product.comparePrice > product.price && (
                          <p className="text-sm font-semibold text-stone-400 line-through">
                            {formatCurrency(product.comparePrice)}
                          </p>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            stock === 0
                              ? "bg-red-50 text-red-700"
                              : stock <= 5
                                ? "bg-amber-50 text-amber-700"
                                : "bg-green-50 text-green-700"
                          }`}
                        >
                          Stock: {stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {product.slug && (
                        <a
                          href={`/products/${product.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
                        >
                          <ExternalLink size={15} />
                          View
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        className="inline-flex items-center gap-2 rounded-full bg-vjj-black px-4 py-2 text-sm font-bold text-white transition hover:bg-vjj-bronze"
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, warning = false, danger = false }) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
        {label}
      </p>
      <p
        className={`mt-3 font-serif text-3xl font-bold ${
          danger
            ? "text-red-700"
            : warning
              ? "text-amber-700"
              : "text-vjj-black"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-vjj-ivory p-5">
      <h3 className="mb-4 font-serif text-2xl font-bold text-vjj-black">
        {title}
      </h3>
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
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-vjj-gold"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-vjj-black">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-vjj-gold"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-vjj-black">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-vjj-gold"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-vjj-bronze bg-white"
          : "border-black/10 bg-white/70 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-vjj-black">{label}</p>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>

        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
            checked
              ? "border-vjj-black bg-vjj-black text-white"
              : "border-black/20 bg-white text-transparent"
          }`}
        >
          <Check size={14} />
        </span>
      </div>
    </button>
  );
}

function ProductImagesSection({
  images,
  uploading,
  onUpload,
  onRemove,
  onPrimary,
}) {
  return (
    <section className="rounded-[1.5rem] border border-black/10 bg-vjj-ivory p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-bold text-vjj-black">
            Product Images
          </h3>
          <p className="text-sm text-stone-600">Maximum 4 images allowed.</p>
        </div>

        <ImagePlus className="text-vjj-bronze" />
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-white px-4 py-8 text-center transition hover:border-vjj-bronze">
        <UploadCloud className="text-vjj-bronze" />
        <p className="mt-2 text-sm font-bold text-vjj-black">
          {uploading ? "Uploading..." : "Upload Images"}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          JPG, PNG, WEBP. Select up to 4 images.
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || images.length >= 4}
          onChange={onUpload}
          className="hidden"
        />
      </label>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-2"
            >
              <img
                src={image.url}
                alt={image.alt || "Product"}
                className="h-32 w-full rounded-xl object-cover"
              />

              {image.isPrimary && (
                <span className="absolute left-3 top-3 rounded-full bg-vjj-black px-2 py-1 text-[10px] font-bold text-white">
                  Primary
                </span>
              )}

              <div className="mt-2 grid gap-2">
                <button
                  type="button"
                  onClick={() => onPrimary(index)}
                  className="rounded-full bg-vjj-ivory px-3 py-1.5 text-xs font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
                >
                  Set Primary
                </button>

                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SpecificationEditor({ groups, onChange }) {
  const updateGroupTitle = (groupIndex, title) => {
    const updated = groups.map((group, index) =>
      index === groupIndex ? { ...group, title } : group,
    );
    onChange(updated);
  };

  const updateRow = (groupIndex, rowIndex, field, value) => {
    const updated = groups.map((group, index) => {
      if (index !== groupIndex) return group;

      return {
        ...group,
        rows: group.rows.map((row, currentRowIndex) =>
          currentRowIndex === rowIndex ? { ...row, [field]: value } : row,
        ),
      };
    });

    onChange(updated);
  };

  const addGroup = () => {
    onChange([
      ...groups,
      {
        title: "Custom Details",
        rows: [{ label: "", value: "" }],
      },
    ]);
  };

  const removeGroup = (groupIndex) => {
    onChange(groups.filter((_, index) => index !== groupIndex));
  };

  const addRow = (groupIndex) => {
    const updated = groups.map((group, index) =>
      index === groupIndex
        ? {
            ...group,
            rows: [...group.rows, { label: "", value: "" }],
          }
        : group,
    );

    onChange(updated);
  };

  const removeRow = (groupIndex, rowIndex) => {
    const updated = groups.map((group, index) => {
      if (index !== groupIndex) return group;

      return {
        ...group,
        rows: group.rows.filter(
          (_, currentRowIndex) => currentRowIndex !== rowIndex,
        ),
      };
    });

    onChange(updated);
  };

  return (
    <div className="space-y-5">
      {groups.map((group, groupIndex) => (
        <div
          key={`${group.title}-${groupIndex}`}
          className="rounded-2xl border border-black/10 bg-white p-4"
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={group.title}
              onChange={(event) =>
                updateGroupTitle(groupIndex, event.target.value)
              }
              placeholder="Group title"
              className="flex-1 rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm font-bold outline-none focus:border-vjj-gold"
            />

            <button
              type="button"
              onClick={() => removeGroup(groupIndex)}
              className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              Remove Group
            </button>
          </div>

          <div className="space-y-3">
            {group.rows.map((row, rowIndex) => (
              <div
                key={`${row.label}-${rowIndex}`}
                className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  value={row.label}
                  onChange={(event) =>
                    updateRow(groupIndex, rowIndex, "label", event.target.value)
                  }
                  placeholder="Label"
                  className="rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm outline-none focus:border-vjj-gold"
                />

                <input
                  value={row.value}
                  onChange={(event) =>
                    updateRow(groupIndex, rowIndex, "value", event.target.value)
                  }
                  placeholder="Value"
                  className="rounded-2xl border border-black/10 bg-vjj-ivory px-4 py-3 text-sm outline-none focus:border-vjj-gold"
                />

                <button
                  type="button"
                  onClick={() => removeRow(groupIndex, rowIndex)}
                  className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addRow(groupIndex)}
            className="mt-4 rounded-full bg-vjj-black px-4 py-2 text-sm font-bold text-white transition hover:bg-vjj-bronze"
          >
            Add Row
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-vjj-black transition hover:bg-vjj-black hover:text-white"
      >
        Add Specification Group
      </button>
    </div>
  );
}

function ProductListSkeleton() {
  return (
    <div className="grid gap-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-36 animate-pulse rounded-3xl bg-vjj-ivory"
        />
      ))}
    </div>
  );
}
