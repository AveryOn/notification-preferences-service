import { Inject, Injectable } from '~/core/di'
import {
  DefaultPreferenceNotFoundError,
  type PreferenceSelector,
  PreferenceReferenceNotFoundError,
  PreferencesNotInitializedError,
  type UpdatePreferenceInput,
  type UserPreference
} from '~/modules/v1/preferences/domain/preferences.types'
import { PreferencesRepositoryPort } from '~/modules/v1/preferences/ports/preferences.repo.port'
import { PreferencesServicePort } from '~/modules/v1/preferences/ports/preferences.service.port'

@Injectable()
export class PreferencesService extends PreferencesServicePort {
  constructor(
    @Inject(PreferencesRepositoryPort)
    private readonly repository: PreferencesRepositoryPort
  ) {
    super()
  }

  initialize(userId: string): Promise<UserPreference[]> {
    return this.repository.initialize(userId)
  }

  async getByUserId(userId: string): Promise<UserPreference[]> {
    const preferences = await this.repository.findAllByUserId(userId)

    if (preferences.length === 0) {
      throw new PreferencesNotInitializedError(userId)
    }

    return preferences
  }

  async update(
    userId: string,
    input: UpdatePreferenceInput
  ): Promise<UserPreference> {
    await this.assertInitialized(userId)

    const preference = await this.repository.update(userId, input)

    if (!preference) {
      throw new PreferenceReferenceNotFoundError(
        'Notification type or channel was not found'
      )
    }

    return preference
  }

  async reset(
    userId: string,
    selector: PreferenceSelector
  ): Promise<UserPreference> {
    await this.assertInitialized(userId)

    const preference = await this.repository.resetToDefault(
      userId,
      selector
    )

    if (!preference) {
      throw new DefaultPreferenceNotFoundError(
        'Default preference was not found'
      )
    }

    return preference
  }

  private async assertInitialized(userId: string): Promise<void> {
    const preferences = await this.repository.findAllByUserId(userId)

    if (preferences.length === 0) {
      throw new PreferencesNotInitializedError(userId)
    }
  }
}
