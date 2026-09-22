import { getDistrictByName, getStateByName, getDistricts, locationDistricts, locationStates } from '../data/locations'

export function normalizeLocation(stateName: string, districtName: string) {
  const state = getStateByName(stateName)
  const district = state ? getDistrictByName(state.id, districtName) : undefined
  return { stateId: state?.id, districtId: district?.id, stateName: state?.name ?? stateName, districtName: district?.name ?? districtName, reviewRequired: Boolean(state && !district) || !state }
}

export function isValidLocation(stateId: string, districtId: string) {
  return locationStates.some(state => state.id === stateId) && locationDistricts.some(district => district.id === districtId && district.stateId === stateId)
}

export { getDistricts, getStateByName }
