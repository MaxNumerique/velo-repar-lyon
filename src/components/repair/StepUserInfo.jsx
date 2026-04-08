import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AddressAutocomplete from '@/components/admin/AddressAutocomplete';

export function StepUserInfo({ data, updateData }) {
  const handleChange = (e) => {
    updateData({ [e.target.name]: e.target.value });
  };

  const handleAddressChange = (address) => {
    updateData({ address });
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900">Vos Informations</h2>
        <p className="text-sm text-slate-500">Dites-nous qui vous êtes pour que nous puissions vous contacter.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Jean"
            value={data.firstName || ''}
            onChange={handleChange}
            className="rounded-xl h-12"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Dupont"
            value={data.lastName || ''}
            onChange={handleChange}
            className="rounded-xl h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">N° Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="06 12 34 56 78"
          value={data.phone || ''}
          onChange={handleChange}
          className="rounded-xl h-12"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse de la réparation</Label>
        <AddressAutocomplete
          value={data.address || ''}
          onChange={handleAddressChange}
          placeholder="123 rue de la République, Lyon"
        />
      </div>
    </div>
  );
}
