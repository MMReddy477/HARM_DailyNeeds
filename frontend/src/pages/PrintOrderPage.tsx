import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Upload } from "lucide-react";

import QuickContact from "@/components/QuickContact";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PrintOrder } from "@/lib/types";

export default function PrintOrderPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [copies, setCopies] = useState("1");
  const [color, setColor] = useState(false);
  const [binding, setBinding] = useState(false);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      Object.entries({ name, phone, copies, color: String(color), binding: String(binding), notes }).forEach(([k, v]) => form.append(k, v));
      form.append("file", file as File);
      // multipart upload — the JSON api.ts helpers don't apply here
      const res = await fetch("/api/print-orders", { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as PrintOrder & { detail?: unknown };
      if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : "Upload failed — please check the form");
      return body;
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Upload failed"),
  });

  if (submit.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center" data-testid="print-order-success">
        <CheckCircle2 className="mx-auto size-14 text-emerald-500" />
        <h1 className="mt-4 font-heading text-2xl font-extrabold text-purple-950">Order received!</h1>
        <p className="mt-2 text-slate-600">Your pickup code is</p>
        <p className="mt-1 font-heading text-4xl font-extrabold text-purple-800" data-testid="print-order-code">{submit.data.code}</p>
        <p className="mt-4 text-slate-600">We'll WhatsApp you on +{submit.data.phone} as soon as your printout is ready. Pay at the counter when you collect.</p>
      </div>
    );
  }

  return (
    <>
      <section className="bg-[#3B0764]">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Print Online · Collect in Store</p>
          <h1 className="mt-1.5 font-heading text-3xl font-extrabold text-white sm:text-4xl">Send Your Print Order</h1>
          <p className="mt-2 max-w-2xl text-purple-200">Upload your PDF, Word, PowerPoint or photo. We print it and WhatsApp you when it's ready — skip the queue!</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <form className="space-y-4 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm" onSubmit={(e) => { e.preventDefault(); setError(""); submit.mutate(); }} data-testid="print-order-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="po-name">Your Name</Label><Input id="po-name" value={name} onChange={(e) => setName(e.target.value)} data-testid="print-order-name-input" /></div>
            <div className="space-y-1.5"><Label htmlFor="po-phone">WhatsApp Number</Label><Input id="po-phone" inputMode="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="print-order-phone-input" /></div>
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/50 px-4 py-8 text-center hover:border-purple-400" data-testid="print-order-file-dropzone">
            <Upload className="size-8 text-purple-500" />
            <span className="font-semibold text-purple-900">{file ? file.name : "Tap to choose a file"}</span>
            <span className="text-xs text-slate-500">PDF, DOC/DOCX, PPT/PPTX, JPG, PNG · up to 20 MB</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="print-order-file-input" />
          </label>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-2"><Label htmlFor="po-copies">Copies</Label><Input id="po-copies" type="number" min={1} max={500} value={copies} onChange={(e) => setCopies(e.target.value)} className="w-20" data-testid="print-order-copies-input" /></div>
            <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={color} onCheckedChange={(v) => setColor(Boolean(v))} data-testid="print-order-color-checkbox" /> Colour print</label>
            <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={binding} onCheckedChange={(v) => setBinding(Boolean(v))} data-testid="print-order-binding-checkbox" /> Spiral binding</label>
          </div>
          <div className="space-y-1.5"><Label htmlFor="po-notes">Notes (optional)</Label><Textarea id="po-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. pages 1-10 only, double side" data-testid="print-order-notes-input" /></div>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" data-testid="print-order-error">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full" disabled={!name.trim() || !phone.trim() || !file || submit.isPending} data-testid="print-order-submit-button">{submit.isPending ? "Uploading…" : "Send Print Order"}</Button>
        </form>
      </section>
      <QuickContact />
    </>
  );
}
