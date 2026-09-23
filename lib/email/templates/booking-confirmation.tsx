type Props = {
  name: string;
  dateLabel: string;
  timeLabel: string;
  manageUrl: string;
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

export default function BookingConfirmationEmail({ name, dateLabel, timeLabel, manageUrl }: Props) {
  return (
    <div style={wrapper}>
      <p style={heading}>Your call is confirmed</p>
      <p style={detail}>Hi {name},</p>
      <p style={detail}>
        {dateLabel} at {timeLabel} (Greece time)
      </p>
      <p style={{ ...detail, marginTop: "16px" }}>
        We&apos;ll send a follow-up email with the call link shortly before your scheduled time.
      </p>
      <p style={{ ...detail, marginTop: "16px" }}>
        Need to cancel or pick a different time? Use the link below.
      </p>
      <a href={manageUrl} style={button}>
        Manage booking
      </a>
    </div>
  );
}
