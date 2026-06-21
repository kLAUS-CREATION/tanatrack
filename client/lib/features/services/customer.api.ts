import { apiSlice } from "../api";

export interface ICustomer {
  id: string;
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export const customerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<ICustomer[], string>({
      query: (orgId) => ({ url: `/org/${orgId}/customers`, method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Customer" as const, id })),
              { type: "Customer", id: "LIST" },
            ]
          : [{ type: "Customer", id: "LIST" }],
    }),

    getCustomer: builder.query<ICustomer, { orgId: string; customerId: string }>({
      query: ({ orgId, customerId }) => ({
        url: `/org/${orgId}/customers/${customerId}`,
        method: "GET",
      }),
      providesTags: (result, error, { customerId }) => [
        { type: "Customer", id: customerId },
      ],
    }),

    createCustomer: builder.mutation<
      ICustomer,
      { orgId: string; body: CreateCustomerRequest }
    >({
      query: ({ orgId, body }) => ({
        url: `/org/${orgId}/customers`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),

    updateCustomer: builder.mutation<
      ICustomer,
      { orgId: string; customerId: string; body: UpdateCustomerRequest }
    >({
      query: ({ orgId, customerId, body }) => ({
        url: `/org/${orgId}/customers/${customerId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: "Customer", id: customerId },
        { type: "Customer", id: "LIST" },
      ],
    }),

    deleteCustomer: builder.mutation<
      { success: boolean },
      { orgId: string; customerId: string }
    >({
      query: ({ orgId, customerId }) => ({
        url: `/org/${orgId}/customers/${customerId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;
