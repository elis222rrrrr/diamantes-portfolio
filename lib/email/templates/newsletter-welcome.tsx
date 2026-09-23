type Props = {
  unsubscribeUrl: string;
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

const link: React.CSSProperties = {
  color: "rgba(255,255,255,0.4)",
  fontSize: "12px",
};

export default function NewsletterWelcomeEmail({ unsubscribeUrl }: Props) {
  return (
    <div style={wrapper}>
      <p style={heading}>You&apos;re subscribed</p>
      <p style={detail}>
        Thanks for signing up, you&apos;ll hear from Diamantes 3Designs about new arrivals,
        projects, and studio news.
      </p>
      <p style={{ marginTop: "24px" }}>
        <a href={unsubscribeUrl} style={link}>
          Unsubscribe
        </a>
      </p>
    </div>
  );
}
