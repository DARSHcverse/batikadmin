import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="font-display text-4xl text-brand">Not found</h1>
      <p className="mt-2 text-ink/70">That product may have been deleted.</p>
      <Link href="/products" className="btn btn-primary mt-6">
        Back to products
      </Link>
    </div>
  );
}
