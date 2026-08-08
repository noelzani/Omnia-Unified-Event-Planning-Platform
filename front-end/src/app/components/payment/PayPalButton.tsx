import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";

type Props = {
  amount: string;
  onSuccess: (paypalOrderId: string) => void;
};

export default function PayPalButton({ amount, onSuccess }: Props) {
  const formattedAmount = Number(amount).toFixed(2);

  return (
    <PayPalButtons
      style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
      createOrder={(_, actions) => {
        return actions.order.create({
          intent: "CAPTURE",
          purchase_units: [{ amount: { currency_code: "EUR", value: formattedAmount } }],
        });
      }}
      onApprove={async (data) => {
        try {
          const response = await fetch(
            "https://mpjrlqqkyyuobnhplfyh.supabase.co/functions/v1/paypal-capture",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ orderId: data.orderID }),
            }
          );
          const result = await response.json();
          if (!response.ok) {
            console.error("CAPTURE FAILED:", result);
            toast.error("Payment capture failed. Please contact support.");
            return;
          }
          onSuccess(result.id);
        } catch (err) {
          console.error(err);
          toast.error("Payment failed. Please try again.");
        }
      }}
      onError={(err) => {
        console.error("PayPal error:", err);
        toast.error("Payment failed. Please try again.");
      }}
    />
  );
}
