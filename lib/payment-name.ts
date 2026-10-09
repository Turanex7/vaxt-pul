const namesById: Record<string, string> = {
  netflix: 'netflix', youtube: 'youtube', spotify: 'spotify', 'azercell-tarif': 'azercellTariff',
  'azercell-paket': 'azercellPack', internet: 'internet', elektrik: 'electricity', qaz: 'gas',
  su: 'water', kredit: 'loan', taksit: 'installment', sigorta: 'insurance', texbaxis: 'inspection',
  idman: 'gym', kiraye: 'rent',
}

export function paymentNameKey(id: string): string | undefined {
  return namesById[id]
}
