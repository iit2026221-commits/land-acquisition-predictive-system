export type LocationState = { id: string; name: string; code: string }
export type LocationDistrict = { id: string; name: string; stateId: string; code: string }

export const locationStates: LocationState[] = [
  ['andhra-pradesh', 'Andhra Pradesh', 'AP'], ['arunachal-pradesh', 'Arunachal Pradesh', 'AR'], ['assam', 'Assam', 'AS'], ['bihar', 'Bihar', 'BR'], ['chhattisgarh', 'Chhattisgarh', 'CG'], ['goa', 'Goa', 'GA'], ['gujarat', 'Gujarat', 'GJ'], ['haryana', 'Haryana', 'HR'], ['himachal-pradesh', 'Himachal Pradesh', 'HP'], ['jharkhand', 'Jharkhand', 'JH'], ['karnataka', 'Karnataka', 'KA'], ['kerala', 'Kerala', 'KL'], ['madhya-pradesh', 'Madhya Pradesh', 'MP'], ['maharashtra', 'Maharashtra', 'MH'], ['manipur', 'Manipur', 'MN'], ['meghalaya', 'Meghalaya', 'ML'], ['mizoram', 'Mizoram', 'MZ'], ['nagaland', 'Nagaland', 'NL'], ['odisha', 'Odisha', 'OD'], ['punjab', 'Punjab', 'PB'], ['rajasthan', 'Rajasthan', 'RJ'], ['sikkim', 'Sikkim', 'SK'], ['tamil-nadu', 'Tamil Nadu', 'TN'], ['telangana', 'Telangana', 'TS'], ['tripura', 'Tripura', 'TR'], ['uttar-pradesh', 'Uttar Pradesh', 'UP'], ['uttarakhand', 'Uttarakhand', 'UK'], ['west-bengal', 'West Bengal', 'WB'], ['delhi', 'Delhi', 'DL'],
].map(([id, name, code]) => ({ id, name, code }))

const districtEntries: [string, string, string][] = [
  ['rajasthan', 'Alwar', 'RJ-ALW'], ['jharkhand', 'Palamu', 'JH-PLM'], ['karnataka', 'Kolar', 'KA-KLR'], ['madhya-pradesh', 'Chhatarpur', 'MP-CHT'], ['uttar-pradesh', 'Prayagraj', 'UP-PRY'], ['odisha', 'Cuttack', 'OD-CTC'], ['andhra-pradesh', 'Nellore', 'AP-NLR'], ['gujarat', 'Vadodara', 'GJ-VAD'], ['assam', 'Dibrugarh', 'AS-DBR'], ['maharashtra', 'Nagpur', 'MH-NGP'], ['bihar', 'Saharsa', 'BR-SAH'], ['telangana', 'Nalgonda', 'TS-NLG'],
]
export const locationDistricts: LocationDistrict[] = districtEntries.map(([stateId, name, code]) => ({ id: `${stateId}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`, name, stateId, code }))

export function getStateByName(name: string) {
  return locationStates.find(state => state.name.toLowerCase() === name.trim().toLowerCase())
}

export function getDistrictByName(stateId: string, name: string) {
  return locationDistricts.find(district => district.stateId === stateId && district.name.toLowerCase() === name.trim().toLowerCase())
}

export function getDistricts(stateId: string) {
  return locationDistricts.filter(district => district.stateId === stateId)
}
