import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mesh-gradient relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-dot-grid absolute inset-0 opacity-40" />
        <div className="bg-diagonal-lines absolute inset-0" />
        <div className="bg-noise absolute inset-0" />

        <div
          className="animate-aurora absolute -top-48 -left-48 size-[700px] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.38 0.15 265 / 0.12) 0%, oklch(0.38 0.15 265 / 0.04) 40%, transparent 70%)",
          }}
        />
        <div
          className="animate-aurora absolute -right-48 -bottom-56 size-[800px] rounded-full opacity-60 blur-3xl"
          style={{
            animationDelay: "-8s",
            animationDuration: "30s",
            background:
              "radial-gradient(circle, oklch(0.50 0.12 200 / 0.10) 0%, oklch(0.50 0.12 200 / 0.03) 45%, transparent 70%)",
          }}
        />
        <div
          className="animate-aurora absolute top-1/3 left-1/2 size-[500px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            animationDelay: "-15s",
            animationDuration: "35s",
            background:
              "radial-gradient(circle, oklch(0.55 0.10 280 / 0.07) 0%, oklch(0.45 0.08 320 / 0.03) 40%, transparent 65%)",
          }}
        />

        <div
          className="animate-float-1 absolute top-[8%] left-[12%] size-[180px] rounded-full opacity-80 blur-xl"
          style={{
            background: "radial-gradient(circle, oklch(0.42 0.14 260 / 0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-float-2 absolute top-[65%] right-[8%] size-[220px] rounded-full opacity-70 blur-xl"
          style={{
            background: "radial-gradient(circle, oklch(0.52 0.10 190 / 0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-float-3 absolute bottom-[15%] left-[20%] size-[160px] rounded-full opacity-60 blur-xl"
          style={{
            background: "radial-gradient(circle, oklch(0.48 0.12 300 / 0.10) 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-drift absolute top-[20%] right-[25%] size-[140px] rounded-full opacity-50 blur-xl"
          style={{
            background: "radial-gradient(circle, oklch(0.55 0.08 160 / 0.09) 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-float-2 absolute top-[50%] left-[5%] size-[120px] rounded-full opacity-50 blur-lg"
          style={{
            animationDelay: "-5s",
            background: "radial-gradient(circle, oklch(0.40 0.10 240 / 0.10) 0%, transparent 70%)",
          }}
        />

        <div
          className="animate-float-1 absolute top-[12%] left-[18%] size-2 rounded-full"
          style={{ background: "oklch(0.42 0.14 265 / 0.15)" }}
        />
        <div
          className="animate-float-3 absolute top-[25%] right-[15%] size-1.5 rounded-full"
          style={{
            background: "oklch(0.50 0.10 200 / 0.18)",
            animationDelay: "-3s",
          }}
        />
        <div
          className="animate-drift absolute top-[45%] left-[8%] size-1 rounded-full"
          style={{
            background: "oklch(0.55 0.12 280 / 0.12)",
            animationDelay: "-7s",
          }}
        />
        <div
          className="animate-float-1 absolute top-[70%] right-[12%] size-2.5 rounded-full"
          style={{
            background: "oklch(0.38 0.15 265 / 0.10)",
            animationDelay: "-2s",
          }}
        />
        <div
          className="animate-float-2 absolute bottom-[20%] left-[25%] size-1.5 rounded-full"
          style={{
            background: "oklch(0.48 0.08 180 / 0.14)",
            animationDelay: "-4s",
          }}
        />
        <div
          className="animate-drift absolute top-[35%] left-[45%] size-1 rounded-full"
          style={{
            background: "oklch(0.45 0.10 320 / 0.10)",
            animationDelay: "-6s",
          }}
        />
        <div
          className="animate-float-3 absolute top-[80%] left-[60%] size-2 rounded-full"
          style={{
            background: "oklch(0.40 0.12 240 / 0.12)",
            animationDelay: "-9s",
          }}
        />
        <div
          className="animate-float-1 absolute top-[15%] right-[40%] size-1.5 rounded-full"
          style={{
            background: "oklch(0.52 0.08 160 / 0.10)",
            animationDelay: "-1s",
          }}
        />
        <div
          className="animate-drift absolute right-[35%] bottom-[35%] size-1 rounded-full"
          style={{
            background: "oklch(0.38 0.15 265 / 0.12)",
            animationDelay: "-8s",
          }}
        />

        <svg
          className="animate-float-2 absolute top-[18%] left-[22%] size-16 opacity-[0.04]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          style={{
            color: "oklch(0.38 0.15 265)",
            animationDelay: "-4s",
          }}
        >
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="15" />
        </svg>
        <svg
          className="animate-float-3 absolute right-[18%] bottom-[22%] size-20 opacity-[0.03]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          style={{
            color: "oklch(0.50 0.10 200)",
            animationDelay: "-6s",
          }}
        >
          <rect x="15" y="15" width="70" height="70" rx="8" />
          <rect x="25" y="25" width="50" height="50" rx="5" />
          <rect x="35" y="35" width="30" height="30" rx="3" />
        </svg>
        <svg
          className="animate-drift absolute top-[55%] left-[10%] size-14 opacity-[0.03]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          style={{
            color: "oklch(0.45 0.12 280)",
            animationDelay: "-10s",
          }}
        >
          <polygon points="50,5 95,75 5,75" />
          <polygon points="50,25 80,70 20,70" />
        </svg>
      </div>

      <div className="animate-scale-in relative w-full max-w-sm">
        <div className="glass-card gradient-border rounded-2xl p-7 shadow-2xl shadow-black/[0.04]">
          <div className="mb-6 text-center">
            <h1 className="text-foreground text-xl font-bold tracking-tight">Login</h1>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
