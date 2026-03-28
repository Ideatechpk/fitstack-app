export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-green to-brand-blue rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-brand-green">Fit</span><span className="text-brand-blue">Stack</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">by Ideatech — Transform Your Ideas Into Technology</p>
        </div>
        {children}
      </div>
    </div>
  );
}
