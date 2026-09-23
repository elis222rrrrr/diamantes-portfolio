import { formatPriceCents } from "@/lib/shop/format";

type Props = {
  totalCents: number;
  currency: string;
  trackingToken: string;
  trackUrl: string;
};

const wrapper: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "32px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 300,
  marginBottom: "16px",
};

const detail: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.7)",
  marginBottom: "4px",
};

const button: React.CSSProperties = {
  display: "inline-block",
  marginTop: "24px",
  padding: "12px 24px",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "13px",
  letterSpacing: "0.05em",
};

export default function OrderConfirmationEmail({
  totalCents,
  currency,
  trackingToken,
  trackUrl,
}: Props) {
  return (
    <div style={wrapper}>
      <p style={heading}>Your order is confirmed</p>
      <p style={detail}>Thank you for your purchase.</p>
      <p style={detail}>Total: {formatPriceCents(totalCents, currency)}</p>
      <p style={{ ...detail, marginTop: "16px" }}>Order code: {trackingToken}</p>
      <p style={{ ...detail, marginTop: "16px" }}>Track your order status using the link below.</p>
      <a href={trackUrl} style={button}>
        Track order
      </a>
    </div>
  );
}
