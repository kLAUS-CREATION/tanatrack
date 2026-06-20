import { apiSlice } from "../api";
import type { MaybePending } from "./change-request.api";

export enum ProductUnit {
  PIECE = "PIECE",
  KG = "KG",
  GRAM = "GRAM",
  LITER = "LITER",
  MILLILITER = "MILLILITER",
  METER = "METER",
  BOX = "BOX",
  PACK = "PACK",
  DOZEN = "DOZEN",
}

export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IProductCategory {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  id: string;
  organizationId: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  unit: ProductUnit;
  isActive: boolean;
  // Perishable products carry an expiry date per purchased batch (FEFO).
  isPerishable: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: IProductVariant[];
  category?: IProductCategory | null;
}

export interface VariantInput {
  sku: string;
  barcode?: string;
  name: string;
  costPrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  categoryId?: string;
  unit?: ProductUnit;
  isActive?: boolean;
  isPerishable?: boolean;
  variants?: VariantInput[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  unit?: ProductUnit;
  isActive?: boolean;
  isPerishable?: boolean;
}

// --- product change approval (maker–checker) ---
// The maker-checker engine is unified org-wide; types live in change-request.api.
// Re-exported here so existing product callers keep their imports.
export {
  isPendingChange,
  type MaybePending,
  type IChangeRequest,
  type IChangeActor,
} from "./change-request.api";

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // --- products ---
    getProducts: builder.query<IProduct[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/products`, method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),

    getProduct: builder.query<IProduct, { orgId: string; productId: string }>({
      query: ({ orgId, productId }) => ({
        url: `/org/${orgId}/products/${productId}`,
        method: "GET",
      }),
      providesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
      ],
    }),

    createProduct: builder.mutation<
      MaybePending<IProduct>,
      { orgId: string; body: CreateProductRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/products`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    updateProduct: builder.mutation<
      MaybePending<IProduct>,
      { orgId: string; productId: string; body: UpdateProductRequest }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/org/${orgId}/products/${productId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    deleteProduct: builder.mutation<
      MaybePending<void>,
      { orgId: string; productId: string }
    >({
      query: ({ orgId, productId }) => ({
        url: `/org/${orgId}/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    // --- variants ---
    addVariant: builder.mutation<
      MaybePending<IProductVariant>,
      { orgId: string; productId: string; body: VariantInput }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/org/${orgId}/products/${productId}/variants`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    updateVariant: builder.mutation<
      MaybePending<IProductVariant>,
      { orgId: string; productId: string; variantId: string; body: VariantInput }
    >({
      query: ({ orgId, productId, variantId, body }) => ({
        url: `/org/${orgId}/products/${productId}/variants/${variantId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    deleteVariant: builder.mutation<
      MaybePending<void>,
      { orgId: string; productId: string; variantId: string }
    >({
      query: ({ orgId, productId, variantId }) => ({
        url: `/org/${orgId}/products/${productId}/variants/${variantId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    // --- categories ---
    getCategories: builder.query<IProductCategory[], string>({
      query: (orgId) => ({
        url: `/org/${orgId}/product-categories`,
        method: "GET",
      }),
      providesTags: [{ type: "ProductCategory", id: "LIST" }],
    }),

    createCategory: builder.mutation<
      MaybePending<IProductCategory>,
      { orgId: string; body: { name: string } }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/product-categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "ProductCategory", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    updateCategory: builder.mutation<
      MaybePending<IProductCategory>,
      { orgId: string; categoryId: string; body: { name: string } }
    >({
      query: ({ orgId, categoryId, body }) => ({
        url: `/org/${orgId}/product-categories/${categoryId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        { type: "ProductCategory", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation<
      MaybePending<void>,
      { orgId: string; categoryId: string }
    >({
      query: ({ orgId, categoryId }) => ({
        url: `/org/${orgId}/product-categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "ProductCategory", id: "LIST" },
        { type: "ChangeRequest", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = productApi;
