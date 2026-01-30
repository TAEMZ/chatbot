export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center p-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Demo Landing Page
                </h1>
                <p className="text-gray-600 mb-6">
                    To access a demo, navigate to: <code className="bg-gray-200 px-2 py-1 rounded">/demo/[your-token]</code>
                </p>
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                    <h2 className="text-xl font-semibold mb-3">Example:</h2>
                    <a
                        href="/demo/test-token-123"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        /demo/test-token-123
                    </a>
                </div>
            </div>
        </div>
    );
}
