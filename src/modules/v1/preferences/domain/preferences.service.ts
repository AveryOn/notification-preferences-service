import type { LoggerPort } from '~/shared/logger/logger.port'
import {
  type PreferenceSelector,
  type UpdatePreferenceInput,
  type UserPreference
} from '~/modules/v1/preferences/domain/preferences.types'

import { LOGGER_TOKEN } from '~/app/app.tokens'
import { Inject, Injectable } from '~/core/di'
import {
  DefaultPreferenceNotFoundError,
  PreferenceReferenceNotFoundError,
  PreferencesNotInitializedError
} from '~/modules/v1/preferences/domain/preferences.types'
import { PreferencesRepositoryPort } from '~/modules/v1/preferences/ports/preferences.repo.port'
import { PreferencesServicePort } from '~/modules/v1/preferences/ports/preferences.service.port'

@Injectable()
export class PreferencesService extends PreferencesServicePort {
  constructor(
    @Inject(PreferencesRepositoryPort)
    private readonly repository: PreferencesRepositoryPort,

    @Inject(LOGGER_TOKEN)
    private readonly logger: LoggerPort
  ) {
    super()
  }

  async initialize(userId: string): Promise<UserPreference[]> {
    const preferences = await this.repository.initialize(userId)

    this.logger.info(
      {
        event: 'notification_preferences_initialized',
        userId,
        preferencesCount: preferences.length
      },
      'Notification preferences initialized'
    )

    return preferences
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

    this.logger.info(
      {
        event: 'notification_preference_updated',
        userId,
        notificationType: preference.notificationTypeCode,
        channel: preference.channelCode,
        enabled: preference.enabled
      },
      'Notification preference updated'
    )

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

    this.logger.info(
      {
        event: 'notification_preference_reset',
        userId,
        notificationType: preference.notificationTypeCode,
        channel: preference.channelCode,
        enabled: preference.enabled
      },
      'Notification preference reset to default'
    )

    return preference
  }

  private async assertInitialized(userId: string): Promise<void> {
    const preferences = await this.repository.findAllByUserId(userId)

    if (preferences.length === 0) {
      throw new PreferencesNotInitializedError(userId)
    }
  }
}
