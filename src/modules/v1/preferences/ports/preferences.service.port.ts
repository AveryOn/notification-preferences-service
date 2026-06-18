import type {
  PreferenceSelector,
  UpdatePreferenceInput,
  UserPreference
} from '~/modules/v1/preferences/domain/preferences.types'

export abstract class PreferencesServicePort {
  abstract initialize(userId: string): Promise<UserPreference[]>
  abstract getByUserId(userId: string): Promise<UserPreference[]>
  abstract update(
    userId: string,
    input: UpdatePreferenceInput
  ): Promise<UserPreference>
  abstract reset(
    userId: string,
    selector: PreferenceSelector
  ): Promise<UserPreference>
}
