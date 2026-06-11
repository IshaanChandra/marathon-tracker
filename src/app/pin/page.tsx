"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PinForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      router.replace(params.get("from") ?? "/");
      router.refresh();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-[60dvh] grid place-items-center">
      <form onSubmit={submit} className="card p-6 w-full max-w-xs text-center space-y-4">
        <div>
          <div className="text-2xl">🗽</div>
          <h1 className="font-bold mt-1">NYC 26.2</h1>
          <p className="text-sm text-foreground/50">Enter your PIN</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          className={`w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 ${
            error ? "border-rose-400 ring-rose-200" : "border-black/10 focus:ring-foreground/20"
          }`}
        />
        {error && <p className="text-sm text-rose-600 font-medium">Wrong PIN — try again</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-foreground text-background py-3 font-semibold text-sm"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

export default function PinPage() {
  return (
    <Suspense>
      <PinForm />
    </Suspense>
  );
}
