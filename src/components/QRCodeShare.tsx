import { QRCodeSVG } from 'qrcode.react';

interface QRCodeShareProps {
  value: string;
}

export default function QRCodeShare({ value }: QRCodeShareProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
      <QRCodeSVG value={value} size={180} includeMargin={true} />
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(value)}
        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
      >
        Copy link
      </button>
    </div>
  );
}
