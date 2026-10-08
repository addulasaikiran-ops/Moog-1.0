"use client";

import { useEffect, useMemo, useState } from "react";
import CodeViewer from "./CodeViewer";

type Payload = {
  language: string;
  text: string;
  imageMime: string | null;
  imageName: string | null;
  imageData: string | null;
};

export default function ViewOnceContent({ token }: { token: string }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/shares/${token}/consume`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("unavailable");
        return response.json() as Promise<Payload>;
      })
      .then((data) => {
        if (active) setPayload(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const imageSrc = useMemo(
    () => payload?.imageData && payload.imageMime
      ? `data:${payload.imageMime};base64,${payload.imageData}`
      : null,
    [payload],
  );

  if (failed) {
    return <div className="minimalContent viewOnceState"><div className="viewOnceStateIcon" aria-hidden="true">!</div><strong>This one-time share could not be opened.</strong><p>Please create a new share if the content is still needed.</p></div>;
  }

  if (!payload) {
    return <div className="minimalContent viewOnceState" aria-live="polite"><div className="statusSpinner" aria-hidden="true" /><strong>Revealing private content…</strong><p>This one-time share is being opened securely.</p></div>;
  }

  return (
    <>
      <div className="minimalContent">
        {payload.language === "photo" && imageSrc ? (
          <div className="minimalPhoto">
            <img src={imageSrc} alt={payload.text || "Shared photo"} />
            {payload.text ? <p>{payload.text}</p> : null}
          </div>
        ) : payload.language === "text" ? (
          <p className="minimalText">{payload.text}</p>
        ) : (
          <CodeViewer text={payload.text} language={payload.language} />
        )}
      </div>

      <div className="minimalActions">
        <div className="minimalActionGroup">
          {payload.language === "photo" && imageSrc ? (
            <a
              className="minimalAction primaryAction"
              href={imageSrc}
              download={payload.imageName || "image"}
            >
              Download
            </a>
          ) : (
            <span className="minimalActionNote"><strong>Viewed once</strong> · this share is now consumed</span>
          )}
        </div>
        <a className="minimalNewShare" href="/">New share <span>→</span></a>
      </div>
    </>
  );
}
