type Props = {
  status: "IN_PRODUCTION" | "FULFILLED" | "CANCELLED";
  trackingNumber?: string;
  trackUrl: string;
};

const wrapper: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  backgroundColor: "#000000",
  color: "#ffffff",
  padding: "32px",
};

const detail: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.7)",
  marginBottom: "8px",
};

const button: React.CSSProperties = {
  display: "inline-block",
  marginTop: "16px",
  padding: "12px 24px",
  border: "1px solid rgba(255,255,255,0.3)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "13px",
};

const COPY = {
  IN_PRODUCTION: {
    heading: "Production has started",
    body: "The studio has started making your piece.",
  },
  FULFILLED: {
    heading: "Your order has shipped",
    body: "Your order is on its way.",
  },
  CANCELLED: {
    heading: "Your order was cancelled",
    body: "Your order has been cancelled. Please contact us if you have any questions.",
  },
} as const;

export default function OrderStatusUpdateEmail({ status, trackingNumber, trackUrl }: Props) {
  const { heading, body } = COPY[status];

  return (
    <div style={wrapper}>
      <p style={{ fontSize: "22px", fontWeight: 300, marginBottom: "16px" }}>{heading}</p>
      <p style={detail}>{body}</p>
      {trackingNumber && <p style={detail}>Tracking number: {trackingNumber}</p>}
      <a href={trackUrl} style={button}>
        View order status
      </a>
    </div>
  );
}
