import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white font-mono p-4">
      <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-sm text-gray-400 mb-6">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="px-4 py-2 bg-white text-black font-semibold rounded hover:bg-opacity-80 transition">
        Return Home
      </Link>
    </div>
  );
}
