"use client";
import { useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import { useAuth } from "@/components/AuthProvider";

export default function RevokeClient({ token, expiresAt }: { token: string; expiresAt: string }) {
  const { user, getIdToken } = useAuth();
  const [busy,setBusy]=useState(false); const [done,setDone]=useState(false); const [error,setError]=useState("");
  async function revoke() {
    if(!user||busy||done)return;
    if(!window.confirm("Revoke this share now? Anyone currently viewing it will lose access."))return;
    setBusy(true);setError("");
    try{
      const idToken=await getIdToken();
      const response=await fetch("/api/revokes/"+token,{method:"POST",headers:{Accept:"application/json",Authorization:"Bearer "+idToken}});
      const data=await response.json().catch(()=>({})) as {error?:string};
      if(!response.ok)throw new Error(data.error??"Could not revoke this share.");
      setDone(true);
    }catch(err){setError(err instanceof Error?err.message:"Could not revoke this share.");}
    finally{setBusy(false);}
  }
  return <><header className="viewerTopbar"><a className="minimalLogo" href="/">moog</a><div style={{display:"flex",alignItems:"center",gap:12}}><AuthPanel/><a className="newShareLink" href="/">New share <span>→</span></a></div></header>
    <section className="lockStage"><div className="lockIcon">SHARE CONTROL</div><div className="viewerEyebrow">{done?"SHARE REVOKED":"PRIVATE CONTROL LINK"}</div>
      <h1>{done?"This share is no longer available.":user?"Revoke this share?":"Sign in to manage this share."}</h1>
      <p>{done?"The public share link has been permanently disabled.":user?"Revoking it will immediately disable the public link, including password-protected and view-once access.":"Only the account that created this share can revoke it."}</p>
      {!done&&user?<section className="minimalCard passwordCard"><div className="lockForm"><div className="viewerLabel">LINK EXPIRES</div><div className="expiryDate">{new Date(expiresAt).toLocaleString()}</div><button className="primary" type="button" style={{width:"100%",marginTop:16}} onClick={()=>void revoke()} disabled={busy}>{busy?"Revoking…":"Revoke share"} <span>→</span></button>{error?<p className="error" role="alert"><span>!</span>{error}</p>:null}</div></section>:null}
      {!user&&!done?<div className="lockNote">Sign in above with the account that created this share.</div>:null}
    </section></>;
}