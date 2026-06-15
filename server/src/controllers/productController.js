const Product = require("../models/Product");

const createSlug = (text) => {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const cleanStringArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const cleanImages = (images = []) => {
  if (!Array.isArray(images)) return [];

  return images
    .slice(0, 4)
    .filter((image) => image?.url)
    .map((image, index) => ({
      url: image.url,
      publicId: image.publicId || image.public_id || "",
      alt: image.alt || "",
      isPrimary: Boolean(image.isPrimary) || index === 0,
    }));
};

const cleanSpecificationGroups = (groups = []) => {
  if (!Array.isArray(groups)) return [];

  return groups
    .map((group) => ({
      title: String(group?.title || "").trim(),
      rows: Array.isArray(group?.rows)
        ? group.rows
            .map((row) => ({
              label: String(row?.label || "").trim(),
              value: String(row?.value || "").trim(),
            }))
            .filter((row) => row.label || row.value)
        : [],
    }))
    .filter((group) => group.title || group.rows.length > 0);
};

const buildProductPayload = (body) => {
  const name = String(body.name || "").trim();

  const payload = {
    name,
    slug: body.slug ? createSlug(body.slug) : createSlug(name),
    sku: String(body.sku || "")
      .trim()
      .toUpperCase(),

    description: String(body.description || "").trim(),
    longDescription: String(body.longDescription || "").trim(),

    category: String(body.category || "").trim(),
    productType: String(body.productType || "").trim(),
    productCollection: String(
      body.productCollection || body.collection || "",
    ).trim(),
    gender: String(body.gender || "").trim(),
    occasion: String(body.occasion || "").trim(),

    material: String(body.material || "").trim(),
    materialColor: String(body.materialColor || "").trim(),
    purity: String(body.purity || "").trim(),
    grossWeight: String(body.grossWeight || "").trim(),
    netWeight: String(body.netWeight || "").trim(),

    price: Number(body.price || 0),
    compareAtPrice: Number(body.compareAtPrice || 0),
    makingCharge: Number(body.makingCharge || 0),
    gstPercent: Number(body.gstPercent ?? 3),

    stock: Number(body.stock || 0),

    sizes: cleanStringArray(body.sizes),
    tags: cleanStringArray(body.tags),

    images: cleanImages(body.images),

    highlights: cleanStringArray(body.highlights),
    specificationGroups: cleanSpecificationGroups(body.specificationGroups),

    careInstructions: String(body.careInstructions || "").trim(),

    isFeatured: Boolean(body.isFeatured),
    isReadyToShip: Boolean(body.isReadyToShip),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };

  if (!payload.careInstructions) {
    delete payload.careInstructions;
  }

  return payload;
};

const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      material,
      purity,
      featured,
      isFeatured,
      readyToShip,
      isReadyToShip,
      minPrice,
      maxPrice,
      search,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const query = {
      isActive: true,
    };

    if (category) {
      query.category = category;
    }

    if (material) {
      query.material = material;
    }

    if (purity) {
      query.purity = purity;
    }

    if (featured === "true" || isFeatured === "true") {
      query.isFeatured = true;
    }

    if (readyToShip === "true" || isReadyToShip === "true") {
      query.isReadyToShip = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");

      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { description: searchRegex },
        { longDescription: searchRegex },
        { category: searchRegex },
        { material: searchRegex },
        { purity: searchRegex },
        { tags: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    if (sort === "price-low") {
      sortOption = { price: 1 };
    }

    if (sort === "price-high") {
      sortOption = { price: -1 };
    }

    if (sort === "name") {
      sortOption = { name: 1 };
    }

    const currentPage = Math.max(1, Number(page || 1));
    const pageLimit = Math.max(1, Number(limit || 12));
    const skip = (currentPage - 1) * pageLimit;

    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(pageLimit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      currentPage,
      totalPages: Math.ceil(totalProducts / pageLimit),
      products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({
      slug,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const createProductAdmin = async (req, res, next) => {
  try {
    if (Array.isArray(req.body.images) && req.body.images.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum 4 product images are allowed.",
      });
    }

    const payload = buildProductPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (!payload.sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required.",
      });
    }

    if (!payload.description) {
      return res.status(400).json({
        success: false,
        message: "Product short description is required.",
      });
    }

    if (!payload.category) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!payload.material) {
      return res.status(400).json({
        success: false,
        message: "Material is required.",
      });
    }

    if (!payload.purity) {
      return res.status(400).json({
        success: false,
        message: "Purity is required.",
      });
    }

    if (!payload.price || payload.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid product price is required.",
      });
    }

    const existingSku = await Product.findOne({
      sku: payload.sku,
    });

    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
    }

    let finalSlug = payload.slug;
    let counter = 1;

    while (await Product.findOne({ slug: finalSlug })) {
      finalSlug = `${payload.slug}-${counter}`;
      counter += 1;
    }

    payload.slug = finalSlug;

    const product = await Product.create(payload);

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProductAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (Array.isArray(req.body.images) && req.body.images.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Maximum 4 product images are allowed.",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const payload = buildProductPayload({
      ...product.toObject(),
      ...req.body,
    });

    if (req.body.slug) {
      payload.slug = createSlug(req.body.slug);
    } else if (req.body.name && req.body.name !== product.name) {
      payload.slug = createSlug(req.body.name);
    } else {
      payload.slug = product.slug;
    }

    if (req.body.sku) {
      payload.sku = String(req.body.sku).trim().toUpperCase();

      const existingSku = await Product.findOne({
        sku: payload.sku,
        _id: { $ne: id },
      });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: "Product with this SKU already exists.",
        });
      }
    }

    if (payload.slug !== product.slug) {
      let finalSlug = payload.slug;
      let counter = 1;

      while (
        await Product.findOne({
          slug: finalSlug,
          _id: { $ne: id },
        })
      ) {
        finalSlug = `${payload.slug}-${counter}`;
        counter += 1;
      }

      payload.slug = finalSlug;
    }

    Object.assign(product, payload);

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProductAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.isActive = false;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
};
