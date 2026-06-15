const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },

    alt: {
      type: String,
      default: "",
      trim: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const specificationRowSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
    },

    value: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const specificationGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    rows: {
      type: [specificationRowSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, "Product slug is required."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    sku: {
      type: String,
      required: [true, "SKU is required."],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Product short description is required."],
      trim: true,
    },

    longDescription: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
      index: true,
    },

    productType: {
      type: String,
      default: "",
      trim: true,
    },

    productCollection: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      default: "",
      trim: true,
    },

    occasion: {
      type: String,
      default: "",
      trim: true,
    },

    material: {
      type: String,
      required: [true, "Material is required."],
      trim: true,
      index: true,
    },

    materialColor: {
      type: String,
      default: "",
      trim: true,
    },

    purity: {
      type: String,
      required: [true, "Purity is required."],
      trim: true,
      index: true,
    },

    grossWeight: {
      type: String,
      default: "",
      trim: true,
    },

    netWeight: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required."],
      min: [0, "Price cannot be negative."],
    },

    compareAtPrice: {
      type: Number,
      default: 0,
      min: [0, "Compare price cannot be negative."],
    },

    makingCharge: {
      type: Number,
      default: 0,
      min: [0, "Making charge cannot be negative."],
    },

    gstPercent: {
      type: Number,
      default: 3,
      min: [0, "GST cannot be negative."],
    },

    stock: {
      type: Number,
      required: [true, "Stock is required."],
      default: 0,
      min: [0, "Stock cannot be negative."],
    },

    sizes: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
      index: true,
    },

    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator(value) {
          return value.length <= 4;
        },
        message: "Maximum 4 product images are allowed.",
      },
    },

    highlights: {
      type: [String],
      default: [],
    },

    specificationGroups: {
      type: [specificationGroupSchema],
      default: [],
    },

    careInstructions: {
      type: String,
      default:
        "Store jewellery in a dry place. Avoid contact with perfume, water and chemicals. Clean gently with a soft cloth.",
      trim: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isReadyToShip: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (this.sku) {
    this.sku = this.sku.toUpperCase().trim();
  }

  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some((image) => image.isPrimary);

    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }

    let primaryFound = false;

    this.images = this.images.map((image) => {
      if (image.isPrimary && !primaryFound) {
        primaryFound = true;
        return image;
      }

      if (image.isPrimary && primaryFound) {
        image.isPrimary = false;
      }

      return image;
    });
  }

  next();
});

productSchema.index({
  name: "text",
  sku: "text",
  description: "text",
  tags: "text",
});
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ material: 1, purity: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
