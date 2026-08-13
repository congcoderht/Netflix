import Navbar from './Navbar'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
