import { ServiceForm } from '@/components/admin/ServiceForm'

export const metadata = {
  title: 'Modifier Forfait | Admin',
  description: 'Modifier une prestation existante'
}

export default async function EditServicePage({ params }) {
  const { id } = await params
  return <ServiceForm id={id} />
}
