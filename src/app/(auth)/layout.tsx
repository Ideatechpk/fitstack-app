export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Fit<span className="text-brand-coral">Stack</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Business Operations System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
