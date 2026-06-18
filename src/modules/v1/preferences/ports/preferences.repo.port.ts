import type {
  PreferenceSelector,
  UpdatePreferenceInput,
  UserPreference
} from '~/modules/v1/preferences/domain/preferences.types'

export abstract class PreferencesRepositoryPort {
  abstract initialize(userId: string): Promise<UserPreference[]>
  abstract findAllByUserId(userId: string): Promise<UserPreference[]>
  abstract update(
    userId: string,
    input: UpdatePreferenceInput
  ): Promise<UserPreference | null>
  abstract resetToDefault(
    userId: string,
    selector: PreferenceSelector
  ): Promise<UserPreference | null>
}
