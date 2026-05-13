interface AppEmbedProps {
  appName: string;
  title?: string;
  height?: number;
}

export default function AppEmbed({ appName, title, height = 500 }: AppEmbedProps) {
  return (
    <div className="app-embed">
      <iframe
        src={`/apps/${appName}/`}
        title={title ?? appName}
        height={height}
        style={{ width: "100%", border: "none", display: "block" }}
        loading="lazy"
      />
      <div className="app-embed-footer">
        <a href={`/apps/${appName}/`} target="_blank" rel="noopener noreferrer">
          Open in full page →
        </a>
      </div>
    </div>
  );
}
