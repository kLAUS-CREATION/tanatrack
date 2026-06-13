import { apiSlice } from "../api";

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
  variants?: VariantInput[];
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  unit?: ProductUnit;
  isActive?: boolean;
}

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
      IProduct,
      { orgId: string; body: CreateProductRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/products`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    updateProduct: builder.mutation<
      IProduct,
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
      ],
    }),

    deleteProduct: builder.mutation<void, { orgId: string; productId: string }>({
      query: ({ orgId, productId }) => ({
        url: `/org/${orgId}/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    // --- variants ---
    addVariant: builder.mutation<
      IProductVariant,
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
      ],
    }),

    updateVariant: builder.mutation<
      IProductVariant,
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
      ],
    }),

    deleteVariant: builder.mutation<
      void,
      { orgId: string; productId: string; variantId: string }
    >({
      query: ({ orgId, productId, variantId }) => ({
        url: `/org/${orgId}/products/${productId}/variants/${variantId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Product", id: productId },
        { type: "Product", id: "LIST" },
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
      IProductCategory,
      { orgId: string; body: { name: string } }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/product-categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ProductCategory", id: "LIST" }],
    }),

    updateCategory: builder.mutation<
      IProductCategory,
      { orgId: string; categoryId: string; body: { name: string } }
    >({
      query: ({ orgId, categoryId, body }) => ({
        url: `/org/${orgId}/product-categories/${categoryId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "ProductCategory", id: "LIST" }],
    }),

    deleteCategory: builder.mutation<
      void,
      { orgId: string; categoryId: string }
    >({
      query: ({ orgId, categoryId }) => ({
        url: `/org/${orgId}/product-categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ProductCategory", id: "LIST" }],
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
