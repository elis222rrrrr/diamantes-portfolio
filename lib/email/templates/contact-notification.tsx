type Props = {
  name: string;
  email: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
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

const messageBox: React.CSSProperties = {
  marginTop: "16px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.15)",
  fontSize: "14px",
  whiteSpace: "pre-wrap",
};

const link: React.CSSProperties = {
  color: "#8fb4ff",
};

export default function ContactNotificationEmail({
  name,
  email,
  message,
  attachmentUrl,
  attachmentName,
}: Props) {
  return (
    <div style={wrapper}>
      <p style={heading}>New contact message</p>
      <p style={detail}>From: {name}</p>
      <p style={detail}>Email: {email}</p>
      <div style={messageBox}>{message}</div>
      {attachmentUrl && (
        <p style={{ ...detail, marginTop: "16px" }}>
          Attachment:{" "}
          <a href={attachmentUrl} style={link}>
            {attachmentName ?? "view file"}
          </a>
        </p>
      )}
    </div>
  );
}
