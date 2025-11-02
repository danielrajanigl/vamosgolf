export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600">Willkommen im Admin-Bereich! 🎉</p>
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Reisen</h2>
          <p className="text-gray-600">Verwalte deine Golfreisen</p>
        </div>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Buchungen</h2>
          <p className="text-gray-600">Übersicht aller Buchungen</p>
        </div>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Termine</h2>
          <p className="text-gray-600">Verwalte Reisetermine</p>
        </div>
      </div>
    </div>
  );
}
