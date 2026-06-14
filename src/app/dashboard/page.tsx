import AlexandriaDashboard from '@/components/AlexandriaDashboard'
import MobileDashboardWrapper from '@/components/MobileDashboardWrapper'

export default function DashboardPage() {
  return (
    <>
      {/* Desktop — tidak berubah sama sekali */}
      <div className="hidden md:block">
        <AlexandriaDashboard />
      </div>

      {/* Mobile — tampilan baru */}
      <div className="flex md:hidden h-screen">
        <MobileDashboardWrapper />
      </div>
    </>
  )
}
