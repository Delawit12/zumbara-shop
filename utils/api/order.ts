// "use server";

import axiosInstance from "../axios";
import {
  PaymentStatus,
  OrderStatus,
  SortOrder,
  SortOrderType,
} from "../constants/orders";

// Re-export the types for backward compatibility
export { PaymentStatus, OrderStatus, SortOrder, type SortOrderType };

export const createOrder = async (data: {
  cartId?: string;
  productId?: string;
  variantId?: string;
  quantity?: number;
}) => {
  try {
    let payload: any = {};

    if (data.productId) {
      // 🟢 BUY NOW ORDER
      payload = {
        productId: data.productId,
        quantity: data.quantity ?? 1,
      };
      if (data.variantId) payload.variantId = data.variantId;
    } else if (data.cartId) {
      // 🟢 CART ORDER
      payload = { cartId: data.cartId };
    } else {
      throw new Error("Either productId or cartId must be provided");
    }

    // ✅ Now Make API Request
    const response = await axiosInstance.post("/orders", payload);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    throw new Error(message);
  }
};

export const getSingleOrder = async (id: string) => {
  try {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    throw new Error(message);
  }
};

export const getOrders = async ({
  status,
  paymentStatus,
  search,
  page = 1,
  limit = 10,
  sortBy = "createdAt",
  sortOrder = "desc",
  dateFrom,
  dateTo,
}: {
  status?: "PENDING" | "DELIVERING" | "DELIVERED" | "CANCELLED";
  paymentStatus?: "PENDING" | "APPROVED" | "DECLINED";
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrderType;
  dateFrom?: string;
  dateTo?: string;
}) => {
  try {
    const response = await axiosInstance.get(`/orders/my`, {
      params: {
        status,
        paymentStatus,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
      },
    });

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    throw new Error(message);
  }
};

export const uploadPaymentProofToBackend = async (data: {
  orderId: string;
  imageUrl: string;
}) => {
  try {
    const response = await axiosInstance.post(`/orders/upload-proof`, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    throw new Error(message);
  }
};

// ✅ GET ALL ORDERS (Admin only)
export const getAllOrdersAdmin = async (query?: {
  status?: keyof typeof OrderStatus;
  paymentStatus?: keyof typeof PaymentStatus;
  search?: string;
  userId?: string;
  deliveryId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrderType;
  dateFrom?: string;
  dateTo?: string;
}) => {
  try {
    const response = await axiosInstance.get(`/orders`, { params: query });
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch all orders";
    throw new Error(message);
  }
};

// ✅ ADMIN REVIEW PAYMENT PROOF
export const adminReviewPaymentProof = async (data: {
  proofId: string;
  approved: boolean;
  note?: string;
}) => {
  try {
    const response = await axiosInstance.patch(`/orders/admin/review`, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to review payment proof";
    throw new Error(message);
  }
};

// ✅ ASSIGN DELIVERY (Admin)
export const assignDelivery = async (data: {
  orderId: string;
  deliveryUserId: string;
}) => {
  try {
    const response = await axiosInstance.patch(`/orders/assign-delivery`, data);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to assign delivery";
    throw new Error(message);
  }
};

// ✅ DELIVERY COMPLETE (Delivery role)
export const markDeliveryComplete = async (data: { orderId: string }) => {
  try {
    const response = await axiosInstance.patch(
      `/orders/delivery-complete`,
      data
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to mark delivery as complete";
    throw new Error(message);
  }
};

// ✅ CUSTOMER APPROVE DELIVERY
export const customerApproveDelivery = async (data: {
  orderId: string;
  approved: boolean;
  note?: string;
}) => {
  try {
    const response = await axiosInstance.patch(
      `/orders/customer-approve`,
      data
    );
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to approve delivery";
    throw new Error(message);
  }
};

// ✅ CANCEL ORDER (Customer)
export const cancelOrder = async (data: {
  orderId: string;
  reason?: string;
}) => {
  try {
    const response = await axiosInstance.patch(`/orders/cancel`, data);

    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.details?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to cancel order";
    throw new Error(message);
  }
};
