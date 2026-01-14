"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  User,
  Phone,
  Package,
  CreditCard,
  Truck,
  Check,
  X,
  Search,
  ZoomIn,
  Download,
  Mail,
  Calendar,
  MapPin,
  Clock,
  XCircle,
} from "lucide-react";
import {
  getSingleOrder,
  assignDelivery,
  adminReviewPaymentProof,
  OrderStatus,
  PaymentStatus,
  cancelOrder,
} from "@/utils/api/order";
import { getAllUsers, Role } from "@/utils/api/user";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    stock: number;
    categorySlug: string;
    createdAt: string;
    updatedAt: string;
  };
  variant: {
    name: string;
    price: number;
    image: string;
  } | null;
}

interface PaymentProof {
  id: string;
  imageUrl: string;
  note: string | null;
  approved: boolean | null;
  reviewedById: string | null;
  reviewedAt: string | null;
}

interface OrderUser {
  firstName: string;
  lastName: string;
  phone: string;
  image: string;
  id: string;
}

interface DeliveryPerson {
  id: string;
  firstName: string;
  lastName: string;
  image: string;
  phone: string;
}

interface Order {
  id: string;
  userId: string;
  user: OrderUser;
  totalAmount: number;
  paymentStatus: keyof typeof PaymentStatus;
  status: keyof typeof OrderStatus;
  reasonForCancellation: string | null;
  deliveryId: string | null;
  deliveryCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  paymentProofs: PaymentProof[];
  delivery: DeliveryPerson | null;
}

interface DeliveryUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  image: string;
  role: string;
  otpVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
  const [isLoadingDeliveryUsers, setIsLoadingDeliveryUsers] = useState(false);
  const [selectedDeliveryUser, setSelectedDeliveryUser] = useState<string>("");
  const [isAssigningDelivery, setIsAssigningDelivery] = useState(false);
  const [isReviewingPayment, setIsReviewingPayment] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Check if we should show payment tab by default
  const showPaymentTab = searchParams.get("tab") === "payment";

  const CAN_REASSIGN_STATUSES = ["PENDING", "DELIVERING"];
  const CAN_CANCEL_STATUSES = ["PENDING"];

  const canReassign =
    order?.delivery && CAN_REASSIGN_STATUSES.includes(order.status);
  const canCancelOrder = order && CAN_CANCEL_STATUSES.includes(order.status);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const orderData = await getSingleOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryUsers = async (search?: string) => {
    setIsLoadingDeliveryUsers(true);
    try {
      const query: any = {
        role: Role.DELIVERY,
        limit: 50,
      };
      if (search) query.search = search;

      const response = await getAllUsers(query);
      setDeliveryUsers(response.data);
    } catch (error) {
      console.error("Error fetching delivery users:", error);
    } finally {
      setIsLoadingDeliveryUsers(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchDeliveryUsers();
    }
  }, [orderId]);

  const handleAssignDelivery = async () => {
    if (!selectedDeliveryUser) return;

    setIsAssigningDelivery(true);
    try {
      await assignDelivery({
        orderId: orderId,
        deliveryUserId: selectedDeliveryUser,
      });
      await fetchOrder(); // Refresh order data
      setAssignDialogOpen(false);
      setSelectedDeliveryUser("");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign delivery");
      // console.error("Error assigning delivery:", error);
    } finally {
      setIsAssigningDelivery(false);
    }
  };

  const handleReviewPaymentProof = async (approved: boolean) => {
    if (!selectedProof) return;

    setIsReviewingPayment(true);
    try {
      await adminReviewPaymentProof({
        proofId: selectedProof.id,
        approved,
        note: reviewNote || undefined,
      });
      await fetchOrder(); // Refresh order data
      setReviewDialogOpen(false);
      setSelectedProof(null);
      setReviewNote("");
    } catch (error) {
      console.error("Error reviewing payment proof:", error);
    } finally {
      setIsReviewingPayment(false);
    }
  };

  const handleSearchDeliveryUsers = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeliveryUsers(searchTerm);
  };

  const getStatusBadge = (status: keyof typeof OrderStatus) => {
    const statusConfig = {
      PENDING: {
        variant: "secondary" as const,
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800",
      },
      DELIVERING: {
        variant: "default" as const,
        label: "Delivering",
        className: "bg-blue-100 text-blue-800",
      },
      DELIVERED: {
        variant: "default" as const,
        label: "Delivered",
        className: "bg-green-100 text-green-800",
      },
      CANCELLED: {
        variant: "destructive" as const,
        label: "Cancelled",
        className: "bg-red-100 text-red-800",
      },
    };
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: keyof typeof PaymentStatus) => {
    const statusConfig = {
      PENDING: {
        variant: "secondary" as const,
        label: "Pending",
        className: "bg-yellow-100 text-yellow-800",
      },
      APPROVED: {
        variant: "default" as const,
        label: "Approved",
        className: "bg-green-100 text-green-800",
      },
      DECLINED: {
        variant: "destructive" as const,
        label: "Declined",
        className: "bg-red-100 text-red-800",
      },
    };
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return (
      order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      0
    );
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.warning("Please provide a cancellation reason");
      return;
    }

    setIsCancelling(true);
    try {
      await cancelOrder({
        orderId,
        reason: cancelReason,
      });

      toast.success("Order cancelled successfully");
      await fetchOrder();

      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
        <Button onClick={() => router.push("/admin/orders")} className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/orders")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-gray-600">Order ID: {order.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items & Payment Proofs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 last:pb-0 last:border-0 border-b"
                  >
                    <img
                      src={item.variant?.image || item.product.image}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">
                        {item.product.name}
                      </h4>
                      {item.variant && (
                        <p className="text-sm text-gray-600">
                          {item.variant.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Product ID: {item.product.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Proofs */}
          {(showPaymentTab || order.paymentProofs.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Proofs ({order.paymentProofs.length})
                </CardTitle>
                <CardDescription>
                  Review and manage payment proofs for this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {order.paymentProofs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No payment proofs uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.paymentProofs.map((proof, index) => (
                      <div key={proof.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge
                            variant={
                              proof.approved === true
                                ? "default"
                                : proof.approved === false
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {proof.approved === true
                              ? "Approved"
                              : proof.approved === false
                              ? "Declined"
                              : "Pending Review"}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            #{index + 1}
                          </span>
                        </div>

                        <div
                          className="cursor-pointer mb-3"
                          onClick={() => {
                            setSelectedProof(proof);
                            setImageDialogOpen(true);
                          }}
                        >
                          <img
                            src={proof.imageUrl}
                            alt={`Payment proof ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
                          />
                          <div className="flex justify-center mt-2">
                            <ZoomIn className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>

                        {proof.note && (
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Note:</strong> {proof.note}
                          </p>
                        )}

                        {proof.reviewedAt && (
                          <p className="text-xs text-gray-500">
                            Reviewed: {formatDate(proof.reviewedAt)}
                          </p>
                        )}

                        {proof.approved === null && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              setSelectedProof(proof);
                              setReviewDialogOpen(true);
                            }}
                          >
                            Review Proof
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Order Info & Actions */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order Status:</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Payment Status:</span>
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created:
                  </span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Updated:
                  </span>
                  <span>{formatDate(order.updatedAt)}</span>
                </div>
                {order.deliveryCompletedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Delivered:
                    </span>
                    <span>{formatDate(order.deliveryCompletedAt)}</span>
                  </div>
                )}
              </div>
              <Separator />
              {canCancelOrder && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}

              {order.status === "CANCELLED" && (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      Order Cancelled
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cancellation Reason
                      </p>
                      <p className="font-medium">
                        {order.reasonForCancellation || "No reason provided"}
                      </p>
                    </div>
                    {/* 
                    {order.cancelledAt && (
                      <p className="text-xs text-muted-foreground">
                        Cancelled on{" "}
                        {new Date(order.cancelledAt).toLocaleString()}
                      </p>
                    )} */}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <AlertDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Please provide a reason for
                  cancelling this order.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4">
                <Textarea
                  placeholder="Reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setCancelDialogOpen(false);
                    setCancelReason("");
                  }}
                >
                  Back
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isCancelling ? "Cancelling..." : "Confirm Cancel"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {order.user.image ? (
                  <img
                    src={order.user.image}
                    alt={`${order.user.firstName} ${order.user.lastName}`}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.user.phone}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {order.status !== "CANCELLED" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.delivery ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {order.delivery.image ? (
                        <img
                          src={order.delivery.image}
                          alt={`${order.delivery.firstName} ${order.delivery.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {order.delivery.firstName} {order.delivery.lastName}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {order.delivery.phone}
                        </p>
                      </div>
                      {/* Reassign button */}
                      {canReassign && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssignDialogOpen(true)}
                        >
                          Reassign
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Assigned
                      </Badge>
                      {order.status === "DELIVERING" && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <X className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="font-medium text-yellow-600">
                      No Delivery Assigned
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Assign a delivery person to proceed
                    </p>
                    <Button
                      onClick={() => setAssignDialogOpen(true)}
                      className="w-full"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Assign Delivery
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="flex justify-center">
              <img
                src={selectedProof.imageUrl}
                alt="Payment proof"
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Delivery Person</DialogTitle>
            <DialogDescription>
              Select a delivery person to assign to this order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <form onSubmit={handleSearchDeliveryUsers} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search delivery persons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            {/* Delivery Users List */}
            {isLoadingDeliveryUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : deliveryUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No delivery persons found</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {deliveryUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedDeliveryUser === user.id
                        ? "bg-green-300/10 border-green-500"
                        : ""
                    }`}
                    onClick={() => setSelectedDeliveryUser(user.id)}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                    {selectedDeliveryUser === user.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignDelivery}
                disabled={!selectedDeliveryUser || isAssigningDelivery}
                className="flex-1"
              >
                {isAssigningDelivery ? "Assigning..." : "Assign Delivery"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Payment Proof Dialog */}
      <AlertDialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Review Payment Proof</AlertDialogTitle>
            <AlertDialogDescription>
              Please review the payment proof and provide any necessary notes.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Review Note (Optional)
              </label>
              <Input
                placeholder="Add any notes about this payment proof..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setReviewDialogOpen(false);
                setReviewNote("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => handleReviewPaymentProof(false)}
              disabled={isReviewingPayment}
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={() => handleReviewPaymentProof(true)}
              disabled={isReviewingPayment}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
