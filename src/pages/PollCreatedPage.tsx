import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";

export default function PollCreatedPage() {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const voteLink = `${window.location.origin}/vote/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(voteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-3rem)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-indigo-600/80">Poll created</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Your poll is ready</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">Share this link with your audience so they can vote right away.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm shadow-slate-200/20">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Poll link</p>
          <p className="mt-4 break-all text-sm text-slate-900">{voteLink}</p>

          <div className="mx-auto my-6 inline-flex overflow-hidden rounded-3xl border border-slate-200 bg-white p-4">
            <QRCodeCanvas value={voteLink} size={180} bgColor="#f8fafc" fgColor="#4f46e5" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-6 w-full rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {copied ? "Link copied!" : "Copy poll link"}
        </button>
      </div>
    </div>
  );
}
